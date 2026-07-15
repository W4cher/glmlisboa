import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadKey, saveKey, requireAuth } from "../supabase";

export default defineTool({
  name: "add_tarefa",
  title: "Adicionar tarefa",
  description: "Cria uma nova tarefa na lista do utilizador.",
  inputSchema: {
    texto: z.string().min(1).describe("Descrição da tarefa."),
    prioridade: z.enum(["Urgente", "Importante", "Normal"]).optional(),
    categoria: z.string().optional(),
    prazo: z.string().optional().describe("Data no formato YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ texto, prioridade, categoria, prazo }, ctx) => {
    requireAuth(ctx);
    const tarefas = (await loadKey<any[]>(ctx, "garcia:tarefas")) ?? [];
    const nova = {
      id: Math.random().toString(36).slice(2, 8),
      texto,
      prioridade: prioridade ?? "Normal",
      categoria: categoria ?? "Outro",
      prazo: prazo ?? "",
      feito: false,
      criada: new Date().toISOString(),
    };
    tarefas.unshift(nova);
    await saveKey(ctx, "garcia:tarefas", tarefas);
    return {
      content: [{ type: "text", text: `Tarefa criada: ${nova.texto}` }],
      structuredContent: { tarefa: nova },
    };
  },
});
