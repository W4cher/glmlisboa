// Edge function: propõe uma rotina diária a partir do dia real do utilizador.
//
// Escolhe o fornecedor de IA sozinha, por esta ordem:
//   1. ANTHROPIC_API_KEY  → Claude (claude-opus-5)
//   2. LOVABLE_API_KEY    → gateway de IA do Lovable (google/gemini-2.5-flash)
//
// A ordem é o que permite mudar de casa sem parar o serviço: enquanto a app
// vive no Lovable continua a usar o gateway dele; assim que a ANTHROPIC_API_KEY
// for definida nos segredos do Supabase, passa a usar a chave própria. Nenhum
// dos lados precisa de saber do outro, e não há momento em que a função esteja
// em baixo.
//
// Ambos os caminhos devolvem exactamente { resumo, blocos } — a app não muda.

import Anthropic from "npm:@anthropic-ai/sdk@0.124.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIAS = ["Manhã", "Trabalho", "Pausa", "Estudo", "Pessoal", "Família", "Noite"] as const;

const SYSTEM_PROMPT =
  "És um coach de produtividade especializado em rotinas diárias, a trabalhar com " +
  "pequenos empreendedores. O utilizador vai descrever a sua rotina actual problemática " +
  "e os seus objectivos. Propõe uma rotina ideal, realista e equilibrada para um dia " +
  "(24h), em português de Portugal. Cada bloco deve ter hora (HH:MM em formato 24h), " +
  "um label curto (máximo 60 caracteres) e uma categoria. Sê concreto e respeita as " +
  "obrigações que a pessoa já tem — não proponhas uma vida que ela não pode viver.";

const DESCRICAO_FERRAMENTA = "Propõe blocos de rotina diária optimizados";

const PROPRIEDADES = {
  resumo: {
    type: "string",
    description: "Análise breve da rotina actual e principais ajustes propostos (máximo 2 frases)",
  },
  blocos: {
    type: "array",
    items: {
      type: "object",
      properties: {
        hora: { type: "string", description: "HH:MM" },
        label: { type: "string" },
        categoria: { type: "string", enum: [...CATEGORIAS] },
      },
      required: ["hora", "label", "categoria"],
      additionalProperties: false,
    },
  },
} as const;

interface Proposta {
  resumo: string;
  blocos: { hora: string; label: string; categoria: string }[];
}

const promptUtilizador = (rotinaAtual: string, objetivos: string) =>
  `Rotina actual:\n${rotinaAtual}\n\nObjectivos:\n${objetivos || "melhorar produtividade e equilíbrio"}`;

/** Erro com um código HTTP e uma mensagem já pronta para o utilizador ler. */
class ErroIA extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

// ── Claude ─────────────────────────────────────────────────────────────────

async function gerarComClaude(
  apiKey: string,
  rotinaAtual: string,
  objetivos: string,
): Promise<Proposta> {
  const client = new Anthropic({ apiKey });

  try {
    const resposta = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 8000,
      // Tarefa simples e bem definida: não vale a pena pagar raciocínio profundo.
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: promptUtilizador(rotinaAtual, objetivos) }],
      tools: [
        {
          name: "propor_rotina",
          description: DESCRICAO_FERRAMENTA,
          strict: true,
          input_schema: {
            type: "object",
            properties: PROPRIEDADES,
            required: ["resumo", "blocos"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: { type: "tool", name: "propor_rotina" },
    });

    const bloco = resposta.content.find((b) => b.type === "tool_use");
    if (!bloco || bloco.type !== "tool_use") {
      throw new ErroIA(502, "A IA não devolveu uma rotina. Tenta outra vez.");
    }
    return bloco.input as unknown as Proposta;
  } catch (e) {
    if (e instanceof ErroIA) throw e;
    if (e instanceof Anthropic.RateLimitError) {
      throw new ErroIA(429, "Limite de pedidos atingido, tenta novamente em alguns segundos.");
    }
    if (e instanceof Anthropic.AuthenticationError) {
      console.error("ANTHROPIC_API_KEY inválida ou expirada");
      throw new ErroIA(500, "A chave de IA do servidor não está válida.");
    }
    if (e instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", e.status, e.message);
      throw new ErroIA(502, "O serviço de IA falhou. Tenta novamente.");
    }
    throw e;
  }
}

// ── Gateway do Lovable (enquanto a app viver lá) ───────────────────────────

async function gerarComLovable(
  apiKey: string,
  rotinaAtual: string,
  objetivos: string,
): Promise<Proposta> {
  const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + " Devolve apenas via tool call." },
        { role: "user", content: promptUtilizador(rotinaAtual, objetivos) },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "propor_rotina",
            description: DESCRICAO_FERRAMENTA,
            parameters: {
              type: "object",
              properties: PROPRIEDADES,
              required: ["resumo", "blocos"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "propor_rotina" } },
    }),
  });

  if (resposta.status === 429) {
    throw new ErroIA(429, "Limite de pedidos atingido, tenta novamente em alguns segundos.");
  }
  if (resposta.status === 402) {
    throw new ErroIA(402, "Créditos da IA esgotados. Adiciona fundos no workspace.");
  }
  if (!resposta.ok) {
    console.error("AI gateway error:", resposta.status, await resposta.text());
    throw new ErroIA(502, "Erro do gateway de IA");
  }

  const data = await resposta.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new ErroIA(502, "Sem proposta de rotina");
  return JSON.parse(toolCall.function.arguments) as Proposta;
}

// ── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { rotinaAtual, objetivos } = await req.json();
    if (typeof rotinaAtual !== "string" || !rotinaAtual.trim()) {
      return json({ error: "Descreve a tua rotina actual primeiro." }, 400);
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    let proposta: Proposta;
    if (anthropicKey) {
      proposta = await gerarComClaude(anthropicKey, rotinaAtual, objetivos ?? "");
    } else if (lovableKey) {
      proposta = await gerarComLovable(lovableKey, rotinaAtual, objetivos ?? "");
    } else {
      console.error("Nenhuma chave de IA configurada (ANTHROPIC_API_KEY ou LOVABLE_API_KEY)");
      return json({ error: "A geração por IA não está configurada neste servidor." }, 503);
    }

    if (!Array.isArray(proposta?.blocos) || proposta.blocos.length === 0) {
      return json({ error: "A IA não devolveu blocos." }, 502);
    }

    return json({ resumo: proposta.resumo ?? "", blocos: proposta.blocos });
  } catch (e) {
    if (e instanceof ErroIA) return json({ error: e.message }, e.status);
    console.error("gerar-rotina error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
