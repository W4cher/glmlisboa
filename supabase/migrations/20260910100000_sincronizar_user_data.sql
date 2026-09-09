-- ============================================================================
-- Sincronização repetível de user_data → tabelas relacionais
-- ============================================================================
--
-- A `migrar_negocios_de_user_data` só migra à primeira: se o projecto já existe,
-- salta-o. Isso chegava para o arranque, mas não chega para a mudança da app.
--
-- Entre o dia em que a migração correu e o dia em que a app passar a ler das
-- tabelas, quem estiver a usar a app continua a gravar em `user_data`. Essas
-- vendas nunca chegariam às tabelas e desapareciam do ecrã no momento da troca.
--
-- Esta função pode correr as vezes que forem precisas e traz sempre o que
-- faltar. Correr imediatamente antes da troca fecha a janela.
--
-- Continua a não apagar nada em `user_data`.
-- ============================================================================


-- ─── Chaves para poder sincronizar sem duplicar ─────────────────────────────

-- Limpa duplicados que uma execução repetida da migração inicial possa ter
-- deixado. São cópias exactas da mesma entrada do JSON — não é perda de dados.
DELETE FROM public.transactions a
  USING public.transactions b
 WHERE a.ctid < b.ctid
   AND a.project_id = b.project_id
   AND a.legacy_id IS NOT NULL
   AND a.legacy_id = b.legacy_id;

DELETE FROM public.stock_items a
  USING public.stock_items b
 WHERE a.ctid < b.ctid
   AND a.project_id = b.project_id
   AND a.legacy_id IS NOT NULL
   AND a.legacy_id = b.legacy_id;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_project_legacy_idx
  ON public.transactions (project_id, legacy_id) WHERE legacy_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stock_items_project_legacy_idx
  ON public.stock_items (project_id, legacy_id) WHERE legacy_id IS NOT NULL;


