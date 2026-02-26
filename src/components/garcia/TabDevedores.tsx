import { useState } from "react";
import { Devedor, Negocio, LogEntry, NEGOCIOS_CFG, uid, today, fmt } from "@/lib/garcia";
import { SectionHeader, GCard, GInput, GSelect, GBtn, StatCard, Empty } from "./SharedComponents";

interface Props {
  devedores: Devedor[];
  setDevedores: (v: Devedor[] | ((prev: Devedor[]) => Devedor[])) => void;
  negocios: Record<string, Negocio>;
  setNegocios: (v: Record<string, Negocio> | ((prev: Record<string, Negocio>) => Record<string, Negocio>)) => void;
}

export default function TabDevedores({ devedores, setDevedores, negocios, setNegocios }: Props) {
  const [form, setForm] = useState({ nome: "", valor: "", produto: "", data: today(), notas: "", negocio: "smartphone" });
  const [showForm, setShowForm] = useState(false);
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [valorPagamento, setValorPagamento] = useState("");

  const negocioOptions = [...NEGOCIOS_CFG.map(n => n.id), "outro"];

  const add = () => {
    if (!form.nome || !form.valor) return;
    const val = parseFloat(form.valor);
    setDevedores(prev => [...prev, {
      id: uid(), nome: form.nome, valor: val, valorOriginal: val,
      produto: form.produto, data: form.data, notas: form.notas,
      pago: false, negocio: form.negocio, pagamentos: [],
    }]);
    setForm({ nome: "", valor: "", produto: "", data: today(), notas: "", negocio: "smartphone" });
    setShowForm(false);
  };

  const registarPagamento = (devedor: Devedor) => {
    const montante = parseFloat(valorPagamento);
    if (!montante || montante <= 0) return;
    const restante = devedor.valor - montante;
    const pago = restante <= 0;
    const novoPagamento = { id: uid(), valor: montante, data: today() };

    setDevedores(prev => prev.map(d => d.id === devedor.id ? {
      ...d,
      valor: Math.max(0, restante),
      pago,
      pagamentos: [...(d.pagamentos || []), novoPagamento],
    } : d));

    if (devedor.negocio && devedor.negocio !== "outro") {
      const entrada: LogEntry = {
        id: uid(), tipo: "venda", negocio: devedor.negocio,
        descricao: `💰 Pagamento dívida — ${devedor.nome}${devedor.produto ? ` (${devedor.produto})` : ""}`,
        valor: montante, custo: 0, lucroVenda: montante,
        cliente: devedor.nome, qty: 1, data: today(),
        registadoEm: new Date().toISOString(),
      };
      setNegocios(prev => {
        const n = prev[devedor.negocio] || { receita: 0, gastos: 0, meta: 0, notas: "", log: [] };
        return {
          ...prev,
          [devedor.negocio]: {
            ...n,
            receita: n.receita + montante,
            log: [...(n.log || []), entrada],
          }
        };
      });
    }

    setPagandoId(null);
    setValorPagamento("");
  };

  const del = (id: string) => setDevedores(prev => prev.filter(d => d.id !== id));

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
            <GSelect label="Negócio associado" value={form.negocio} onChange={v => setForm({ ...form, negocio: v })}
              options={negocioOptions} />
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
        {pendentes.map(d => (
          <DevedorRow key={d.id} d={d}
            onPagar={() => setPagandoId(pagandoId === d.id ? null : d.id)}
            onDel={() => del(d.id)}
            isPagando={pagandoId === d.id}
            valorPagamento={valorPagamento}
            setValorPagamento={setValorPagamento}
            onConfirmarPagamento={() => registarPagamento(d)}
          />
        ))}
      </div>

      {pagos.length > 0 && (
        <details className="mt-5">
          <summary className="text-muted-foreground cursor-pointer mb-2">Recebidos ({pagos.length}) — {fmt(pagos.reduce((s, d) => s + (d.valorOriginal || d.valor), 0))}</summary>
          <div className="flex flex-col gap-1.5">
            {pagos.map(d => (
              <DevedorRow key={d.id} d={d} onPagar={() => {}} onDel={() => del(d.id)} done
                isPagando={false} valorPagamento="" setValorPagamento={() => {}} onConfirmarPagamento={() => {}} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function DevedorRow({ d, onPagar, onDel, done = false, isPagando, valorPagamento, setValorPagamento, onConfirmarPagamento }: {
  d: Devedor; onPagar: () => void; onDel: () => void; done?: boolean;
  isPagando: boolean; valorPagamento: string; setValorPagamento: (v: string) => void; onConfirmarPagamento: () => void;
}) {
  const dias = Math.floor((Date.now() - new Date(d.data).getTime()) / 86400000);
  const urgente = dias > 30 && !done;
  const negLabel = NEGOCIOS_CFG.find(n => n.id === d.negocio)?.nome || d.negocio;

  return (
    <div className="bg-card rounded-lg px-4 py-3" style={{
      border: `1px solid ${urgente ? "hsl(var(--garcia-red))" : "hsl(var(--border))"}`,
      opacity: done ? 0.5 : 1,
    }}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px]">{d.nome}</div>
          <div className="text-xs text-muted-foreground">{d.produto} · {d.data}{d.notas ? ` · ${d.notas}` : ""}</div>
          <div className="text-[11px] text-muted-foreground">📦 {negLabel}</div>
          {urgente && <div className="text-[11px] font-semibold" style={{ color: "hsl(var(--garcia-red))" }}>⚠️ {dias} dias em atraso!</div>}
          {(d.pagamentos || []).length > 0 && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {d.pagamentos.length} pagamento(s) · Original: {fmt(d.valorOriginal || d.valor)}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-extrabold text-lg" style={{ color: done ? "hsl(var(--garcia-green))" : "hsl(var(--primary))" }}>{fmt(d.valor)}</div>
          <div className="flex gap-1.5 mt-1 justify-end">
            {!done && <GBtn onClick={onPagar} color="hsl(var(--garcia-green))" small>💳 Pagar</GBtn>}
            <GBtn onClick={onDel} color="hsl(var(--garcia-red))" small>×</GBtn>
          </div>
        </div>
      </div>
      {isPagando && (
        <div className="mt-3 flex gap-2 items-end border-t border-border pt-3">
          <GInput label="Valor do pagamento (AOA)" value={valorPagamento} onChange={setValorPagamento} type="number" placeholder={`Max: ${d.valor}`} />
          <GBtn onClick={onConfirmarPagamento} color="hsl(var(--garcia-green))">Confirmar</GBtn>
          <GBtn onClick={onPagar} color="hsl(var(--muted))">Cancelar</GBtn>
        </div>
      )}
    </div>
  );
}
