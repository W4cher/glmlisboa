import { createContext, useCallback, useContext } from "react";

export type CodigoMoeda =
  | "AOA" | "EUR" | "USD" | "BRL" | "MZN" | "CVE" | "ZAR" | "GBP" | "NGN";

export interface Moeda {
  codigo: CodigoMoeda;
  nome: string;
  simbolo: string;
  /** true = símbolo antes do número ($1 500), false = depois (1 500 Kz) */
  antes: boolean;
  /** locale usado só para agrupar milhares e separar decimais */
  locale: string;
  casas: number;
}

/**
 * O símbolo é escrito por nós em vez de vir do `Intl` com `style: "currency"`,
 * porque o Intl devolve o código ("AOA") em vez do símbolo ("Kz") em vários
 * ambientes — e o símbolo é o que o utilizador reconhece.
 */
export const MOEDAS: Moeda[] = [
  { codigo: "AOA", nome: "Kwanza angolano",      simbolo: "Kz",  antes: false, locale: "pt-AO", casas: 2 },
  { codigo: "EUR", nome: "Euro",                 simbolo: "€",   antes: false, locale: "pt-PT", casas: 2 },
  { codigo: "USD", nome: "Dólar americano",      simbolo: "$",   antes: true,  locale: "en-US", casas: 2 },
  { codigo: "BRL", nome: "Real brasileiro",      simbolo: "R$",  antes: true,  locale: "pt-BR", casas: 2 },
  { codigo: "MZN", nome: "Metical moçambicano",  simbolo: "MT",  antes: false, locale: "pt-MZ", casas: 2 },
  { codigo: "CVE", nome: "Escudo cabo-verdiano", simbolo: "$",   antes: false, locale: "pt-CV", casas: 2 },
  { codigo: "ZAR", nome: "Rand sul-africano",    simbolo: "R",   antes: true,  locale: "en-ZA", casas: 2 },
  { codigo: "GBP", nome: "Libra esterlina",      simbolo: "£",   antes: true,  locale: "en-GB", casas: 2 },
  { codigo: "NGN", nome: "Naira nigeriana",      simbolo: "₦",   antes: true,  locale: "en-NG", casas: 2 },
];

export const MOEDA_PADRAO: CodigoMoeda = "AOA";

const POR_CODIGO: Record<string, Moeda> = Object.fromEntries(
  MOEDAS.map(m => [m.codigo, m])
);

export const getMoeda = (codigo?: string): Moeda =>
  POR_CODIGO[codigo ?? ""] ?? POR_CODIGO[MOEDA_PADRAO];

/** Formata um valor na moeda indicada. Valores inválidos contam como 0. */
export const fmtMoeda = (n: number, codigo?: string): string => {
  const m = getMoeda(codigo);
  const valor = Number.isFinite(n) ? n : 0;
  const num = new Intl.NumberFormat(m.locale, {
    minimumFractionDigits: m.casas,
    maximumFractionDigits: m.casas,
  }).format(valor);
  // Símbolos de mais de um caracter levam espaço antes do número (R$ 1.500),
  // os de um só caracter ficam colados ($1,500, £1,500).
  const separador = m.simbolo.length > 1 ? " " : "";
  return m.antes ? `${m.simbolo}${separador}${num}` : `${num} ${m.simbolo}`;
};

// ── Contexto ──────────────────────────────────────────────────────────────
// Evita passar a moeda como prop por todos os separadores e subcomponentes.

/** Envolver a app com `<MoedaCtx.Provider value={getMoeda(config.moeda).codigo}>`. */
export const MoedaCtx = createContext<CodigoMoeda>(MOEDA_PADRAO);

/** A moeda activa, já resolvida. */
export function useMoeda(): Moeda {
  return getMoeda(useContext(MoedaCtx));
}

/** `fmt(1500)` → "1 500,00 Kz". Substitui o antigo `fmt` fixo em AOA. */
export function useFmt() {
  const codigo = useContext(MoedaCtx);
  return useCallback((n: number) => fmtMoeda(n, codigo), [codigo]);
}

/** Como `useFmt`, mas devolve "••••••" quando os valores estão ocultos. */
export function useFmtMasked() {
  const codigo = useContext(MoedaCtx);
  return useCallback(
    (n: number, oculto: boolean) => (oculto ? "••••••" : fmtMoeda(n, codigo)),
    [codigo]
  );
}

/** Só o símbolo — para etiquetas de campos, ex: "Valor (Kz)". */
export function useSimbolo(): string {
  return useMoeda().simbolo;
}
