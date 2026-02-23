import { useState } from "react";
import { Negocio, NEGOCIOS_CFG, fmt } from "@/lib/garcia";
import { SectionHeader, GCard, GInput, NumInput, StatCard } from "./SharedComponents";

interface Props {
  negocios: Record<string, Negocio>;
  setNegocios: (v: Record<string, Negocio>) => void;
}

export default function TabNegocios({ negocios, setNegocios }: Props) {
  const [sel, setSel] = useState("smartphone");
  const n = negocios[sel] || {} as Negocio;
  const upd = (field: string, val: number | string) => setNegocios({ ...negocios, [sel]: { ...n, [field]: val } });

  const lucro = sel === "rendas" ? (n.receita || 0) : (n.receita || 0) - (n.gastos || 0);
  const margem = n.receita > 0 ? Math.round((lucro / n.receita) * 100) : 0;

  return (
    <div>
      <SectionHeader icon="📊" title="Negócios" sub="Controlo de todos os teus projetos" />

      <div className="flex gap-2 mb-5 flex-wrap">
        {NEGOCIOS_CFG.map(nb => (
          <button key={nb.id} onClick={() => setSel(nb.id)} className="px-4 py-2 rounded-lg cursor-pointer text-[13px] transition-all" style={{
            border: `1px solid ${sel === nb.id ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
            background: sel === nb.id ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--card))",
            color: sel === nb.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            fontWeight: sel === nb.id ? 700 : 400,
          }}>
            {nb.icon} {nb.nome}
          </button>
        ))}
      </div>

      <GCard>
        <div className="font-bold text-[17px] mb-4">
          {NEGOCIOS_CFG.find(x => x.id === sel)?.icon} {NEGOCIOS_CFG.find(x => x.id === sel)?.nome}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <NumInput label="Receita (AOA)" value={n.receita || 0} onChange={v => upd("receita", v)} />
          {sel !== "rendas" && <NumInput label="Gastos (AOA)" value={n.gastos || 0} onChange={v => upd("gastos", v)} />}
          {sel !== "rendas" && <NumInput label="Meta do mês (AOA)" value={n.meta || 0} onChange={v => upd("meta", v)} />}
          {sel === "rendas" && <GInput label="Próximo recebimento" value={n.proxima || ""} onChange={v => upd("proxima", v)} type="date" />}
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <StatCard label="Receita" value={fmt(n.receita || 0)} color="hsl(var(--garcia-green))" small />
          {sel !== "rendas" && <StatCard label="Lucro" value={fmt(lucro)} color={lucro >= 0 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))"} small />}
          {sel !== "rendas" && <StatCard label="Margem" value={`${margem}%`} color={margem >= 30 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-gold))"} small />}
        </div>

        {sel !== "rendas" && (n.meta || 0) > 0 && (
          <div className="mb-4">
            <div className="flex justify-between mb-1.5 text-[13px]">
              <span className="text-muted-foreground">Meta do mês</span>
              <span className="text-primary">{Math.min(100, Math.round(((n.receita || 0) / n.meta) * 100))}%</span>
            </div>
            <div className="h-1.5 bg-garcia-surface-hi rounded-sm">
              <div className="h-full bg-primary rounded-sm" style={{ width: `${Math.min(100, ((n.receita || 0) / n.meta) * 100)}%` }} />
            </div>
          </div>
        )}

        <label className="block text-xs text-muted-foreground mb-1">Notas / Estratégia</label>
        <textarea value={n.notas || ""} onChange={e => upd("notas", e.target.value)}
          placeholder="Escreve aqui estratégias, ideias, observações..."
          className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2.5 text-[13px] min-h-[80px] resize-y" />
      </GCard>

      <div className="mt-5">
        <div className="text-muted-foreground text-[13px] mb-2.5 font-semibold">RESUMO GERAL</div>
        <div className="grid grid-cols-2 gap-2.5">
          {NEGOCIOS_CFG.map(nb => {
            const data = negocios[nb.id] || {} as Negocio;
            const l = nb.id === "rendas" ? data.receita || 0 : (data.receita || 0) - (data.gastos || 0);
            return (
              <div key={nb.id} onClick={() => setSel(nb.id)} className="bg-card border border-border rounded-lg px-3.5 py-3 cursor-pointer">
                <div className="text-[13px] mb-1">{nb.icon} {nb.nome}</div>
                <div className="font-extrabold text-lg" style={{ color: l >= 0 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))" }}>{fmt(l)}</div>
                <div className="text-[11px] text-muted-foreground">{nb.id === "rendas" ? "receita" : "lucro"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
