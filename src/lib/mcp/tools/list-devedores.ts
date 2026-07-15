import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadKey, requireAuth } from "../supabase";

export default defineTool({
  name: "list_devedores",
  title: "Listar cobranças",
  description: "Lista os devedores/cobranças do utilizador. Opcionalmente apenas os não pagos.",
  inputSchema: {
    apenasPendentes: z.boolean().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ apenasPendentes }, ctx) => {
    requireAuth(ctx);
    const devedores = (await loadKey<any[]>(ctx, "garcia:devedores")) ?? [];
    const filtered = apenasPendentes ? devedores.filter((d) => !d.pago) : devedores;
    const totalDevido = filtered
      .filter((d) => !d.pago)
      .reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ totalDevido, devedores: filtered }, null, 2) }],
      structuredContent: { totalDevido, devedores: filtered },
    };
  },
});
