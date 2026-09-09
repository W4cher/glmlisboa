import { useState } from "react";
import {
  APP_NAME, MODELOS_ROTINA, SUGESTOES_NEGOCIO, NEGOCIO_ICONS,
  BlocoRotina, Negocio, NegocioCfg, TipoNegocio,
  blocosDoModelo, negocioVazio, uid,
} from "@/lib/garcia";
import { MOEDAS, MOEDA_PADRAO, type CodigoMoeda } from "@/lib/moeda";
import { Icon } from "@/lib/icons";
import { GBtn } from "./SharedComponents";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Sparkles } from "lucide-react";

export interface DadosOnboarding {
  nome: string;
  moeda: CodigoMoeda;
  negociosCfg: NegocioCfg[];
  negocios: Record<string, Negocio>;
  blocos: BlocoRotina[];
}

interface Props {
  onConcluir: (dados: DadosOnboarding) => void;
}

const PASSOS = ["Bem-vindo", "Negócios", "Rotina", "Pronto"];

export default function Onboarding({ onConcluir }: Props) {
  const [passo, setPasso] = useState(0);
  const [nome, setNome] = useState("");
  const [moeda, setMoeda] = useState<CodigoMoeda>(MOEDA_PADRAO);
  const [escolhidos, setEscolhidos] = useState<NegocioCfg[]>([]);
  const [modeloRotina, setModeloRotina] = useState<string>("");

  // criação manual de negócio
  const [aCriar, setACriar] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoIcon, setNovoIcon] = useState("package");
  const [novoTipo, setNovoTipo] = useState<TipoNegocio>("produtos");

  const jaEscolhido = (nomeNeg: string) => escolhidos.some(e => e.nome === nomeNeg);

  const alternarSugestao = (s: typeof SUGESTOES_NEGOCIO[number]) => {
    setEscolhidos(prev =>
      prev.some(e => e.nome === s.nome)
        ? prev.filter(e => e.nome !== s.nome)
        : [...prev, { id: uid(), icon: s.icon, nome: s.nome, desc: s.desc, tipo: s.tipo }]
    );
  };

  const criarManual = () => {
    const limpo = novoNome.trim();
    if (!limpo) return;
    setEscolhidos(prev => [...prev, { id: uid(), icon: novoIcon, nome: limpo, desc: "", tipo: novoTipo }]);
    setNovoNome("");
    setNovoIcon("package");
    setNovoTipo("produtos");
    setACriar(false);
  };

  const concluir = () => {
    const negocios: Record<string, Negocio> = {};
    escolhidos.forEach(cfg => { negocios[cfg.id] = negocioVazio(); });
    const modelo = MODELOS_ROTINA.find(m => m.id === modeloRotina);
    onConcluir({
      nome: nome.trim(),
      moeda,
      negociosCfg: escolhidos,
      negocios,
      blocos: modelo ? blocosDoModelo(modelo) : [],
    });
  };

  const avancar = () => (passo < PASSOS.length - 1 ? setPasso(p => p + 1) : concluir());
  const recuar = () => setPasso(p => Math.max(0, p - 1));

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      {/* barra de progresso */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-4">
        <div className="max-w-[720px] mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--garcia-gold)))" }}
            >
              <Sparkles size={16} />
            </div>
            <span className="font-bold tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex gap-1.5">
            {PASSOS.map((p, i) => (
              <div key={p} className="flex-1">
                <div
                  className="h-1 rounded-full transition-colors"
                  style={{ background: i <= passo ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                />
                <div
                  className="text-[10px] mt-1 truncate"
                  style={{ color: i <= passo ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                >
                  {p}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] w-full mx-auto px-4 sm:px-6 py-8">
        {/* ── Passo 0: nome ── */}
        {passo === 0 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Vamos preparar a tua app</h1>
            <p className="text-muted-foreground text-sm mb-6">
              São três perguntas rápidas. Podes mudar tudo mais tarde em Configurações.
            </p>
            <label className="block text-[11px] text-muted-foreground mb-1.5">Como te chamas?</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === "Enter" && nome.trim() && avancar()}
              placeholder="O teu primeiro nome"
              autoFocus
              className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-4 py-3 text-base outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Serve só para te tratar pelo nome dentro da app.
            </p>

            <label className="block text-[11px] text-muted-foreground mt-6 mb-1.5">
              Em que moeda trabalhas?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MOEDAS.map(m => {
                const activo = moeda === m.codigo;
                return (
                  <button
                    key={m.codigo}
                    onClick={() => setMoeda(m.codigo)}
                    className="text-left rounded-xl px-3 py-2.5 cursor-pointer border transition-all"
                    style={{
                      borderColor: activo ? "hsl(var(--primary))" : "hsl(var(--border))",
                      background: activo ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--card))",
                    }}
                  >
                    <span className="flex items-baseline gap-1.5">
                      <span
                        className="font-extrabold text-base"
                        style={{ color: activo ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
                      >
                        {m.simbolo}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{m.codigo}</span>
                    </span>
                    <span className="block text-[11px] text-muted-foreground truncate">{m.nome}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Todos os valores da app passam a aparecer nesta moeda. Podes mudar depois.
            </p>
          </div>
        )}

        {/* ── Passo 1: negócios ── */}
        {passo === 1 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
              {nome ? `${nome}, o que fazes?` : "O que fazes?"}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Escolhe os negócios que queres controlar. Podes escolher mais do que um, criar o teu, ou
              saltar e fazer isto depois.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {SUGESTOES_NEGOCIO.map(s => {
                const activo = jaEscolhido(s.nome);
                return (
                  <button
                    key={s.nome}
                    onClick={() => alternarSugestao(s)}
                    className="text-left rounded-xl px-3.5 py-3 flex items-center gap-3 transition-all cursor-pointer border"
                    style={{
                      borderColor: activo ? "hsl(var(--primary))" : "hsl(var(--border))",
                      background: activo ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--card))",
                    }}
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: "hsl(var(--garcia-surface-hi))",
                        color: activo ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      <Icon name={s.icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-sm truncate">{s.nome}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">{s.desc}</span>
                    </span>
                    {activo && <Check size={16} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* negócios criados à mão */}
            {escolhidos.filter(e => !SUGESTOES_NEGOCIO.some(s => s.nome === e.nome)).map(e => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 mb-2 border border-primary"
                style={{ background: "hsl(var(--garcia-accent-soft))" }}
              >
                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-primary bg-garcia-surface-hi">
                  <Icon name={e.icon} size={18} />
                </span>
                <span className="flex-1 font-semibold text-sm truncate">{e.nome}</span>
                <button
                  onClick={() => setEscolhidos(prev => prev.filter(x => x.id !== e.id))}
                  className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {aCriar ? (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="font-semibold text-sm mb-3">Criar o meu negócio</div>
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {NEGOCIO_ICONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setNovoIcon(ic)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border transition-all"
                      style={{
                        background: novoIcon === ic ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--garcia-surface-hi))",
                        borderColor: novoIcon === ic ? "hsl(var(--primary))" : "hsl(var(--border))",
                        color: novoIcon === ic ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      <Icon name={ic} size={16} />
                    </button>
                  ))}
                </div>
                <input
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && criarManual()}
                  placeholder="Nome do negócio"
                  autoFocus
                  className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2 text-[13px] outline-none mb-3"
                />
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {([
                    ["produtos", "Vendo produtos"],
                    ["servicos", "Presto serviços"],
                    ["recorrente", "Recebo todos os meses"],
                  ] as [TipoNegocio, string][]).map(([t, label]) => (
                    <button
                      key={t}
                      onClick={() => setNovoTipo(t)}
                      className="px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-all"
                      style={{
                        borderColor: novoTipo === t ? "hsl(var(--primary))" : "hsl(var(--border))",
                        background: novoTipo === t ? "hsl(var(--garcia-accent-soft))" : "transparent",
                        color: novoTipo === t ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <GBtn onClick={criarManual} color="hsl(var(--primary))">Adicionar</GBtn>
                  <GBtn onClick={() => setACriar(false)} color="hsl(var(--muted))">Cancelar</GBtn>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setACriar(true)}
                className="w-full px-3 py-3 rounded-xl cursor-pointer text-[13px] border border-dashed border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary transition-all bg-transparent inline-flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> O meu negócio não está na lista
              </button>
            )}
          </div>
        )}

        {/* ── Passo 2: rotina ── */}
        {passo === 2 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Como é o teu dia?</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Escolhe um ponto de partida. Vais poder apagar, mudar horas e acrescentar blocos —
              ou pedir à IA que desenhe a rotina a partir do teu dia real.
            </p>

            <div className="flex flex-col gap-2">
              {MODELOS_ROTINA.map(m => {
                const activo = modeloRotina === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModeloRotina(m.id)}
                    className="text-left rounded-xl px-4 py-3.5 flex items-center gap-3 transition-all cursor-pointer border"
                    style={{
                      borderColor: activo ? "hsl(var(--primary))" : "hsl(var(--border))",
                      background: activo ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--card))",
                    }}
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-garcia-surface-hi"
                      style={{ color: activo ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                    >
                      <Icon name={m.icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-sm">{m.nome}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {m.desc} · {m.blocos.length} blocos
                      </span>
                    </span>
                    {activo && <Check size={16} className="text-primary shrink-0" />}
                  </button>
                );
              })}

              <button
                onClick={() => setModeloRotina("")}
                className="text-left rounded-xl px-4 py-3.5 transition-all cursor-pointer border"
                style={{
                  borderColor: modeloRotina === "" ? "hsl(var(--primary))" : "hsl(var(--border))",
                  background: modeloRotina === "" ? "hsl(var(--garcia-accent-soft))" : "transparent",
                  borderStyle: "dashed",
                }}
              >
                <span className="block font-semibold text-sm">Começar em branco</span>
                <span className="block text-[11px] text-muted-foreground">Monto a minha rotina de raiz</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Passo 3: resumo ── */}
        {passo === 3 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Tudo pronto{nome ? `, ${nome}` : ""}.
            </h1>
            <p className="text-muted-foreground text-sm mb-6">É assim que a tua app vai arrancar:</p>

            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              <div className="px-4 py-3 flex items-start gap-3">
                <Check size={16} className="text-[hsl(var(--garcia-green))] mt-0.5 shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">{escolhidos.length} negócio{escolhidos.length === 1 ? "" : "s"}</div>
                  <div className="text-muted-foreground text-xs">
                    {escolhidos.length > 0
                      ? escolhidos.map(e => e.nome).join(", ")
                      : "Nenhum por agora — crias no separador Negócios."}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 flex items-start gap-3">
                <Check size={16} className="text-[hsl(var(--garcia-green))] mt-0.5 shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">Moeda</div>
                  <div className="text-muted-foreground text-xs">
                    {MOEDAS.find(m => m.codigo === moeda)?.nome} ({MOEDAS.find(m => m.codigo === moeda)?.simbolo})
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 flex items-start gap-3">
                <Check size={16} className="text-[hsl(var(--garcia-green))] mt-0.5 shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">Rotina</div>
                  <div className="text-muted-foreground text-xs">
                    {MODELOS_ROTINA.find(m => m.id === modeloRotina)?.nome ?? "Em branco — montas os teus blocos."}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              A seguir podes registar vendas, quem te deve dinheiro, contas a pagar e o teu stock.
            </p>
          </div>
        )}
      </div>

      {/* navegação */}
      <div className="border-t border-border bg-card px-4 sm:px-6 py-4 sticky bottom-0">
        <div className="max-w-[720px] mx-auto flex items-center gap-2">
          {passo > 0 && (
            <button
              onClick={recuar}
              className="px-3 py-2 rounded-lg text-[13px] cursor-pointer bg-transparent border border-border text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          )}
          <div className="flex-1" />
          {passo > 0 && passo < 3 && (
            <button
              onClick={avancar}
              className="px-3 py-2 rounded-lg text-[13px] cursor-pointer bg-transparent border-none text-muted-foreground hover:text-foreground transition-colors"
            >
              Saltar
            </button>
          )}
          <button
            onClick={avancar}
            disabled={passo === 0 && !nome.trim()}
            className="px-5 py-2.5 rounded-lg font-semibold text-[13px] text-primary-foreground border-none inline-flex items-center gap-1.5 transition-opacity"
            style={{
              background: "hsl(var(--primary))",
              opacity: passo === 0 && !nome.trim() ? 0.4 : 1,
              cursor: passo === 0 && !nome.trim() ? "not-allowed" : "pointer",
            }}
          >
            {passo === 3 ? "Começar" : "Continuar"}
            {passo === 3 ? <Check size={15} /> : <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
