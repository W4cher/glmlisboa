import { useState } from "react";
import { Devedor, uid, today, fmt } from "@/lib/garcia";
import { SectionHeader, GCard, GInput, GBtn, StatCard, Empty } from "./SharedComponents";

interface Props { devedores: Devedor[]; setDevedores: (v: Devedor[]) => void; }

export default function TabDevedores({ devedores, setDevedores }: Props) {
  const [form, setForm] = useState({ nome: "", valor: "", produto: "", data: today(), notas: "" });
  const [showForm, setShowForm] = useState(false);

  const add = () => {
    if (!form.nome || !form.valor) return;
    setDevedores([...devedores, { id: uid(), nome: form.nome, valor: parseFloat(form.valor), produto: form.produto, data: form.data, notas: form.notas, pago: false }]);
    setForm({ nome: "", valor: "", produto: "", data: today(), notas: "" });
    setShowForm(false);
  };
  const toggle = (id: string) => setDevedores(devedores.map(d => d.id === id ? { ...d, pago: !d.pago } : d));
  const del = (id: string) => setDevedores(devedores.filter(d => d.id !== id));

  const pendentes = devedores.filter(d => !d.pago);
  const pagos = devedores.filter(d => d.pago);
  const totalPendente = pendentes.reduce((s, d) => s + (d.valor || 0), 0);

  return (
    <div>
      <SectionHeader icon="💰" title="Contas a Receber" sub="Nunca mais te esqueças de cobrar" />
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="Total por cobrar" value={fmt(totalPendente)} color="hsl(var(--garcia-red))" />
        <StatCard label="Devedores ativos" value={pendentes.length} color="hsl(var(--garcia-gold))" />
      </div>

      <GBtn onClick={() => setShowForm(!showForm)} color="hsl(var(--primary))">+ Registar Devedor</GBtn>

      {showForm && (
        <GCard className="mt-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <GInput label="Nome*" value={form.nome} onChange={v => setForm({ ...form, nome: v })} placeholder="Nome do cliente" />
            <GInput label="Valor (AOA)*" value={form.valor} onChange={v => setForm({ ...form, valor: v })} type="number" placeholder="0" />
            <GInput label="Produto/Serviço" value={form.produto} onChange={v => setForm({ ...form, produto: v })} placeholder="Ex: iPhone 13" />
            <GInput label="Data da dívida" value={form.data} onChange={v => setForm({ ...form, data: v })} type="date" />
          </div>
          <div className="mt-2.5">
            <GInput label="Notas" value={form.notas} onChange={v => setForm({ ...form, notas: v })} placeholder="Observações..." />
          </div>
          <div className="mt-3 flex gap-2">
            <GBtn onClick={add} color="hsl(var(--primary))">Guardar</GBtn>
            <GBtn onClick={() => setShowForm(false)} color="hsl(var(--muted))">Cancelar</GBtn>
          </div>
        </GCard>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {pendentes.length === 0 && <Empty msg="Sem cobranças pendentes 💚" />}
        {pendentes.map(d => <DevedorRow key={d.id} d={d} onToggle={() => toggle(d.id)} onDel={() => del(d.id)} />)}
      </div>

      {pagos.length > 0 && (
        <details className="mt-5">
          <summary className="text-muted-foreground cursor-pointer mb-2">Recebidos ({pagos.length}) — {fmt(pagos.reduce((s, d) => s + d.valor, 0))}</summary>
          <div className="flex flex-col gap-1.5">
            {pagos.map(d => <DevedorRow key={d.id} d={d} onToggle={() => toggle(d.id)} onDel={() => del(d.id)} done />)}
          </div>
        </details>
      )}
    </div>
  );
}

function DevedorRow({ d, onToggle, onDel, done = false }: { d: Devedor; onToggle: () => void; onDel: () => void; done?: boolean }) {
  const dias = Math.floor((Date.now() - new Date(d.data).getTime()) / 86400000);
  const urgente = dias > 30 && !done;

  return (
    <div className="flex items-center gap-3 bg-card rounded-lg px-4 py-3" style={{
      border: `1px solid ${urgente ? "hsl(var(--garcia-red))" : "hsl(var(--border))"}`,
      opacity: done ? 0.5 : 1,
    }}>
      <div>
        <div className="font-bold text-[15px]">{d.nome}</div>
        <div className="text-xs text-muted-foreground">{d.produto} · {d.data}{d.notas ? ` · ${d.notas}` : ""}</div>
        {urgente && <div className="text-[11px] font-semibold" style={{ color: "hsl(var(--garcia-red))" }}>⚠️ {dias} dias em atraso!</div>}
      </div>
      <div className="ml-auto text-right">
        <div className="font-extrabold text-lg" style={{ color: done ? "hsl(var(--garcia-green))" : "hsl(var(--primary))" }}>{fmt(d.valor)}</div>
        <div className="flex gap-1.5 mt-1 justify-end">
          <GBtn onClick={onToggle} color={done ? "hsl(var(--muted))" : "hsl(var(--garcia-green))"} small>{done ? "↩ Desfazer" : "✓ Recebido"}</GBtn>
          <GBtn onClick={onDel} color="hsl(var(--garcia-red))" small>×</GBtn>
        </div>
      </div>
    </div>
  );
}
