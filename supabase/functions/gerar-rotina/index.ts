// Edge function: gera rotina personalizada com Lovable AI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rotinaAtual, objetivos } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `És um coach de produtividade especializado em rotinas diárias. O utilizador vai descrever a sua rotina actual problemática e os seus objectivos. Tu deves propor uma rotina ideal, realista e equilibrada para um dia (24h), em português de Portugal. Cada bloco deve ter hora (HH:MM 24h), label curto (max 60 chars), categoria entre: Manhã, Trabalho, Pausa, Estudo, Pessoal, Família, Noite. Devolve apenas via tool call.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Rotina actual:\n${rotinaAtual}\n\nObjectivos:\n${objetivos || "melhorar produtividade e equilíbrio"}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "propor_rotina",
            description: "Propõe blocos de rotina diária optimizados",
            parameters: {
              type: "object",
              properties: {
                resumo: { type: "string", description: "Análise breve da rotina atual e principais ajustes propostos (max 2 frases)" },
                blocos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      hora: { type: "string", description: "HH:MM" },
                      label: { type: "string" },
                      categoria: { type: "string", enum: ["Manhã", "Trabalho", "Pausa", "Estudo", "Pessoal", "Família", "Noite"] },
                    },
                    required: ["hora", "label", "categoria"],
                  },
                },
              },
              required: ["resumo", "blocos"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "propor_rotina" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de pedidos atingido, tenta novamente em alguns segundos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adiciona fundos no workspace." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro do gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Sem proposta de rotina");
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gerar-rotina error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
