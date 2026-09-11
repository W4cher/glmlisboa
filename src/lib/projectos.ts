import { supabase } from "@/integrations/supabase/client";
import type { Negocio, NegocioCfg, LogEntry, StockItem, TipoNegocio } from "@/lib/garcia";

/**
 * Acesso aos negócios nas tabelas relacionais.
 *
 * Antes, tudo isto vivia numa linha JSONB em `user_data`: o cliente carregava o
 * documento inteiro, mexia-lhe em memória e voltava a gravá-lo por cima. Com
 * duas pessoas no mesmo negócio, a última a gravar apagava o trabalho da
 * primeira — e era isso que impedia a colaboração.
 *
 * Agora cada venda é uma linha e cada gravação toca só no que mudou. As funções
 * abaixo devolvem os dados na mesma forma que os componentes já usavam, para a
 * mudança ficar contida aqui.
 */

// Os valores `numeric` do Postgres chegam como texto no JSON. Somá-los sem
// converter dá "100" + "200" = "100200".
const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
};

export interface DadosProjectos {
  cfg: NegocioCfg[];
  negocios: Record<string, Negocio>;
}

/** Lê projectos, transações e stock e remonta a forma que os ecrãs esperam. */
export async function carregarProjectos(): Promise<DadosProjectos> {
  const [proj, trans, stock] = await Promise.all([
    supabase.from("projects").select("*").order("criado_em", { ascending: true }),
    supabase.from("transactions").select("*")
      .order("data", { ascending: false })
      .order("criado_em", { ascending: false }),
    supabase.from("stock_items").select("*").order("criado_em", { ascending: true }),
  ]);

  if (proj.error) throw new Error(proj.error.message);
  if (trans.error) throw new Error(trans.error.message);
  if (stock.error) throw new Error(stock.error.message);

  const cfg: NegocioCfg[] = (proj.data ?? []).map(p => ({
    id: p.id,
    icon: p.icon,
    nome: p.nome,
    desc: p.descricao ?? "",
    tipo: (p.tipo ?? "produtos") as TipoNegocio,
  }));

  const negocios: Record<string, Negocio> = {};
  for (const p of proj.data ?? []) {
    negocios[p.id] = {
      // A receita e os gastos são derivados, nunca guardados — assim não podem
      // ficar dessincronizados das transações. O valor "legado" é o histórico
      // que o antigo enforceLogLimits apagou e que já só existe neste número.
      receita: num(p.receita_legado),
      gastos: num(p.gastos_legado),
      meta: num(p.meta),
      notas: p.notas ?? "",
      proxima: p.proximo_recebimento ?? "",
      log: [],
      stock: [],
    };
  }

  for (const t of trans.data ?? []) {
    const n = negocios[t.project_id];
    if (!n) continue;
    const valor = num(t.valor);
    const custo = num(t.custo);
    if (t.tipo === "venda") {
      n.receita += valor;
      n.gastos += custo;
    } else {
      n.gastos += valor;
    }
    const entrada: LogEntry = {
      id: t.id,
      tipo: t.tipo,
      negocio: t.project_id,
      descricao: t.descricao ?? "",
      valor,
      custo,
      lucroVenda: t.tipo === "venda" ? valor - custo : 0,
      cliente: t.cliente ?? "",
      qty: t.qty ?? 1,
      data: t.data,
      registadoEm: t.criado_em,
    };
    n.log.push(entrada);
  }

  for (const s of stock.data ?? []) {
    const n = negocios[s.project_id];
    if (!n) continue;
    n.stock.push({
      id: s.id,
      nome: s.nome ?? "",
      quantidade: s.quantidade ?? 0,
      custoUnitario: num(s.custo_unitario),
      precoVenda: num(s.preco_venda),
    });
  }

  return { cfg, negocios };
}

// ── Projectos ──────────────────────────────────────────────────────────────

/** Devolve o id que a base de dados atribuiu. */
export async function criarProjecto(cfg: Omit<NegocioCfg, "id">): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("A sessão expirou. Entra de novo.");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      nome: cfg.nome,
      descricao: cfg.desc ?? "",
      icon: cfg.icon,
      tipo: cfg.tipo ?? "produtos",
    })
    .select("id")
    .single();

  // O limite do plano é imposto por trigger na base de dados; a mensagem que
  // vem de lá já está escrita para o utilizador ler.
  if (error) throw new Error(error.message);
  return data.id;
}

export async function apagarProjecto(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Campos que o ecrã deixa editar directamente. */
export async function actualizarProjecto(
  id: string,
  campos: { meta?: number; notas?: string; proxima?: string }
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (campos.meta !== undefined) patch.meta = campos.meta;
  if (campos.notas !== undefined) patch.notas = campos.notas;
  if (campos.proxima !== undefined) patch.proximo_recebimento = campos.proxima || null;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("projects").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Transações ─────────────────────────────────────────────────────────────

export interface NovaTransaccao {
  projectId: string;
  tipo: "venda" | "gasto";
  descricao: string;
  valor: number;
  custo?: number;
  cliente?: string;
  qty?: number;
  data?: string;
  origem?: "manual" | "stock" | "divida";
}

export async function registarTransaccao(t: NovaTransaccao): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("transactions").insert({
    project_id: t.projectId,
    criado_por: user?.id ?? null,
    tipo: t.tipo,
    descricao: t.descricao,
    valor: t.valor,
    custo: t.custo ?? 0,
    cliente: t.cliente ?? "",
    qty: t.qty ?? 1,
    data: t.data || new Date().toISOString().split("T")[0],
    origem: t.origem ?? "manual",
  });
  if (error) throw new Error(error.message);
}

export async function apagarTransaccao(id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Stock ──────────────────────────────────────────────────────────────────

export async function criarItemStock(
  projectId: string,
  item: Omit<StockItem, "id">
): Promise<void> {
  const { error } = await supabase.from("stock_items").insert({
    project_id: projectId,
    nome: item.nome,
    quantidade: item.quantidade,
    custo_unitario: item.custoUnitario,
    preco_venda: item.precoVenda,
  });
  if (error) throw new Error(error.message);
}

export async function actualizarItemStock(
  id: string,
  updates: Partial<StockItem>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.nome !== undefined) patch.nome = updates.nome;
  if (updates.quantidade !== undefined) patch.quantidade = Math.max(0, updates.quantidade);
  if (updates.custoUnitario !== undefined) patch.custo_unitario = updates.custoUnitario;
  if (updates.precoVenda !== undefined) patch.preco_venda = updates.precoVenda;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("stock_items").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function apagarItemStock(id: string): Promise<void> {
  const { error } = await supabase.from("stock_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Vender do stock baixa a quantidade e regista a venda. As duas coisas têm de
 * acontecer juntas ou nenhuma, por isso quem o faz é a base de dados —
 * `vender_stock` corre com os direitos de quem chama, dentro de uma transacção.
 */
export async function venderDoStock(itemId: string, qty: number): Promise<void> {
  const { error } = await supabase.rpc("vender_stock", { p_item: itemId, p_qty: qty });
  if (error) throw new Error(error.message);
}
