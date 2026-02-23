import { useState, useEffect } from "react";
import { load, save, Devedor, Negocio, Tese, Tarefa, Financas, DEFAULT_TESE, DEFAULT_NEGOCIOS } from "@/lib/garcia";
import TabRotina from "@/components/garcia/TabRotina";
import TabTarefas from "@/components/garcia/TabTarefas";
import TabDevedores from "@/components/garcia/TabDevedores";
import TabNegocios from "@/components/garcia/TabNegocios";
import TabTese from "@/components/garcia/TabTese";
import TabFinancas from "@/components/garcia/TabFinancas";

const tabs = [
  { id: "rotina", icon: "⏰", label: "Rotina" },
  { id: "tarefas", icon: "✅", label: "Tarefas" },
  { id: "devedores", icon: "💰", label: "Cobranças" },
  { id: "negocios", icon: "📊", label: "Negócios" },
  { id: "tese", icon: "🎓", label: "Tese" },
  { id: "finanas", icon: "💳", label: "Finanças" },
];

export default function Index() {
  const [tab, setTab] = useState("rotina");
  const [loaded, setLoaded] = useState(false);

  const [devedores, setDevedores] = useState<Devedor[]>([]);
  const [negocios, setNegocios] = useState<Record<string, Negocio>>(DEFAULT_NEGOCIOS);
  const [tese, setTese] = useState<Tese>(DEFAULT_TESE);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [rotinaDia, setRotinaDia] = useState<Record<string, Record<string, boolean>>>({});
  const [finanas, setFinanas] = useState<Financas>({ entradas: [], saidas: [] });

  useEffect(() => {
    const d = load<Devedor[]>("garcia:devedores"); if (d) setDevedores(d);
    const n = load<Record<string, Negocio>>("garcia:negocios"); if (n) setNegocios(n);
    const t = load<Tese>("garcia:tese"); if (t) setTese(t);
    const tk = load<Tarefa[]>("garcia:tarefas"); if (tk) setTarefas(tk);
    const rd = load<Record<string, Record<string, boolean>>>("garcia:rotina"); if (rd) setRotinaDia(rd);
    const fi = load<Financas>("garcia:finanas"); if (fi) setFinanas(fi);
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) save("garcia:devedores", devedores); }, [devedores, loaded]);
  useEffect(() => { if (loaded) save("garcia:negocios", negocios); }, [negocios, loaded]);
  useEffect(() => { if (loaded) save("garcia:tese", tese); }, [tese, loaded]);
  useEffect(() => { if (loaded) save("garcia:tarefas", tarefas); }, [tarefas, loaded]);
  useEffect(() => { if (loaded) save("garcia:rotina", rotinaDia); }, [rotinaDia, loaded]);
  useEffect(() => { if (loaded) save("garcia:finanas", finanas); }, [finanas, loaded]);

  if (!loaded) return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="text-primary text-2xl font-mono">A carregar o teu sistema...</div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen font-sans text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold text-primary-foreground"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--garcia-gold)))" }}>G</div>
        <div>
          <div className="font-bold text-base tracking-tight">Sistema Garcia</div>
          <div className="text-muted-foreground text-[11px]">
            {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <div className="ml-auto flex gap-1.5">
          <MiniStat label="Cobranças" value={devedores.filter(d => !d.pago).length} color="hsl(var(--garcia-red))" />
          <MiniStat label="Tarefas" value={tarefas.filter(t => !t.feito).length} color="hsl(var(--garcia-gold))" />
        </div>
      </div>

      {/* Nav */}
      <div className="flex overflow-x-auto bg-card border-b border-border px-3">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-3 bg-transparent border-none cursor-pointer text-[13px] whitespace-nowrap transition-all flex items-center gap-1.5"
            style={{
              color: tab === t.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              fontWeight: tab === t.id ? 700 : 400,
              borderBottom: tab === t.id ? "2px solid hsl(var(--primary))" : "2px solid transparent",
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto p-5">
        {tab === "rotina" && <TabRotina rotinaDia={rotinaDia} setRotinaDia={setRotinaDia} />}
        {tab === "tarefas" && <TabTarefas tarefas={tarefas} setTarefas={setTarefas} />}
        {tab === "devedores" && <TabDevedores devedores={devedores} setDevedores={setDevedores} />}
        {tab === "negocios" && <TabNegocios negocios={negocios} setNegocios={setNegocios} />}
        {tab === "tese" && <TabTese tese={tese} setTese={setTese} />}
        {tab === "finanas" && <TabFinancas finanas={finanas} setFinanas={setFinanas} />}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center bg-garcia-surface-hi rounded-lg px-2.5 py-1 border border-border">
      <div className="text-lg font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}
