-- ============================================================================
-- Fase 1 — passar o núcleo de negócio de chave-valor para tabelas relacionais
-- ============================================================================
--
-- Porquê: tudo vivia numa linha JSONB por assunto em `user_data`. Isso impede
-- colaboração (dois utilizadores a gravar o mesmo documento = o último apaga o
-- trabalho do primeiro), impede consultas e relatórios, e obriga a reescrever o
-- documento inteiro a cada gravação.
--
-- O que muda: negócios, transações e stock passam a tabelas próprias, com
-- partilha por projecto. O que é pessoal e nunca é partilhado — rotina,
-- tarefas, aprendizado, finanças pessoais e configurações — fica em
-- `user_data` por agora.
--
-- Esta migração é ADITIVA. Não apaga nem altera `user_data`: os dados antigos
-- ficam intactos e servem de rede de segurança. A app só passa a ler daqui
-- depois de ser adaptada.
-- ============================================================================


-- ─── Auxiliares ─────────────────────────────────────────────────────────────

-- Conversões tolerantes: os dados vêm de JSON escrito pelo browser ao longo de
-- meses e pode haver lá dentro texto onde se espera um número ou uma data.
-- Sem isto, um único valor estranho abortava a migração toda.

CREATE OR REPLACE FUNCTION public.safe_numeric(t text)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN COALESCE(t::numeric, 0);
EXCEPTION WHEN others THEN
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.safe_date(t text)
RETURNS date LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN t::date;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.safe_timestamptz(t text)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN COALESCE(t::timestamptz, now());
EXCEPTION WHEN others THEN
  RETURN now();
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- ─── profiles ───────────────────────────────────────────────────────────────
-- Necessária para convidar por email e para mostrar quem é cada colaborador.
-- `auth.users` não é legível pelo cliente.

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  nome       text,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (lower(email));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Quem já tem conta também precisa de perfil.
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ─── projects ───────────────────────────────────────────────────────────────
-- O que a app hoje chama "negócio". É a entidade que se partilha.

