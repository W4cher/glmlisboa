import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTarefas from "./tools/list-tarefas";
import addTarefa from "./tools/add-tarefa";
import completeTarefa from "./tools/complete-tarefa";
import listDevedores from "./tools/list-devedores";
import negociosResumo from "./tools/negocios-resumo";
import financasResumo from "./tools/financas-resumo";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sistema-garcia-mcp",
  title: "BIZ MCP",
  version: "0.1.0",
  instructions:
    "Ferramentas para o BIZ: tarefas, cobranças, negócios (stock e receita) e finanças pessoais. Todas as ferramentas actuam apenas sobre os dados do utilizador autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTarefas, addTarefa, completeTarefa, listDevedores, negociosResumo, financasResumo],
});
