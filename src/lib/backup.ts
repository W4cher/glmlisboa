import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { APP_NAME } from "@/lib/garcia";

export const VERSAO_BACKUP = 1;

export interface Backup {
  versao: number;
  app: string;
  exportadoEm: string;
  /** Cada chave de `user_data` com o seu conteúdo: "garcia:negocios", etc. */
  chaves: Record<string, Json>;
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
  };
}

/** Entrega o ficheiro ao utilizador. */
export function descarregarBackup(b: Backup) {
  const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `my-daily-compass-${b.exportadoEm.slice(0, 10)}.json`;
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
  return linhas.length;
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
