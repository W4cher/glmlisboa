import { useState } from "react";
import { BlocoRotina, MODELOS_ROTINA, BLOCO_COLORS, blocosDoModelo, today, uid } from "@/lib/garcia";
import { SectionHeader, GCard, GBtn, GInput } from "./SharedComponents";
import { Icon } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Sparkles, Trash2, Plus, Check, LayoutTemplate } from "lucide-react";

interface Props {
  rotinaDia: Record<string, Record<string, boolean>>;
  setRotinaDia: (v: Record<string, Record<string, boolean>>) => void;
  blocos: BlocoRotina[];
  setBlocos: (v: BlocoRotina[]) => void;
  nome?: string;
}

export default function TabRotina({ rotinaDia, setRotinaDia, blocos, setBlocos, nome }: Props) {
  const [showAI, setShowAI] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showModelos, setShowModelos] = useState(false);
  const [rotinaAtual, setRotinaAtual] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumoIA, setResumoIA] = useState("");
  const [novoBloco, setNovoBloco] = useState({ hora: "08:00", label: "", bloco: "Manhã" });

  const key = today();
  const checks = rotinaDia[key] || {};
  const toggle = (id: string) => setRotinaDia({ ...rotinaDia, [key]: { ...checks, [id]: !checks[id] } });

  const sortedBlocos = [...blocos].sort((a, b) => a.hora.localeCompare(b.hora));
  const feitos = Object.values(checks).filter(Boolean).length;
  const pct = sortedBlocos.length > 0 ? Math.round((feitos / sortedBlocos.length) * 100) : 0;

  const now = new Date();
  const horaAtual = now.getHours() * 60 + now.getMinutes();
  const blocoAtivo = [...sortedBlocos].reverse().find(b => {
    const [h, m] = b.hora.split(":").map(Number);
    return horaAtual >= h * 60 + m;
  });

  const gerarComIA = async () => {
    if (!rotinaAtual.trim()) {
      toast.error("Descreve a tua rotina actual primeiro");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-rotina", {
        body: { rotinaAtual, objetivos },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const novosBlocos: BlocoRotina[] = (data.blocos || []).map((b: any) => ({
        id: uid(), hora: b.hora, label: b.label, bloco: b.categoria,
      }));
      if (novosBlocos.length === 0) {
        toast.error("A IA não devolveu blocos");
        return;
      }
      setBlocos(novosBlocos);
      setResumoIA(data.resumo || "");
      setRotinaDia({ ...rotinaDia, [key]: {} });
      setShowAI(false);
      setRotinaAtual("");
      toast.success("Rotina personalizada gerada");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar rotina");
    } finally {
      setLoading(false);
    }
  };

  const addBloco = () => {
    if (!novoBloco.label.trim()) return;
    setBlocos([...blocos, { id: uid(), ...novoBloco }]);
    setNovoBloco({ hora: "08:00", label: "", bloco: "Manhã" });
    setShowAdd(false);
  };

  const delBloco = (id: string) => setBlocos(blocos.filter(b => b.id !== id));

  const aplicarModelo = (modeloId: string) => {
    const modelo = MODELOS_ROTINA.find(m => m.id === modeloId);
    if (!modelo) return;
    setBlocos(blocosDoModelo(modelo));
    setRotinaDia({ ...rotinaDia, [key]: {} });
    setResumoIA("");
    setShowModelos(false);
    toast.success(`Modelo "${modelo.nome}" aplicado`);
  };

  return (
    <div>
      <SectionHeader
        icon={<Clock size={22} />}
        title={nome ? `Rotina, ${nome}` : "Rotina do Dia"}
        sub="O teu plano diário personalizado"
      />

      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Progresso hoje</span>
          <span className="text-primary font-bold">{feitos}/{sortedBlocos.length} blocos — {pct}%</span>
        </div>
        <div className="h-2 bg-garcia-surface-hi rounded">
          <div className="h-full rounded transition-all duration-400" style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--garcia-gold)))",
          }} />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <GBtn onClick={() => setShowAI(!showAI)} color="hsl(var(--garcia-purple))"><Sparkles size={14} /> Gerar com IA</GBtn>
        <GBtn onClick={() => setShowAdd(!showAdd)} color="hsl(var(--primary))"><Plus size={14} /> Bloco</GBtn>
        <GBtn onClick={() => setShowModelos(!showModelos)} color="hsl(var(--muted))"><LayoutTemplate size={14} /> Modelos</GBtn>
      </div>

      {showModelos && (
        <GCard className="mb-4">
          <div className="font-semibold text-sm mb-1 inline-flex items-center gap-2">
            <LayoutTemplate size={16} /> Escolher um modelo
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            Substitui os blocos actuais por um ponto de partida. Depois ajustas as horas.
          </div>
          <div className="flex flex-col gap-2">
            {MODELOS_ROTINA.map(m => (
              <button key={m.id} onClick={() => aplicarModelo(m.id)}
                className="text-left rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer border border-border bg-garcia-surface-hi hover:border-primary transition-colors">
                <span className="text-muted-foreground shrink-0"><Icon name={m.icon} size={17} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[13px]">{m.nome}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{m.desc} · {m.blocos.length} blocos</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <GBtn onClick={() => setShowModelos(false)} color="hsl(var(--muted))" small>Cancelar</GBtn>
          </div>
        </GCard>
      )}

      {showAI && (
        <GCard className="mb-4">
          <div className="font-semibold text-sm mb-2 inline-flex items-center gap-2"><Sparkles size={16} /> Conta-me a tua rotina</div>
          <div className="text-xs text-muted-foreground mb-3">Descreve a tua rotina actual, o que sentes que está mal, e os teus objectivos. A IA vai propor uma rotina ideal.</div>
          <textarea value={rotinaAtual} onChange={e => setRotinaAtual(e.target.value)}
            placeholder="Ex: Abro a loja às 8h, fico sozinho até à tarde, não tenho tempo para tratar das cobranças nem para a família..."
            className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2.5 text-[13px] min-h-[110px] resize-y mb-2" />
          <textarea value={objetivos} onChange={e => setObjetivos(e.target.value)}
            placeholder="Objectivos: vender mais, ter tempo para a família, organizar as contas do negócio..."
            className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2.5 text-[13px] min-h-[70px] resize-y" />
          <div className="mt-3 flex gap-2">
            <GBtn onClick={gerarComIA} color="hsl(var(--garcia-purple))">{loading ? "A pensar..." : "Gerar rotina"}</GBtn>
            <GBtn onClick={() => setShowAI(false)} color="hsl(var(--muted))">Cancelar</GBtn>
          </div>
        </GCard>
      )}

      {resumoIA && (
        <div className="bg-[hsl(var(--garcia-accent-soft))] border border-primary/30 rounded-lg p-3 mb-4 text-[13px]">
          <div className="font-semibold mb-1 inline-flex items-center gap-1.5 text-primary"><Sparkles size={13} /> Análise da IA</div>
          <div className="text-muted-foreground">{resumoIA}</div>
        </div>
      )}

      {showAdd && (
        <GCard className="mb-4">
          <div className="grid grid-cols-3 gap-3">
            <GInput label="Hora (HH:MM)" value={novoBloco.hora} onChange={v => setNovoBloco({ ...novoBloco, hora: v })} type="time" />
            <GInput label="Descrição" value={novoBloco.label} onChange={v => setNovoBloco({ ...novoBloco, label: v })} placeholder="Ex: Estudar inglês" />
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Categoria</label>
              <select value={novoBloco.bloco} onChange={e => setNovoBloco({ ...novoBloco, bloco: e.target.value })}
                className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2 text-[13px] outline-none">
                {Object.keys(BLOCO_COLORS).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <GBtn onClick={addBloco} color="hsl(var(--primary))">Adicionar</GBtn>
            <GBtn onClick={() => setShowAdd(false)} color="hsl(var(--muted))">Cancelar</GBtn>
          </div>
        </GCard>
      )}

      <div className="flex flex-col gap-2">
        {sortedBlocos.map(b => {
          const feito = !!checks[b.id];
          const isAtivo = blocoAtivo?.id === b.id;
          const cor = BLOCO_COLORS[b.bloco] || "hsl(var(--muted-foreground))";
          return (
            <div key={b.id} className="flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-150" style={{
              background: feito ? "hsl(var(--garcia-surface-hi))" : "hsl(var(--card))",
              border: `1px solid ${isAtivo ? cor : "hsl(var(--border))"}`,
              opacity: feito ? 0.65 : 1,
              boxShadow: isAtivo ? `0 0 0 1px ${cor}40` : "none",
            }}>
              <div className="w-[3px] h-9 rounded-sm shrink-0" style={{ background: cor }} />
              <div onClick={() => toggle(b.id)} className="flex-1 cursor-pointer">
                <div className={`font-semibold text-sm ${feito ? "line-through" : ""}`}>{b.label}</div>
                <div className="text-muted-foreground text-xs">
                  {b.hora} · <span style={{ color: cor }}>{b.bloco}</span>{isAtivo ? " · AGORA" : ""}
                </div>
              </div>
              <div onClick={() => toggle(b.id)} className="w-[22px] h-[22px] rounded-md shrink-0 flex items-center justify-center cursor-pointer" style={{
                border: `2px solid ${feito ? cor : "hsl(var(--border))"}`,
                background: feito ? cor : "transparent",
              }}>
                {feito && <Check size={13} color="#000" strokeWidth={3} />}
              </div>
              <button onClick={() => delBloco(b.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
        {sortedBlocos.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">Sem blocos. Escolhe um modelo, gera uma rotina com IA ou adiciona à mão.</div>
        )}
      </div>
    </div>
  );
}
