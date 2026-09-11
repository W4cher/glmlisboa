-- ============================================================================
-- Planos, acesso vitalício e administração
-- ============================================================================
--
-- Permite distinguir quem usa de graça para sempre (o dono e os amigos) de quem
-- paga mensalidade, e dá ao administrador uma forma de o definir.
--
-- ATENÇÃO ao buraco que isto fecha: a política "actualizar perfil proprio"
-- deixava cada utilizador escrever na sua própria linha de `profiles`. Ao
-- acrescentar `plano` e `is_admin` a essa tabela, qualquer pessoa poderia
-- dar-se a si própria o plano vitalício — ou direitos de administrador — com um
-- único pedido a partir do browser.
--
-- O RLS decide linhas, não colunas. A restrição por coluna faz-se com GRANT:
-- abaixo, o papel `authenticated` perde o UPDATE geral e recebe apenas o
-- direito de escrever `nome`. Tudo o resto passa a ser exclusivo do
-- administrador, através de uma função que verifica quem está a chamar.
-- ============================================================================


-- ─── Colunas ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plano           text    NOT NULL DEFAULT 'gratuito',
  ADD COLUMN IF NOT EXISTS plano_expira_em timestamptz,
  ADD COLUMN IF NOT EXISTS plano_notas     text    NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_plano_valido') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_plano_valido
      CHECK (plano IN ('gratuito', 'pro', 'equipa', 'vitalicio'));
  END IF;
END;
$$;

COMMENT ON COLUMN public.profiles.plano IS
  'gratuito | pro | equipa | vitalicio. O vitalício nunca expira — é o acesso oferecido.';
COMMENT ON COLUMN public.profiles.plano_expira_em IS
  'Quando o plano pago deixa de valer. NULL no gratuito e no vitalício.';


-- ─── Plano efectivo ─────────────────────────────────────────────────────────
-- Um plano pago com a data passada vale o mesmo que o gratuito. Calcular isto
-- num sítio só evita que a app e a base de dados discordem sobre quem pode o quê.

CREATE OR REPLACE FUNCTION public.plano_efectivo(p_user uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN p.plano = 'vitalicio' THEN 'vitalicio'
    WHEN p.plano = 'gratuito'  THEN 'gratuito'
    WHEN p.plano_expira_em IS NULL OR p.plano_expira_em > now() THEN p.plano
    ELSE 'gratuito'
  END
  FROM profiles p WHERE p.id = p_user;
$$;

/** Quantos projectos o plano permite. NULL = sem limite. */
CREATE OR REPLACE FUNCTION public.limite_projectos(p_plano text)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_plano WHEN 'gratuito' THEN 2 ELSE NULL END;
$$;

/** Quantos colaboradores por projecto o plano permite. */
CREATE OR REPLACE FUNCTION public.limite_colaboradores(p_plano text)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_plano
    WHEN 'gratuito'  THEN 0
    WHEN 'pro'       THEN 3
    WHEN 'equipa'    THEN 10
    WHEN 'vitalicio' THEN 10
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.sou_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$;


-- ─── Limites com dentes ─────────────────────────────────────────────────────
-- Verificar limites só no ecrã não serve de nada: qualquer pessoa com a chave
-- publishable faz o pedido à mão. Quem decide é a base de dados.

CREATE OR REPLACE FUNCTION public.verificar_limite_projectos()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_limite integer;
  v_actual integer;
BEGIN
  -- Sem utilizador autenticado é migração ou manutenção a correr do lado do
  -- servidor: deixa passar, senão uma sincronização parava a meio.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_limite := limite_projectos(plano_efectivo(NEW.owner_id));
  IF v_limite IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_actual FROM projects WHERE owner_id = NEW.owner_id;
  IF v_actual >= v_limite THEN
    RAISE EXCEPTION 'O plano actual permite % negócios. Actualiza o plano para criares mais.', v_limite
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_limite_plano ON public.projects;
CREATE TRIGGER projects_limite_plano
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.verificar_limite_projectos();

CREATE OR REPLACE FUNCTION public.verificar_limite_colaboradores()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_dono   uuid;
  v_limite integer;
  v_actual integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO v_dono FROM projects WHERE id = NEW.project_id;
  v_limite := limite_colaboradores(plano_efectivo(v_dono));

  SELECT count(*) INTO v_actual FROM project_members WHERE project_id = NEW.project_id;
  IF v_actual >= v_limite THEN
    RAISE EXCEPTION 'O plano actual permite % colaboradores por projecto.', v_limite
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_members_limite_plano ON public.project_members;
CREATE TRIGGER project_members_limite_plano
  BEFORE INSERT ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.verificar_limite_colaboradores();


-- ─── Fechar a escrita do próprio perfil às colunas seguras ──────────────────

REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT  UPDATE (nome) ON public.profiles TO authenticated;


-- ─── Só o administrador mexe em planos ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.definir_plano(
  p_user    uuid,
  p_plano   text,
  p_expira  timestamptz DEFAULT NULL,
  p_notas   text DEFAULT ''
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT sou_admin() THEN
    RAISE EXCEPTION 'Só um administrador pode alterar planos.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_plano NOT IN ('gratuito', 'pro', 'equipa', 'vitalicio') THEN
    RAISE EXCEPTION 'Plano desconhecido: %', p_plano USING ERRCODE = 'check_violation';
  END IF;

  UPDATE profiles
     SET plano           = p_plano,
         plano_expira_em = CASE WHEN p_plano IN ('gratuito', 'vitalicio') THEN NULL ELSE p_expira END,
         plano_notas     = COALESCE(p_notas, ''),
         updated_at      = now()
   WHERE id = p_user;
END;
$$;

-- Deliberadamente NÃO há função para dar direitos de administrador. Faz-se na
-- consola SQL, onde a ligação já é privilegiada. Um administrador que se possa
-- criar a partir da app é um administrador que qualquer pessoa pode criar.

REVOKE ALL ON FUNCTION public.definir_plano(uuid, text, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.definir_plano(uuid, text, timestamptz, text) TO authenticated;


-- ─── O administrador vê toda a gente ────────────────────────────────────────

DROP POLICY IF EXISTS "admin ve todos os perfis" ON public.profiles;
CREATE POLICY "admin ve todos os perfis" ON public.profiles FOR SELECT
  USING (public.sou_admin());
