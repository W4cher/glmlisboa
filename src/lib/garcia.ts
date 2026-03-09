import { supabase } from "@/integrations/supabase/client";

// ── Types ──
export interface LogEntry {
  id: string; tipo: string; negocio: string;
  descricao: string; valor: number; custo: number; lucroVenda: number;
  cliente: string; qty: number; data: string; registadoEm: string;
}
export interface Pagamento {
  id: string; valor: number; data: string;
}
export interface Devedor {
  id: string; nome: string; valor: number; valorOriginal: number; produto: string; data: string; notas: string; pago: boolean; negocio: string; pagamentos: Pagamento[];
}
export interface StockItem {
  id: string;
  nome: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
}
export interface Negocio {
  receita: number; gastos: number; meta: number; notas: string; proxima?: string; log: LogEntry[]; stock: StockItem[];
}
export interface NegocioCfg {
  id: string; icon: string; nome: string; desc: string;
}
export interface Capitulo {
  id: string; nome: string; progresso: number;
}
export interface TeseTarefa {
  id: string; texto: string; feito: boolean;
}
export interface Tese {
  titulo: string; capitulos: Capitulo[]; tarefas: TeseTarefa[];
}
export interface Tarefa {
  id: string; texto: string; prioridade: string; categoria: string; prazo: string; feito: boolean; criada: string;
}
export interface FinItem {
  id: string; descricao: string; valor: number; categoria: string; data: string;
}
export interface Financas {
  entradas: FinItem[]; saidas: FinItem[];
}

// ── Helpers ──
export const fmt = (n: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "AOA" }).format(n);

export const today = () => new Date().toISOString().split("T")[0];
export const uid = () => Math.random().toString(36).slice(2, 8);
export const diasAtras = (data: string) => Math.floor((Date.now() - new Date(data).getTime()) / 86400000);

/** Enforce log limits: max 7 entries, auto-clean entries older than 7 days */
export const enforceLogLimits = (log: LogEntry[]): LogEntry[] => {
  // Remove entries older than 7 days
  let filtered = log.filter(e => diasAtras(e.data) < 7);
  // Keep only the 7 most recent
  if (filtered.length > 7) {
    filtered = filtered
      .sort((a, b) => new Date(b.registadoEm).getTime() - new Date(a.registadoEm).getTime())
      .slice(0, 7);
  }
  return filtered;
};

// ── Cloud Storage (Supabase) ──
export const load = async <T>(key: string): Promise<T | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_data")
      .select("data_value")
      .eq("user_id", user.id)
      .eq("data_key", key)
      .maybeSingle();

    if (error || !data) return null;
    return data.data_value as T;
  } catch { return null; }
};

export const save = async <T>(key: string, val: T) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_data")
      .upsert({
        user_id: user.id,
        data_key: key,
        data_value: val as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,data_key" });
  } catch {}
};

// ── Constants ──
export const PRIORIDADES = ["🔴 Urgente", "🟡 Importante", "🟢 Normal"];
export const CATEGORIAS_T = ["Bosch", "Tese", "Smart X Phone", "Sobrilho", "Finanças", "Família", "TikTok", "Outro"];
export const CATS_ENTRADA = ["Bosch/Salário", "Smart X Phone", "Sobrilho", "Roupas", "Rendas", "TikTok", "Outro"];
export const CATS_SAIDA = ["Casa", "Alimentação", "Escola filhos", "Ginásio", "Negócios", "Transporte", "Pessoal", "Outro"];

export const BLOCOS_ROTINA = [
  { id: "b1", hora: "07:00", label: "Acordar + café + plano do dia", icon: "🌅", bloco: "Manhã" },
  { id: "b2", hora: "07:30", label: "Preparar filhos → escola às 8:20", icon: "👨‍👧‍👦", bloco: "Manhã" },
  { id: "b3", hora: "08:30", label: "Bosch API — trabalho principal", icon: "💻", bloco: "Trabalho" },
  { id: "b4", hora: "12:30", label: "Bloco negócios rápido (30min)", icon: "📱", bloco: "Trabalho" },
  { id: "b5", hora: "13:00", label: "Almoço + descanso", icon: "🍽️", bloco: "Pausa" },
  { id: "b6", hora: "14:00", label: "TESE — foco total (sem telemóvel)", icon: "🎓", bloco: "Tese" },
  { id: "b7", hora: "17:00", label: "Ginásio", icon: "💪", bloco: "Pessoal" },
  { id: "b8", hora: "18:00", label: "Buscar filhos + família", icon: "❤️", bloco: "Família" },
  { id: "b9", hora: "21:45", label: "Finanças + cobranças", icon: "💰", bloco: "Noite" },
  { id: "b10", hora: "22:15", label: "Marketing criativo (criativos, redes sociais)", icon: "🎨", bloco: "Noite" },
  { id: "b11", hora: "23:00", label: "Revisão do dia + plano amanhã", icon: "📋", bloco: "Noite" },
  { id: "b12", hora: "23:30", label: "Desligar — esperar mulher sem stress", icon: "🌙", bloco: "Noite" },
];

export const BLOCO_COLORS: Record<string, string> = {
  "Manhã": "hsl(var(--garcia-gold))",
  "Trabalho": "hsl(var(--garcia-blue))",
  "Pausa": "hsl(var(--garcia-green))",
  "Tese": "hsl(var(--garcia-purple))",
  "Pessoal": "hsl(var(--primary))",
  "Família": "hsl(var(--garcia-pink))",
  "Noite": "hsl(var(--garcia-indigo))",
};

export const DEFAULT_NEGOCIOS_CFG: NegocioCfg[] = [
  { id: "smartphone", icon: "📱", nome: "Smart X Phone", desc: "Vendas de telemóveis" },
  { id: "sobrilho", icon: "🚗", nome: "Sobrilho", desc: "Pintura automóvel" },
  { id: "roupas", icon: "👗", nome: "Roupas (esposa)", desc: "Vendas de roupa" },
  { id: "rendas", icon: "🏠", nome: "Rendas", desc: "Propriedades arrendadas" },
];

// Keep old export for backward compat
export const NEGOCIOS_CFG = DEFAULT_NEGOCIOS_CFG;

export const DEFAULT_NEGOCIOS: Record<string, Negocio> = {
  smartphone: { receita: 0, gastos: 0, meta: 0, notas: "", log: [], stock: [] },
  sobrilho: { receita: 0, gastos: 0, meta: 0, notas: "", log: [], stock: [] },
  roupas: { receita: 0, gastos: 0, meta: 0, notas: "", log: [], stock: [] },
  rendas: { receita: 0, gastos: 0, meta: 0, notas: "", proxima: "", log: [], stock: [] },
};

export const DEFAULT_TESE: Tese = {
  titulo: "Blockchain-Secured FL for Trustworthy Edge Intelligence",
  capitulos: [
    { id: "c1", nome: "Introdução", progresso: 80 },
    { id: "c2", nome: "Estado da Arte", progresso: 60 },
    { id: "c3", nome: "Arquitetura Proposta", progresso: 40 },
    { id: "c4", nome: "Implementação", progresso: 20 },
    { id: "c5", nome: "Avaliação & Resultados", progresso: 0 },
    { id: "c6", nome: "Conclusão", progresso: 0 },
  ],
  tarefas: [],
};

export const NEGOCIO_ICONS = ["📱", "🚗", "👗", "🏠", "💻", "🎨", "🍽️", "🏪", "🛒", "✂️", "📦", "🔧", "🎵", "📸", "💈", "🏗️", "🧹", "🌱"];
