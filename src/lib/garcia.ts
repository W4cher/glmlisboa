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
/**
 * Tipo de negócio. Define que campos fazem sentido mostrar:
 *  - produtos   → loja, revenda: stock, meta de receita
 *  - servicos   → oficina, escritório, salão: sem stock, meta de receita
 *  - recorrente → rendas, mensalidades: próximo recebimento em vez de meta
 */
export type TipoNegocio = "produtos" | "servicos" | "recorrente";

export interface NegocioCfg {
  id: string; icon: string; nome: string; desc: string; tipo?: TipoNegocio;
}
export interface AprendizadoTopico {
  id: string; texto: string; feito: boolean;
}
export interface AprendizadoArea {
  id: string; nome: string; icon: string; objetivo: string;
  topicos: AprendizadoTopico[];
  notas: string;
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
export interface BlocoRotina {
  id: string; hora: string; label: string; bloco: string; icon?: string;
}
export interface Configuracoes {
  nome: string;
  notificacoesAtivas: boolean;
  ocultarValores: boolean;
  /** Falso/ausente enquanto o utilizador não passar pelo assistente inicial. */
  onboardingCompleto?: boolean;
  /** Categorias editáveis pelo utilizador. Ausentes = usa os defaults genéricos. */
  categoriasTarefas?: string[];
  categoriasEntrada?: string[];
  categoriasSaida?: string[];
  categoriasContas?: string[];
}
export interface ContaPagar {
  id: string;
  descricao: string;
  credor: string;
  valor: number;
  valorOriginal: number;
  categoria: string;
  prazo: string;
  notas: string;
  pago: boolean;
  pagamentos: Pagamento[];
  criada: string;
}

// ── Helpers ──
export const fmt = (n: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "AOA" }).format(n);

export const fmtMasked = (n: number, oculto: boolean) => oculto ? "••••••" : fmt(n);

export const today = () => new Date().toISOString().split("T")[0];
export const uid = () => Math.random().toString(36).slice(2, 8);
export const diasAtras = (data: string) => Math.floor((Date.now() - new Date(data).getTime()) / 86400000);

