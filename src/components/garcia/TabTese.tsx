import { useState } from "react";
import { Tese, uid } from "@/lib/garcia";
import { SectionHeader, GCard, GBtn, Empty } from "./SharedComponents";

interface Props { tese: Tese; setTese: (v: Tese) => void; }

export default function TabTese({ tese, setTese }: Props) {
  const [novaT, setNovaT] = useState("");
  const progGeral = Math.round(tese.capitulos.reduce((s, c) => s + c.progresso, 0) / (tese.capitulos.length * 100) * 100);

  const updCap = (id: string, prog: number) => setTese({ ...tese, capitulos: tese.capitulos.map(c => c.id === id ? { ...c, progresso: prog } : c) });
  const addTarefa = () => {
    if (!novaT.trim()) return;
    setTese({ ...tese, tarefas: [...(tese.tarefas || []), { id: uid(), texto: novaT, feito: false }] });
    setNovaT("");
  };
  const toggleT = (id: string) => setTese({ ...tese, tarefas: (tese.tarefas || []).map(t => t.id === id ? { ...t, feito: !t.feito } : t) });

  return (
    <div>
      <SectionHeader icon="🎓" title="Tese de Mestrado" sub="Blockchain + Federated Learning — UA" />

      <GCard className="mb-5">
        <div className="font-bold text-[15px] mb-1">{tese.titulo}</div>
        <div className="text-muted-foreground text-xs mb-4">Prof. Fábio Coutinho · Prof. Duarte Raposo · Prof. Pedro Rito</div>
        <div className="flex justify-between mb-2">
          <span className="text-muted-foreground text-[13px]">Progresso geral</span>
          <span className="text-primary font-bold text-[15px]">{progGeral}%</span>
        </div>
        <div className="h-2.5 bg-garcia-surface-hi rounded">
          <div className="h-full rounded transition-all duration-400" style={{
            width: `${progGeral}%`,
            background: "linear-gradient(90deg, hsl(var(--garcia-purple)), hsl(var(--primary)))",
          }} />
        </div>
      </GCard>

      <div className="mb-5">
        <div className="text-muted-foreground text-xs font-semibold mb-2.5">CAPÍTULOS</div>
        <div className="flex flex-col gap-2.5">
          {tese.capitulos.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm">{c.nome}</span>
                <span className="text-primary font-bold">{c.progresso}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={c.progresso}
                onChange={e => updCap(c.id, parseInt(e.target.value))} className="w-full" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-muted-foreground text-xs font-semibold mb-2.5">TAREFAS DA TESE</div>
        <div className="flex gap-2 mb-3">
          <input value={novaT} onChange={e => setNovaT(e.target.value)} onKeyDown={e => e.key === "Enter" && addTarefa()}
            placeholder="Adicionar tarefa da tese..."
            className="flex-1 bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2 text-[13px] outline-none" />
          <GBtn onClick={addTarefa} color="hsl(var(--garcia-purple))">+</GBtn>
        </div>
        <div className="flex flex-col gap-1.5">
          {(tese.tarefas || []).map(t => (
            <div key={t.id} onClick={() => toggleT(t.id)} className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3.5 py-2.5 cursor-pointer" style={{ opacity: t.feito ? 0.5 : 1 }}>
              <div className="w-[18px] h-[18px] rounded shrink-0 flex items-center justify-center" style={{
                border: `2px solid ${t.feito ? "hsl(var(--garcia-purple))" : "hsl(var(--border))"}`,
                background: t.feito ? "hsl(var(--garcia-purple))" : "transparent",
              }}>
                {t.feito && <span className="text-[10px]" style={{ color: "#fff" }}>✓</span>}
              </div>
              <span className={`text-sm ${t.feito ? "line-through" : ""}`}>{t.texto}</span>
            </div>
          ))}
          {(tese.tarefas || []).length === 0 && <Empty msg="Sem tarefas para a tese" />}
        </div>
      </div>
    </div>
  );
}
