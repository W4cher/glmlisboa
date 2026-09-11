-- ============================================================================
-- Venda a partir do stock, numa operação só
-- ============================================================================
--
-- Vender do stock são dois efeitos: baixar a quantidade e registar a venda. Em
-- dois pedidos separados a partir do browser, um pode falhar depois do outro ter
-- passado — e fica stock baixado sem venda registada, ou uma venda de material
-- que continua em armazém. Como isto é dinheiro, tem de ser tudo ou nada.
--
-- SECURITY INVOKER de propósito (o normal): a função corre com os direitos de
-- quem a chama, por isso as políticas RLS continuam a decidir se esta pessoa
-- pode mexer neste projecto. Não há aqui privilégio nenhum a mais.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.vender_stock(
  p_item uuid,
  p_qty  integer
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_item        stock_items%ROWTYPE;
  v_transaccao  uuid;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'Quantidade tem de ser maior que zero.' USING ERRCODE = 'check_violation';
  END IF;

  -- FOR UPDATE trava a linha: duas vendas do mesmo artigo ao mesmo tempo (o
  -- dono e um colaborador, por exemplo) põem-se em fila em vez de lerem ambas
  -- a mesma quantidade e venderem material que já não existe.
  SELECT * INTO v_item FROM stock_items WHERE id = p_item FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Artigo não encontrado.' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_item.quantidade < p_qty THEN
    RAISE EXCEPTION 'Só há % em stock.', v_item.quantidade USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO transactions (
    project_id, criado_por, tipo, descricao, valor, custo, cliente, qty, data, origem
  ) VALUES (
    v_item.project_id,
    auth.uid(),
    'venda',
    v_item.nome,
    v_item.preco_venda    * p_qty,
    v_item.custo_unitario * p_qty,
    '',
    p_qty,
    CURRENT_DATE,
    'stock'
  )
  RETURNING id INTO v_transaccao;

  -- Chegar a zero não apaga o artigo: o preço e o custo ficam guardados para a
  -- próxima reposição, e o histórico continua a fazer sentido.
  UPDATE stock_items
     SET quantidade = quantidade - p_qty
   WHERE id = p_item;

  RETURN v_transaccao;
END;
$$;

REVOKE ALL ON FUNCTION public.vender_stock(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vender_stock(uuid, integer) TO authenticated;
