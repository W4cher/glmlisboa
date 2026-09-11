import { supabase } from "@/integrations/supabase/client";

export type Plano = "gratuito" | "pro" | "equipa" | "vitalicio";

export const PLANOS: { id: Plano; nome: string; desc: string }[] = [
  { id: "gratuito", nome: "Gratuito", desc: "2 negócios, sem colaboradores" },
  { id: "pro", nome: "Pro", desc: "Negócios sem limite, 3 colaboradores" },
  { id: "equipa", nome: "Equipa", desc: "Negócios sem limite, 10 colaboradores" },
  { id: "vitalicio", nome: "Vitalício", desc: "Tudo, para sempre, sem pagar" },
];

export interface Utilizador {
  id: string;
  email: string | null;
  nome: string | null;
  plano: Plano;
  plano_expira_em: string | null;
  plano_notas: string;
  is_admin: boolean;
  criado_em: string;
}

/**
 * Diz se a conta autenticada é administradora.
 *
 * Devolve false em vez de rebentar quando a coluna não existe — a app tem de
 * continuar a funcionar contra uma base de dados anterior a esta funcionalidade.
 */
export async function souAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !data) return false;
    return !!data.is_admin;
  } catch {
    return false;
  }
}

/** Todos os utilizadores. O RLS só devolve a lista completa a administradores. */
export async function listarUtilizadores(): Promise<Utilizador[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, nome, plano, plano_expira_em, plano_notas, is_admin, criado_em")
    .order("criado_em", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Utilizador[];
}

/**
 * Muda o plano de alguém. Quem decide se pode é a base de dados: a função
 * `definir_plano` verifica quem está a chamar e recusa quem não é
 * administrador. Aqui só se pede.
 */
export async function definirPlano(
  userId: string,
  plano: Plano,
  expiraEm?: string | null,
  notas?: string
): Promise<void> {
  const { error } = await supabase.rpc("definir_plano", {
    p_user: userId,
    p_plano: plano,
    p_expira: expiraEm ?? null,
    p_notas: notas ?? "",
  });
  if (error) throw new Error(error.message);
}

/** O plano que vale hoje: um plano pago com a data passada conta como gratuito. */
export function planoEfectivo(u: Pick<Utilizador, "plano" | "plano_expira_em">): Plano {
  if (u.plano === "vitalicio" || u.plano === "gratuito") return u.plano;
  if (!u.plano_expira_em) return u.plano;
  return new Date(u.plano_expira_em) > new Date() ? u.plano : "gratuito";
}

/** Data de hoje + N meses, no formato que o input date usa. */
export function daquiAMeses(meses: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}
