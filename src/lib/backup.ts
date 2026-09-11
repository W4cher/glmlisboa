import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { APP_NAME } from "@/lib/garcia";

export const VERSAO_BACKUP = 2;

/** Um negócio com tudo o que lhe pertence, para poder ser recriado de raiz. */
export interface ProjectoBackup {
  nome: string;
  descricao: string;
  icon: string;
  tipo: string;
  meta: number;
  notas: string;
  proximo_recebimento: string | null;
  receita_legado: number;
  gastos_legado: number;
  transaccoes: {
    tipo: string; descricao: string; valor: number; custo: number;
    cliente: string; qty: number; data: string; origem: string; criado_em: string;
  }[];
  stock: { nome: string; quantidade: number; custo_unitario: number; preco_venda: number }[];
}

export interface Backup {
  versao: number;
  app: string;
  exportadoEm: string;
  /** Cada chave de `user_data` com o seu conteúdo: rotina, tarefas, etc. */
  chaves: Record<string, Json>;
  /**
   * Os negócios, que desde a versão 2 vivem em tabelas próprias e já não em
   * `user_data`. Ausente num backup antigo.
   */
  projectos?: ProjectoBackup[];
}

/**
 * Lê tudo o que o utilizador autenticado tem guardado.
 *
 * Corre no browser, com a sessão dele — é a única forma de exportar sem
 * partilhar credenciais nem contornar o RLS.
 */
export async function exportarDados(): Promise<Backup> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("A sessão expirou. Entra de novo e tenta outra vez.");

  const { data, error } = await supabase
    .from("user_data")
    .select("data_key, data_value")
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  const chaves: Record<string, Json> = {};
  (data ?? []).forEach(r => { chaves[r.data_key] = r.data_value; });

  return {
    versao: VERSAO_BACKUP,
    app: APP_NAME,
    exportadoEm: new Date().toISOString(),
    chaves,
    projectos: await exportarProjectos(),
  };
}

/** Os negócios, as suas transações e o seu stock. */
async function exportarProjectos(): Promise<ProjectoBackup[]> {
  const [proj, trans, stock] = await Promise.all([
    supabase.from("projects").select("*").order("criado_em"),
    supabase.from("transactions").select("*").order("criado_em"),
    supabase.from("stock_items").select("*").order("criado_em"),
  ]);
  if (proj.error) throw new Error(proj.error.message);
  if (trans.error) throw new Error(trans.error.message);
  if (stock.error) throw new Error(stock.error.message);

  const n = (v: unknown) => Number(v ?? 0) || 0;

  return (proj.data ?? []).map(p => ({
    nome: p.nome,
    descricao: p.descricao ?? "",
    icon: p.icon,
    tipo: p.tipo,
    meta: n(p.meta),
    notas: p.notas ?? "",
    proximo_recebimento: p.proximo_recebimento,
    receita_legado: n(p.receita_legado),
    gastos_legado: n(p.gastos_legado),
    transaccoes: (trans.data ?? []).filter(t => t.project_id === p.id).map(t => ({
      tipo: t.tipo, descricao: t.descricao ?? "", valor: n(t.valor), custo: n(t.custo),
      cliente: t.cliente ?? "", qty: t.qty ?? 1, data: t.data,
      origem: t.origem ?? "manual", criado_em: t.criado_em,
    })),
    stock: (stock.data ?? []).filter(s => s.project_id === p.id).map(s => ({
      nome: s.nome ?? "", quantidade: s.quantidade ?? 0,
      custo_unitario: n(s.custo_unitario), preco_venda: n(s.preco_venda),
    })),
  }));
}