CREATE TABLE IF NOT EXISTS public.projects (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                text NOT NULL,
  descricao           text NOT NULL DEFAULT '',
  icon                text NOT NULL DEFAULT 'package',
  tipo                text NOT NULL DEFAULT 'produtos'
                      CHECK (tipo IN ('produtos', 'servicos', 'recorrente')),
  meta                numeric(14,2) NOT NULL DEFAULT 0,
  notas               text NOT NULL DEFAULT '',
  proximo_recebimento date,

  -- Totais anteriores à migração. As transações antigas foram apagadas pelo
  -- `enforceLogLimits`, por isso somar as que restam daria um número muito
  -- abaixo do real. O total mostrado é este valor + a soma das transações.
  receita_legado      numeric(14,2) NOT NULL DEFAULT 0,
  gastos_legado       numeric(14,2) NOT NULL DEFAULT 0,

  -- id que o negócio tinha dentro do JSON, para a migração ser repetível
  legacy_id           text,

  arquivado           boolean NOT NULL DEFAULT false,
  criado_em           timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_owner_idx ON public.projects (owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS projects_owner_legacy_idx
  ON public.projects (owner_id, legacy_id) WHERE legacy_id IS NOT NULL;

DROP TRIGGER IF EXISTS projects_set_updated_at ON public.projects;
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── project_members ────────────────────────────────────────────────────────
-- O dono NÃO está aqui: está em projects.owner_id. Esta tabela é só para
-- colaboradores convidados.

CREATE TABLE IF NOT EXISTS public.project_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  papel         text NOT NULL DEFAULT 'editor' CHECK (papel IN ('editor', 'leitor')),
  convidado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS project_members_user_idx ON public.project_members (user_id);
CREATE INDEX IF NOT EXISTS project_members_project_idx ON public.project_members (project_id);


-- ─── project_invites ────────────────────────────────────────────────────────
-- Convite por email a quem ainda pode nem ter conta.

CREATE TABLE IF NOT EXISTS public.project_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email         text NOT NULL,
  papel         text NOT NULL DEFAULT 'editor' CHECK (papel IN ('editor', 'leitor')),
  token         uuid NOT NULL DEFAULT gen_random_uuid(),
  convidado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estado        text NOT NULL DEFAULT 'pendente'
                CHECK (estado IN ('pendente', 'aceite', 'recusado', 'cancelado')),
  expira_em     timestamptz NOT NULL DEFAULT now() + interval '14 days',
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS project_invites_token_idx ON public.project_invites (token);
CREATE INDEX IF NOT EXISTS project_invites_email_idx ON public.project_invites (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS project_invites_pendente_idx
  ON public.project_invites (project_id, lower(email)) WHERE estado = 'pendente';


-- ─── Quem pode ver / editar ─────────────────────────────────────────────────
-- SECURITY DEFINER de propósito: estas funções são chamadas de dentro das
-- políticas RLS e têm de poder ler project_members sem voltar a passar pelas
-- políticas — senão a política de project_members chamaria a si própria.

CREATE OR REPLACE FUNCTION public.pode_ver_projecto(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM projects  WHERE id = p_project AND owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = p_project AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.pode_editar_projecto(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM projects WHERE id = p_project AND owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM project_members
                 WHERE project_id = p_project AND user_id = auth.uid() AND papel = 'editor');
$$;

CREATE OR REPLACE FUNCTION public.e_dono_do_projecto(p_project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM projects WHERE id = p_project AND owner_id = auth.uid());
$$;


-- ─── transactions ───────────────────────────────────────────────────────────
-- O antigo `log`, que era truncado a 7 registos dentro do JSON.

CREATE TABLE IF NOT EXISTS public.transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  criado_por  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo        text NOT NULL CHECK (tipo IN ('venda', 'gasto')),
  descricao   text NOT NULL DEFAULT '',
  valor       numeric(14,2) NOT NULL DEFAULT 0,
  custo       numeric(14,2) NOT NULL DEFAULT 0,
  cliente     text NOT NULL DEFAULT '',
  qty         integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  data        date NOT NULL DEFAULT CURRENT_DATE,
  origem      text NOT NULL DEFAULT 'manual'
              CHECK (origem IN ('manual', 'stock', 'divida')),
  legacy_id   text,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- O lucro é derivado, nunca guardado — assim não pode ficar dessincronizado.
CREATE INDEX IF NOT EXISTS transactions_project_data_idx
  ON public.transactions (project_id, data DESC, criado_em DESC);


-- ─── stock_items ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nome           text NOT NULL DEFAULT '',
  quantidade     integer NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  custo_unitario numeric(14,2) NOT NULL DEFAULT 0,
  preco_venda    numeric(14,2) NOT NULL DEFAULT 0,
  legacy_id      text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_items_project_idx ON public.stock_items (project_id);

DROP TRIGGER IF EXISTS stock_items_set_updated_at ON public.stock_items;
CREATE TRIGGER stock_items_set_updated_at BEFORE UPDATE ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── activity_log ───────────────────────────────────────────────────────────
-- "O fulano registou uma venda", "o fulano baixou o stock". É o que dá sentido
-- à colaboração: cada um vê o que o outro fez.

CREATE TABLE IF NOT EXISTS public.activity_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accao      text NOT NULL,          -- ex: 'venda.criou', 'stock.vendeu'
  entidade   text,                   -- ex: 'transaction', 'stock_item'
  detalhe    jsonb NOT NULL DEFAULT '{}',
  criado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_project_idx
  ON public.activity_log (project_id, criado_em DESC);


-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log     ENABLE ROW LEVEL SECURITY;

-- profiles: o próprio, e quem partilha projectos consigo
DROP POLICY IF EXISTS "perfil proprio ou de colaborador" ON public.profiles;
CREATE POLICY "perfil proprio ou de colaborador" ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.projects p
               WHERE p.owner_id = profiles.id AND public.pode_ver_projecto(p.id))
    OR EXISTS (SELECT 1 FROM public.project_members m
               WHERE m.user_id = profiles.id AND public.pode_ver_projecto(m.project_id))
  );
DROP POLICY IF EXISTS "actualizar perfil proprio" ON public.profiles;
CREATE POLICY "actualizar perfil proprio" ON public.profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- projects
DROP POLICY IF EXISTS "ver projectos a que tenho acesso" ON public.projects;
CREATE POLICY "ver projectos a que tenho acesso" ON public.projects FOR SELECT
  USING (owner_id = auth.uid() OR public.pode_ver_projecto(id));
DROP POLICY IF EXISTS "criar projectos proprios" ON public.projects;
CREATE POLICY "criar projectos proprios" ON public.projects FOR INSERT
  WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "editar projectos onde sou editor" ON public.projects;
CREATE POLICY "editar projectos onde sou editor" ON public.projects FOR UPDATE
  USING (public.pode_editar_projecto(id)) WITH CHECK (public.pode_editar_projecto(id));
DROP POLICY IF EXISTS "so o dono apaga o projecto" ON public.projects;
CREATE POLICY "so o dono apaga o projecto" ON public.projects FOR DELETE
  USING (owner_id = auth.uid());

-- project_members: qualquer membro vê a equipa; só o dono mexe nela
DROP POLICY IF EXISTS "ver equipa do projecto" ON public.project_members;
CREATE POLICY "ver equipa do projecto" ON public.project_members FOR SELECT
  USING (user_id = auth.uid() OR public.pode_ver_projecto(project_id));
DROP POLICY IF EXISTS "dono gere a equipa" ON public.project_members;
CREATE POLICY "dono gere a equipa" ON public.project_members FOR INSERT
  WITH CHECK (public.e_dono_do_projecto(project_id));
DROP POLICY IF EXISTS "dono altera a equipa" ON public.project_members;
CREATE POLICY "dono altera a equipa" ON public.project_members FOR UPDATE
  USING (public.e_dono_do_projecto(project_id));
-- o dono pode remover alguém, e cada um pode sair do projecto
DROP POLICY IF EXISTS "dono remove ou o proprio sai" ON public.project_members;
CREATE POLICY "dono remove ou o proprio sai" ON public.project_members FOR DELETE
  USING (public.e_dono_do_projecto(project_id) OR user_id = auth.uid());

-- project_invites: o dono gere; o convidado vê os convites dirigidos a si
DROP POLICY IF EXISTS "ver convites do projecto ou para mim" ON public.project_invites;
CREATE POLICY "ver convites do projecto ou para mim" ON public.project_invites FOR SELECT
  USING (
    public.e_dono_do_projecto(project_id)
    OR lower(email) = lower(COALESCE((SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()), ''))
  );
DROP POLICY IF EXISTS "dono convida" ON public.project_invites;
CREATE POLICY "dono convida" ON public.project_invites FOR INSERT
  WITH CHECK (public.e_dono_do_projecto(project_id) AND convidado_por = auth.uid());
DROP POLICY IF EXISTS "dono ou convidado actualiza o convite" ON public.project_invites;
CREATE POLICY "dono ou convidado actualiza o convite" ON public.project_invites FOR UPDATE
  USING (
    public.e_dono_do_projecto(project_id)
    OR lower(email) = lower(COALESCE((SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()), ''))
  );
DROP POLICY IF EXISTS "dono cancela o convite" ON public.project_invites;
CREATE POLICY "dono cancela o convite" ON public.project_invites FOR DELETE
  USING (public.e_dono_do_projecto(project_id));

-- transactions
DROP POLICY IF EXISTS "ver transacoes do projecto" ON public.transactions;
CREATE POLICY "ver transacoes do projecto" ON public.transactions FOR SELECT
  USING (public.pode_ver_projecto(project_id));
DROP POLICY IF EXISTS "registar transacoes" ON public.transactions;
CREATE POLICY "registar transacoes" ON public.transactions FOR INSERT
  WITH CHECK (public.pode_editar_projecto(project_id));
DROP POLICY IF EXISTS "editar transacoes" ON public.transactions;
CREATE POLICY "editar transacoes" ON public.transactions FOR UPDATE
  USING (public.pode_editar_projecto(project_id));
DROP POLICY IF EXISTS "apagar transacoes" ON public.transactions;
CREATE POLICY "apagar transacoes" ON public.transactions FOR DELETE
  USING (public.pode_editar_projecto(project_id));

-- stock_items
DROP POLICY IF EXISTS "ver stock do projecto" ON public.stock_items;
CREATE POLICY "ver stock do projecto" ON public.stock_items FOR SELECT
  USING (public.pode_ver_projecto(project_id));
DROP POLICY IF EXISTS "criar stock" ON public.stock_items;
CREATE POLICY "criar stock" ON public.stock_items FOR INSERT
  WITH CHECK (public.pode_editar_projecto(project_id));
DROP POLICY IF EXISTS "editar stock" ON public.stock_items;
CREATE POLICY "editar stock" ON public.stock_items FOR UPDATE
  USING (public.pode_editar_projecto(project_id));
DROP POLICY IF EXISTS "apagar stock" ON public.stock_items;
CREATE POLICY "apagar stock" ON public.stock_items FOR DELETE
  USING (public.pode_editar_projecto(project_id));

-- activity_log: lê-se, escreve-se, mas nunca se altera nem se apaga
DROP POLICY IF EXISTS "ver actividade do projecto" ON public.activity_log;
CREATE POLICY "ver actividade do projecto" ON public.activity_log FOR SELECT
  USING (public.pode_ver_projecto(project_id));
DROP POLICY IF EXISTS "registar actividade" ON public.activity_log;
CREATE POLICY "registar actividade" ON public.activity_log FOR INSERT
  WITH CHECK (public.pode_editar_projecto(project_id) AND actor_id = auth.uid());


-- ─── Migração dos dados existentes ──────────────────────────────────────────
-- Repetível: correr duas vezes não duplica nada, graças ao índice único
-- (owner_id, legacy_id) e à verificação de existência.

CREATE OR REPLACE FUNCTION public.migrar_negocios_de_user_data(p_user uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cfg        jsonb;
  v_negocios   jsonb;
  v_item       jsonb;
  v_neg        jsonb;
  v_log        jsonb;
  v_stock      jsonb;
  v_legacy_id  text;
  v_project_id uuid;
  v_soma_rec   numeric;
  v_soma_gas   numeric;
  v_criados    integer := 0;
BEGIN
  SELECT data_value INTO v_cfg
    FROM user_data WHERE user_id = p_user AND data_key = 'garcia:negocios_cfg';
  SELECT data_value INTO v_negocios
    FROM user_data WHERE user_id = p_user AND data_key = 'garcia:negocios';

  IF v_cfg IS NULL OR jsonb_typeof(v_cfg) <> 'array' THEN
    RETURN 0;
  END IF;
  v_negocios := COALESCE(v_negocios, '{}'::jsonb);

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_cfg) LOOP
    v_legacy_id := v_item->>'id';
    CONTINUE WHEN v_legacy_id IS NULL;

    IF EXISTS (SELECT 1 FROM projects
               WHERE owner_id = p_user AND legacy_id = v_legacy_id) THEN
      CONTINUE;
    END IF;

    v_neg   := COALESCE(v_negocios -> v_legacy_id, '{}'::jsonb);
    v_log   := CASE WHEN jsonb_typeof(v_neg->'log') = 'array'
                    THEN v_neg->'log' ELSE '[]'::jsonb END;
    v_stock := CASE WHEN jsonb_typeof(v_neg->'stock') = 'array'
                    THEN v_neg->'stock' ELSE '[]'::jsonb END;

    -- Quanto dos totais guardados vem das transações que sobreviveram.
    -- O resto é histórico já apagado e tem de ser preservado à parte.
    SELECT
      COALESCE(SUM(CASE WHEN e->>'tipo' = 'gasto' THEN 0
                        ELSE safe_numeric(e->>'valor') END), 0),
      COALESCE(SUM(CASE WHEN e->>'tipo' = 'gasto' THEN safe_numeric(e->>'valor')
                        ELSE safe_numeric(e->>'custo') END), 0)
      INTO v_soma_rec, v_soma_gas
      FROM jsonb_array_elements(v_log) e;

    INSERT INTO projects (
      owner_id, legacy_id, nome, descricao, icon, tipo,
      meta, notas, proximo_recebimento, receita_legado, gastos_legado
    ) VALUES (
      p_user,
      v_legacy_id,
      COALESCE(NULLIF(trim(v_item->>'nome'), ''), 'Negócio sem nome'),
      COALESCE(v_item->>'desc', ''),
      COALESCE(NULLIF(v_item->>'icon', ''), 'package'),
      CASE WHEN v_item->>'tipo' IN ('produtos', 'servicos', 'recorrente')
           THEN v_item->>'tipo' ELSE 'produtos' END,
      safe_numeric(v_neg->>'meta'),
      COALESCE(v_neg->>'notas', ''),
      safe_date(v_neg->>'proxima'),
      GREATEST(safe_numeric(v_neg->>'receita') - v_soma_rec, 0),
      GREATEST(safe_numeric(v_neg->>'gastos')  - v_soma_gas, 0)
    )
    RETURNING id INTO v_project_id;

    INSERT INTO transactions (
      project_id, criado_por, legacy_id, tipo, descricao,
      valor, custo, cliente, qty, data, criado_em
    )
    SELECT
      v_project_id,
      p_user,
      e->>'id',
      CASE WHEN e->>'tipo' = 'gasto' THEN 'gasto' ELSE 'venda' END,
      COALESCE(e->>'descricao', ''),
      safe_numeric(e->>'valor'),
      safe_numeric(e->>'custo'),
      COALESCE(e->>'cliente', ''),
      GREATEST(COALESCE(safe_numeric(e->>'qty')::integer, 1), 1),
      COALESCE(safe_date(e->>'data'), CURRENT_DATE),
      safe_timestamptz(e->>'registadoEm')
    FROM jsonb_array_elements(v_log) e;

    INSERT INTO stock_items (
      project_id, legacy_id, nome, quantidade, custo_unitario, preco_venda
    )
    SELECT
      v_project_id,
      s->>'id',
      COALESCE(s->>'nome', ''),
      GREATEST(COALESCE(safe_numeric(s->>'quantidade')::integer, 0), 0),
      safe_numeric(s->>'custoUnitario'),
      safe_numeric(s->>'precoVenda')
    FROM jsonb_array_elements(v_stock) s;

    v_criados := v_criados + 1;
  END LOOP;

  RETURN v_criados;
END;
$$;

DO $$
DECLARE
  u uuid;
  n integer;
  total integer := 0;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM public.user_data LOOP
    n := public.migrar_negocios_de_user_data(u);
    total := total + n;
  END LOOP;
  RAISE NOTICE 'Migração concluída: % projectos criados.', total;
END;
$$;