export const enforceLogLimits = (log: LogEntry[]): LogEntry[] => {
  let filtered = log.filter(e => diasAtras(e.data) < 7);
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
export const APP_NAME = "My Daily Compass";

export const PRIORIDADES = ["Urgente", "Importante", "Normal"];

// Categorias por defeito — genéricas de propósito. O utilizador edita-as em
// Configurações; ver `Configuracoes.categorias*` e `catsOu()`.
export const CATEGORIAS_T = ["Negócio", "Clientes", "Finanças", "Pessoal", "Família", "Estudo", "Outro"];
export const CATS_ENTRADA = ["Vendas", "Serviços", "Salário", "Rendas", "Empréstimo", "Outro"];
export const CATS_SAIDA = ["Fornecedores", "Casa", "Alimentação", "Transporte", "Salários", "Impostos", "Pessoal", "Outro"];
export const CATS_CONTAS_PAGAR = ["Fornecedor", "Empréstimo", "Renda", "Água/Luz", "Impostos", "Serviços", "Cartão", "Outro"];

/** Devolve a lista do utilizador se existir e não estiver vazia, senão o default. */
export const catsOu = (doUtilizador: string[] | undefined, padrao: string[]) =>
  doUtilizador && doUtilizador.length > 0 ? doUtilizador : padrao;

// ── Modelos de rotina (usados no onboarding e no botão "Modelos") ──

export interface ModeloRotina {
  id: string;
  nome: string;
  desc: string;
  icon: string;
  blocos: Omit<BlocoRotina, "id">[];
}

export const MODELOS_ROTINA: ModeloRotina[] = [
  {
    id: "comerciante",
    nome: "Comércio / Loja",
    desc: "Para quem abre uma loja ou vende durante o dia",
    icon: "store",
    blocos: [
      { hora: "06:30", label: "Acordar e preparar o dia", bloco: "Manhã" },
      { hora: "07:30", label: "Conferir stock e caixa", bloco: "Manhã" },
      { hora: "08:00", label: "Abrir — atendimento", bloco: "Trabalho" },
      { hora: "12:30", label: "Almoço e descanso", bloco: "Pausa" },
      { hora: "13:30", label: "Atendimento e reposição", bloco: "Trabalho" },
      { hora: "17:00", label: "Fecho de caixa do dia", bloco: "Trabalho" },
      { hora: "18:00", label: "Registar vendas na app", bloco: "Noite" },
      { hora: "19:00", label: "Família", bloco: "Família" },
      { hora: "21:00", label: "Cobranças e contas a pagar", bloco: "Noite" },
      { hora: "22:30", label: "Plano de amanhã e descansar", bloco: "Noite" },
    ],
  },
  {
    id: "servicos",
    nome: "Serviços / Escritório",
    desc: "Consultoria, jurídico, contabilidade, agência",
    icon: "briefcase",
    blocos: [
      { hora: "07:00", label: "Acordar e plano do dia", bloco: "Manhã" },
      { hora: "08:30", label: "Processos e prazos urgentes", bloco: "Trabalho" },
      { hora: "11:00", label: "Reuniões e clientes", bloco: "Trabalho" },
      { hora: "13:00", label: "Almoço", bloco: "Pausa" },
      { hora: "14:00", label: "Trabalho de fundo — foco", bloco: "Trabalho" },
      { hora: "16:30", label: "Responder a clientes", bloco: "Trabalho" },
      { hora: "18:00", label: "Facturação e cobranças", bloco: "Trabalho" },
      { hora: "19:00", label: "Pessoal e família", bloco: "Família" },
      { hora: "22:00", label: "Revisão do dia", bloco: "Noite" },
    ],
  },
  {
    id: "paralelo",
    nome: "Emprego + negócio",
    desc: "Tens um emprego e um negócio ao lado",
    icon: "laptop",
    blocos: [
      { hora: "06:30", label: "Acordar e preparar o dia", bloco: "Manhã" },
      { hora: "08:00", label: "Emprego", bloco: "Trabalho" },
      { hora: "12:30", label: "Almoço — tratar do negócio (30 min)", bloco: "Pausa" },
      { hora: "13:30", label: "Emprego", bloco: "Trabalho" },
      { hora: "17:30", label: "Negócio — vendas e clientes", bloco: "Trabalho" },
      { hora: "19:00", label: "Família", bloco: "Família" },
      { hora: "21:00", label: "Registar o dia e cobranças", bloco: "Noite" },
      { hora: "21:45", label: "Aprender algo novo", bloco: "Estudo" },
      { hora: "23:00", label: "Desligar", bloco: "Noite" },
    ],
  },
  {
    id: "equilibrio",
    nome: "Dia equilibrado",
    desc: "Base simples com trabalho, estudo, família e descanso",
    icon: "leaf",
    blocos: [
      { hora: "07:00", label: "Acordar e plano do dia", bloco: "Manhã" },
      { hora: "09:00", label: "Trabalho — bloco principal", bloco: "Trabalho" },
      { hora: "13:00", label: "Almoço e pausa", bloco: "Pausa" },
      { hora: "14:00", label: "Trabalho — segundo bloco", bloco: "Trabalho" },
      { hora: "17:00", label: "Exercício", bloco: "Pessoal" },
      { hora: "18:30", label: "Família", bloco: "Família" },
      { hora: "20:30", label: "Estudo", bloco: "Estudo" },
      { hora: "22:30", label: "Revisão do dia", bloco: "Noite" },
    ],
  },
];

/** Instancia um modelo, atribuindo ids novos aos blocos. */
export const blocosDoModelo = (modelo: ModeloRotina): BlocoRotina[] =>
  modelo.blocos.map(b => ({ ...b, id: uid() }));

export const BLOCO_COLORS: Record<string, string> = {
  "Manhã": "hsl(var(--garcia-gold))",
  "Trabalho": "hsl(var(--garcia-blue))",
  "Pausa": "hsl(var(--garcia-green))",
  "Tese": "hsl(var(--garcia-purple))",
  "Estudo": "hsl(var(--garcia-purple))",
  "Pessoal": "hsl(var(--primary))",
  "Família": "hsl(var(--garcia-pink))",
  "Noite": "hsl(var(--garcia-indigo))",
};

// Um utilizador novo começa sem nada: os negócios são criados por ele no
// assistente inicial (ver components/garcia/Onboarding.tsx).
export const DEFAULT_NEGOCIOS_CFG: NegocioCfg[] = [];

export const DEFAULT_NEGOCIOS: Record<string, Negocio> = {};

/** Um negócio novo, vazio. */
export const negocioVazio = (): Negocio => ({
  receita: 0, gastos: 0, meta: 0, notas: "", log: [], stock: [],
});

export const DEFAULT_APRENDIZADO: AprendizadoArea[] = [];

export const DEFAULT_CONFIG: Configuracoes = {
  nome: "",
  notificacoesAtivas: false,
  ocultarValores: false,
  onboardingCompleto: false,
};

/** Sugestões de negócio mostradas no assistente inicial. */
export const SUGESTOES_NEGOCIO: { nome: string; desc: string; icon: string; tipo: TipoNegocio }[] = [
  { nome: "Loja / Revenda", desc: "Compra e venda de produtos", icon: "store", tipo: "produtos" },
  { nome: "Telemóveis e electrónica", desc: "Venda e reparação", icon: "smartphone", tipo: "produtos" },
  { nome: "Roupa e calçado", desc: "Venda de vestuário", icon: "shirt", tipo: "produtos" },
  { nome: "Restauração", desc: "Comida e bebidas", icon: "utensils", tipo: "produtos" },
  { nome: "Salão / Barbearia", desc: "Serviços de beleza", icon: "scissors", tipo: "servicos" },
  { nome: "Oficina", desc: "Reparação e manutenção", icon: "wrench", tipo: "servicos" },
  { nome: "Serviços profissionais", desc: "Consultoria, jurídico, contabilidade", icon: "briefcase", tipo: "servicos" },
  { nome: "Rendas", desc: "Propriedades arrendadas", icon: "home", tipo: "recorrente" },
];

export const NEGOCIO_ICONS = [
  "smartphone", "car", "shirt", "home", "laptop", "palette", "utensils",
  "store", "shopping-cart", "scissors", "package", "wrench", "music", "camera",
  "briefcase", "hammer", "sparkles", "leaf",
];

export const APRENDIZADO_ICONS = [
  "graduation-cap", "book-open", "brain", "code", "languages", "music",
  "palette", "calculator", "microscope", "globe", "library", "pencil",
];