-- ─── A sincronização ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sincronizar_negocios_de_user_data(p_user uuid)
RETURNS TABLE (projectos_novos integer, transacoes_novas integer, stock_novo integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  v_n          integer;
BEGIN
  projectos_novos := 0;
  transacoes_novas := 0;
  stock_novo := 0;

  SELECT data_value INTO v_cfg
    FROM user_data WHERE user_id = p_user AND data_key = 'garcia:negocios_cfg';
  SELECT data_value INTO v_negocios
    FROM user_data WHERE user_id = p_user AND data_key = 'garcia:negocios';

  IF v_cfg IS NULL OR jsonb_typeof(v_cfg) <> 'array' THEN
    RETURN NEXT;
    RETURN;
  END IF;
  v_negocios := COALESCE(v_negocios, '{}'::jsonb);

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_cfg) LOOP
    v_legacy_id := v_item->>'id';
    CONTINUE WHEN v_legacy_id IS NULL;

    v_neg   := COALESCE(v_negocios -> v_legacy_id, '{}'::jsonb);
    v_log   := CASE WHEN jsonb_typeof(v_neg->'log') = 'array'
                    THEN v_neg->'log' ELSE '[]'::jsonb END;
    v_stock := CASE WHEN jsonb_typeof(v_neg->'stock') = 'array'
                    THEN v_neg->'stock' ELSE '[]'::jsonb END;

    -- Quanto dos totais guardados vem de transações que ainda estão no JSON.
    -- O resto é histórico que o antigo enforceLogLimits apagou e que só existe
    -- neste número. Recalcular a cada sincronização dá sempre o mesmo valor:
    -- uma venda nova aumenta o total e o log na mesma medida.
    SELECT
      COALESCE(SUM(CASE WHEN e->>'tipo' = 'gasto' THEN 0
                        ELSE safe_numeric(e->>'valor') END), 0),
      COALESCE(SUM(CASE WHEN e->>'tipo' = 'gasto' THEN safe_numeric(e->>'valor')
                        ELSE safe_numeric(e->>'custo') END), 0)
      INTO v_soma_rec, v_soma_gas
      FROM jsonb_array_elements(v_log) e;

    SELECT id INTO v_project_id
      FROM projects WHERE owner_id = p_user AND legacy_id = v_legacy_id;

    IF v_project_id IS NULL THEN
      INSERT INTO projects (
        owner_id, legacy_id, nome, descricao, icon, tipo,
        meta, notas, proximo_recebimento, receita_legado, gastos_legado
      ) VALUES (
        p_user, v_legacy_id,
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
      projectos_novos := projectos_novos + 1;
    ELSE
      -- Só os campos que a app ainda gere pelo JSON. Não mexe em nada que já
      -- só exista do lado relacional.
      UPDATE projects SET
        nome                = COALESCE(NULLIF(trim(v_item->>'nome'), ''), nome),
        descricao           = COALESCE(v_item->>'desc', descricao),
        icon                = COALESCE(NULLIF(v_item->>'icon', ''), icon),
        tipo                = CASE WHEN v_item->>'tipo' IN ('produtos', 'servicos', 'recorrente')
                                   THEN v_item->>'tipo' ELSE tipo END,
        meta                = safe_numeric(v_neg->>'meta'),
        notas               = COALESCE(v_neg->>'notas', notas),
        proximo_recebimento = COALESCE(safe_date(v_neg->>'proxima'), proximo_recebimento),
        receita_legado      = GREATEST(safe_numeric(v_neg->>'receita') - v_soma_rec, 0),
        gastos_legado       = GREATEST(safe_numeric(v_neg->>'gastos')  - v_soma_gas, 0)
      WHERE id = v_project_id;
    END IF;

    -- Transações que ainda não vieram. A chave é o id que a entrada tem no
    -- JSON; o índice único garante que não entra a mesma duas vezes.
    INSERT INTO transactions (
      project_id, criado_por, legacy_id, tipo, descricao,
      valor, custo, cliente, qty, data, criado_em
    )
    SELECT
      v_project_id, p_user, e->>'id',
      CASE WHEN e->>'tipo' = 'gasto' THEN 'gasto' ELSE 'venda' END,
      COALESCE(e->>'descricao', ''),
      safe_numeric(e->>'valor'),
      safe_numeric(e->>'custo'),
      COALESCE(e->>'cliente', ''),
      GREATEST(COALESCE(safe_numeric(e->>'qty')::integer, 1), 1),
      COALESCE(safe_date(e->>'data'), CURRENT_DATE),
      safe_timestamptz(e->>'registadoEm')
    FROM jsonb_array_elements(v_log) e
    WHERE e->>'id' IS NOT NULL
    ON CONFLICT (project_id, legacy_id) WHERE legacy_id IS NOT NULL DO NOTHING;

    GET DIAGNOSTICS v_n = ROW_COUNT;
    transacoes_novas := transacoes_novas + v_n;

    -- O stock muda de quantidade, por isso actualiza-se em vez de só inserir.
    INSERT INTO stock_items (
      project_id, legacy_id, nome, quantidade, custo_unitario, preco_venda
    )
    SELECT
      v_project_id, s->>'id',
      COALESCE(s->>'nome', ''),
      GREATEST(COALESCE(safe_numeric(s->>'quantidade')::integer, 0), 0),
      safe_numeric(s->>'custoUnitario'),
      safe_numeric(s->>'precoVenda')
    FROM jsonb_array_elements(v_stock) s
    WHERE s->>'id' IS NOT NULL
    ON CONFLICT (project_id, legacy_id) WHERE legacy_id IS NOT NULL DO UPDATE SET
      nome           = EXCLUDED.nome,
      quantidade     = EXCLUDED.quantidade,
      custo_unitario = EXCLUDED.custo_unitario,
      preco_venda    = EXCLUDED.preco_venda;

    GET DIAGNOSTICS v_n = ROW_COUNT;
    stock_novo := stock_novo + v_n;
  END LOOP;

  RETURN NEXT;
END;
$$;


-- ─── Correr agora para todos ────────────────────────────────────────────────
-- Apanha tudo o que foi registado desde a migração inicial. Deve voltar a
-- correr-se imediatamente antes de a app passar a ler das tabelas.

DO $$
DECLARE
  u   uuid;
  r   record;
  tp  integer := 0;
  tt  integer := 0;
  ts  integer := 0;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM public.user_data LOOP
    SELECT * INTO r FROM public.sincronizar_negocios_de_user_data(u);
    tp := tp + r.projectos_novos;
    tt := tt + r.transacoes_novas;
    ts := ts + r.stock_novo;
  END LOOP;
  RAISE NOTICE 'Sincronização: % projectos novos, % transações novas, % itens de stock.', tp, tt, ts;
END;
$$;
