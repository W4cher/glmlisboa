import { defineTool } from "@lovable.dev/mcp-js";
import { loadKey, requireAuth } from "../supabase";

export default defineTool({
  name: "financas_resumo",
  title: "Resumo financeiro",
  description: "Devolve totais de entradas, saídas e saldo do utilizador (em AOA).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    requireAuth(ctx);
    const fin = (await loadKey<any>(ctx, "garcia:finanas")) ?? { entradas: [], saidas: [] };
    const totalEntradas = (fin.entradas ?? []).reduce((s: number, i: any) => s + (Number(i.valor) || 0), 0);
    const totalSaidas = (fin.saidas ?? []).reduce((s: number, i: any) => s + (Number(i.valor) || 0), 0);
    const saldo = totalEntradas - totalSaidas;
    return {
      content: [
        {
          type: "text",
          text: `Entradas: ${totalEntradas} AOA\nSaídas: ${totalSaidas} AOA\nSaldo: ${saldo} AOA`,
        },
      ],
      structuredContent: { totalEntradas, totalSaidas, saldo, entradas: fin.entradas, saidas: fin.saidas },
    };
  },
});