/** Entrega o ficheiro ao utilizador. */
export function descarregarBackup(b: Backup) {
  const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `biz-${b.exportadoEm.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Valida um ficheiro antes de deixar tocar na base de dados. Um import é
 * destrutivo — sobrepõe-se ao que lá está — por isso mais vale recusar um
 * ficheiro estranho do que escrever lixo por cima dos dados de alguém.
 */
export function validarBackup(raw: unknown): Backup {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("O ficheiro não é um backup válido.");
  }
  const b = raw as Partial<Backup>;

  if (typeof b.versao !== "number") {
    throw new Error("Falta a versão do backup — o ficheiro não parece ser desta app.");
  }
  if (b.versao > VERSAO_BACKUP) {
    throw new Error(
      `Este backup é da versão ${b.versao} e esta app só entende até à ${VERSAO_BACKUP}. Actualiza a app primeiro.`
    );
  }
  if (typeof b.chaves !== "object" || b.chaves === null || Array.isArray(b.chaves)) {
    throw new Error("O backup não tem dados lá dentro.");
  }
  const chaves = b.chaves as Record<string, Json>;
  const nomes = Object.keys(chaves);
  if (nomes.length === 0) {
    throw new Error("O backup está vazio.");
  }
  if (!nomes.some(k => k.startsWith("garcia:"))) {
    throw new Error("O backup não tem nenhuma chave desta app.");
  }

  return {
    versao: b.versao,
    app: typeof b.app === "string" ? b.app : APP_NAME,
    exportadoEm: typeof b.exportadoEm === "string" ? b.exportadoEm : "",
    chaves,
    projectos: Array.isArray(b.projectos) ? b.projectos : undefined,
  };
}

/**
 * Escreve o backup na conta autenticada. Devolve quantas chaves foram escritas.
 * Só toca nas chaves presentes no ficheiro; o resto fica como está.
 */
export async function importarDados(b: Backup): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("A sessão expirou. Entra de novo e tenta outra vez.");

  const agora = new Date().toISOString();
  const linhas = Object.entries(b.chaves).map(([data_key, data_value]) => ({
    user_id: user.id,
    data_key,
    data_value,
    updated_at: agora,
  }));

  const { error } = await supabase
    .from("user_data")
    .upsert(linhas, { onConflict: "user_id,data_key" });

  if (error) throw new Error(error.message);

  if (b.projectos) await importarProjectos(user.id, b.projectos);

  return linhas.length;
}

/**
 * Recria os negócios do ficheiro. Apaga primeiro os que lá estão: sem isso,
 * importar duas vezes duplicava tudo. É destrutivo de propósito, e o ecrã avisa.
 */
async function importarProjectos(userId: string, projectos: ProjectoBackup[]): Promise<void> {
  // As transações e o stock desaparecem com o projecto, por ON DELETE CASCADE.
  const { error: eDel } = await supabase.from("projects").delete().eq("owner_id", userId);
  if (eDel) throw new Error(eDel.message);
  if (projectos.length === 0) return;

  for (const p of projectos) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: userId,
        nome: p.nome,
        descricao: p.descricao ?? "",
        icon: p.icon || "package",
        tipo: ["produtos", "servicos", "recorrente"].includes(p.tipo) ? p.tipo : "produtos",
        meta: p.meta ?? 0,
        notas: p.notas ?? "",
        proximo_recebimento: p.proximo_recebimento || null,
        receita_legado: p.receita_legado ?? 0,
        gastos_legado: p.gastos_legado ?? 0,
      })
      .select("id")
      .single();

    // Uma conta no plano gratuito não cabe num backup de muitos negócios. A
    // mensagem vem do trigger e já está escrita para o utilizador ler.
    if (error) throw new Error(error.message);

    const pid = data.id;
    if (p.transaccoes?.length) {
      const { error: eT } = await supabase.from("transactions").insert(
        p.transaccoes.map(t => ({
          project_id: pid, criado_por: userId, tipo: t.tipo === "gasto" ? "gasto" : "venda",
          descricao: t.descricao ?? "", valor: t.valor ?? 0, custo: t.custo ?? 0,
          cliente: t.cliente ?? "", qty: Math.max(1, t.qty ?? 1),
          data: t.data, origem: t.origem ?? "manual", criado_em: t.criado_em,
        }))
      );
      if (eT) throw new Error(eT.message);
    }
    if (p.stock?.length) {
      const { error: eS } = await supabase.from("stock_items").insert(
        p.stock.map(i => ({
          project_id: pid, nome: i.nome ?? "",
          quantidade: Math.max(0, i.quantidade ?? 0),
          custo_unitario: i.custo_unitario ?? 0, preco_venda: i.preco_venda ?? 0,
        }))
      );
      if (eS) throw new Error(eS.message);
    }
  }
}

/** Lê um ficheiro escolhido pelo utilizador e valida-o. */
export async function lerFicheiroBackup(f: File): Promise<Backup> {
  const texto = await f.text();
  let raw: unknown;
  try {
    raw = JSON.parse(texto);
  } catch {
    throw new Error("O ficheiro não é JSON válido.");
  }
  return validarBackup(raw);
}
