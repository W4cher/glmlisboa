import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

export function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function loadKey<T>(ctx: ToolContext, key: string): Promise<T | null> {
  const sb = supabaseForUser(ctx);
  const { data, error } = await sb
    .from("user_data")
    .select("data_value")
    .eq("user_id", ctx.getUserId())
    .eq("data_key", key)
    .maybeSingle();
  if (error || !data) return null;
  return data.data_value as T;
}

export async function saveKey<T>(ctx: ToolContext, key: string, value: T) {
  const sb = supabaseForUser(ctx);
  const { error } = await sb.from("user_data").upsert(
    {
      user_id: ctx.getUserId(),
      data_key: key,
      data_value: value as any,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,data_key" }
  );
  if (error) throw new Error(error.message);
}

export function requireAuth(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) {
    throw new Error("Not authenticated");
  }
}
