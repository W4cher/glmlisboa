import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadKey, saveKey, requireAuth } from "../supabase";

export default defineTool({
  name: "complete_tarefa",
  title: "Marcar tarefa como feita",
  description: "Marca uma tarefa como concluída pelo seu id.",
  inputSchema: {
    id: z.string().min(1).describe("O id da tarefa."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    requireAuth(ctx);
    const tarefas = (await loadKey<any[]>(ctx, "garcia:tarefas")) ?? [];
    const idx = tarefas.findIndex((t) => t.id === id);
    if (idx < 0) {
      return { content: [{ type: "text", text: "Tarefa não encontrada." }], isError: true };
    }
    tarefas[idx].feito = true;
    await saveKey(ctx, "garcia:tarefas", tarefas);
    return { content: [{ type: "text", text: `Tarefa "${tarefas[idx].texto}" concluída.` }] };
  },
});
