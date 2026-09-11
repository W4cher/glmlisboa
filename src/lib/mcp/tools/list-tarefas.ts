import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadKey, requireAuth } from "../supabase";

export default defineTool({
  name: "list_tarefas",
  title: "Listar tarefas",
  description: "Lista as tarefas do utilizador autenticado no BIZ.",
  inputSchema: {
    apenasPendentes: z.boolean().optional().describe("Se true, retorna apenas tarefas por fazer."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ apenasPendentes }, ctx) => {
    requireAuth(ctx);
    const tarefas = (await loadKey<any[]>(ctx, "garcia:tarefas")) ?? [];
    const filtered = apenasPendentes ? tarefas.filter((t) => !t.feito) : tarefas;
    return {
      content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
      structuredContent: { tarefas: filtered },
    };
  },
});
