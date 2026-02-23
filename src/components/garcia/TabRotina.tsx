import { BLOCOS_ROTINA, BLOCO_COLORS, today } from "@/lib/garcia";
import { SectionHeader } from "./SharedComponents";

interface Props {
  rotinaDia: Record<string, Record<string, boolean>>;
  setRotinaDia: (v: Record<string, Record<string, boolean>>) => void;
}

export default function TabRotina({ rotinaDia, setRotinaDia }: Props) {
  const key = today();
  const checks = rotinaDia[key] || {};
  const toggle = (id: string) => {
    setRotinaDia({ ...rotinaDia, [key]: { ...checks, [id]: !checks[id] } });
  };

  const feitos = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((feitos / BLOCOS_ROTINA.length) * 100);

  const now = new Date();
  const horaAtual = now.getHours() * 60 + now.getMinutes();
  const blocoAtivo = [...BLOCOS_ROTINA].reverse().find(b => {
    const [h, m] = b.hora.split(":").map(Number);
    return horaAtual >= h * 60 + m;
  });

  return (
    <div>
      <SectionHeader icon="⏰" title="Rotina do Dia" sub="O teu plano diário otimizado" />

      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Progresso hoje</span>
          <span className="text-primary font-bold">{feitos}/{BLOCOS_ROTINA.length} blocos — {pct}%</span>
        </div>
        <div className="h-2 bg-garcia-surface-hi rounded">
          <div className="h-full rounded transition-all duration-400" style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--garcia-gold)))",
          }} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {BLOCOS_ROTINA.map(b => {
          const feito = !!checks[b.id];
          const isAtivo = blocoAtivo?.id === b.id;
          const cor = BLOCO_COLORS[b.bloco];
          return (
            <div key={b.id} onClick={() => toggle(b.id)} className="flex items-center gap-3.5 rounded-lg px-4 py-3 cursor-pointer transition-all duration-150" style={{
              background: feito ? "hsl(var(--garcia-surface-hi))" : "hsl(var(--card))",
              border: `1px solid ${isAtivo ? cor : "hsl(var(--border))"}`,
              opacity: feito ? 0.65 : 1,
              boxShadow: isAtivo ? `0 0 0 1px ${cor}40` : "none",
            }}>
              <div className="w-[3px] h-9 rounded-sm shrink-0" style={{ background: cor }} />
              <div className="text-xl">{b.icon}</div>
              <div className="flex-1">
                <div className={`font-semibold text-sm ${feito ? "line-through" : ""}`}>{b.label}</div>
                <div className="text-muted-foreground text-xs">
                  {b.hora} · <span style={{ color: cor }}>{b.bloco}</span>{isAtivo ? " · 🟢 AGORA" : ""}
                </div>
              </div>
              <div className="w-[22px] h-[22px] rounded-md shrink-0 flex items-center justify-center" style={{
                border: `2px solid ${feito ? cor : "hsl(var(--border))"}`,
                background: feito ? cor : "transparent",
              }}>
                {feito && <span className="text-[13px] font-extrabold" style={{ color: "#000" }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-muted-foreground text-xs text-center">Clica em cada bloco para marcar como feito</div>
    </div>
  );
}
