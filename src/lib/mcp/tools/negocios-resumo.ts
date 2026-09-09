import { defineTool } from "@lovable.dev/mcp-js";
import { loadKey, requireAuth } from "../supabase";

export default defineTool({
  name: "negocios_resumo",
  title: "Resumo dos negócios",
  description: "Devolve receita, gastos, lucro e stock de cada negócio do utilizador, na moeda que ele configurou.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    requireAuth(ctx);
    const negocios = (await loadKey<Record<string, any>>(ctx, "garcia:negocios")) ?? {};
    const cfg = (await loadKey<any[]>(ctx, "garcia:negocios_cfg")) ?? [];
    const conf = (await loadKey<any>(ctx, "garcia:config")) ?? {};
    const moeda: string = conf.moeda ?? "AOA";
    const resumo = Object.entries(negocios).map(([id, n]: [string, any]) => {
      const meta = cfg.find((c) => c.id === id);
      const stockValor = (n.stock ?? []).reduce(
        (s: number, i: any) => s + (Number(i.quantidade) || 0) * (Number(i.precoVenda) || 0),
        0
      );
      return {
        id,
        nome: meta?.nome ?? id,
        receita: n.receita ?? 0,
        gastos: n.gastos ?? 0,
        lucro: (n.receita ?? 0) - (n.gastos ?? 0),
        stockItens: (n.stock ?? []).length,
        stockValorVenda: stockValor,
      };
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ moeda, negocios: resumo }, null, 2) }],
      structuredContent: { moeda, negocios: resumo },
    };
  },
});
