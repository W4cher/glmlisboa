import { useState } from "react";
import { Devedor, Negocio, NegocioCfg, LogEntry, uid, today } from "@/lib/garcia";
import { useFmt, useFmtMasked, useSimbolo } from "@/lib/moeda";
import { SectionHeader, GCard, GInput, GSelect, GBtn, StatCard, Empty } from "./SharedComponents";
import { Wallet, CreditCard, Trash2, Pencil, Check, X, AlertTriangle, Briefcase } from "lucide-react";

interface Props {
  devedores: Devedor[];
  setDevedores: (v: Devedor[] | ((prev: Devedor[]) => Devedor[])) => void;
  negocios: Record<string, Negocio>;
  setNegocios: (v: Record<string, Negocio> | ((prev: Record<string, Negocio>) => Record<string, Negocio>)) => void;
  negociosCfg: NegocioCfg[];
  ocultarValores?: boolean;
}

export default function TabDevedores({ devedores, setDevedores, negocios, setNegocios, negociosCfg, ocultarValores = false }: Props) {
  const fmt = useFmt();
  const fmtMasked = useFmtMasked();
  const simbolo = useSimbolo();
  const [form, setForm] = useState({ nome: "", valor: "", produto: "", data: today(), notas: "", negocio: negociosCfg[0]?.id || "" });
  const [showForm, setShowForm] = useState(false);
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [valorPagamento, setValorPagamento] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Devedor>>({});

  const negocioOptions = [...negociosCfg.map(n => n.id), "outro"];

  const add = () => {
    if (!form.nome || !form.valor) return;
    const val = parseFloat(form.valor);
    setDevedores(prev => [...prev, {
      id: uid(), nome: form.nome, valor: val, valorOriginal: val,
      produto: form.produto, data: form.data, notas: form.notas,
      pago: false, negocio: form.negocio, pagamentos: [],
    }]);
    setForm({ nome: "", valor: "", produto: "", data: today(), notas: "", negocio: negociosCfg[0]?.id || "" });
    setShowForm(false);
  };

  const startEdit = (d: Devedor) => {
    setEditId(d.id);
    setEditForm({ nome: d.nome, produto: d.produto, notas: d.notas, negocio: d.negocio, valor: d.valor });
  };

  const saveEdit = () => {
    if (!editId) return;
    setDevedores(prev => prev.map(d => d.id === editId ? {
      ...d,
      nome: editForm.nome ?? d.nome,
      produto: editForm.produto ?? d.produto,
      notas: editForm.notas ?? d.notas,
      negocio: editForm.negocio ?? d.negocio,
      valor: editForm.valor ?? d.valor,
    } : d));
    setEditId(null);
    setEditForm({});
  };

  const registarPagamento = (devedor: Devedor) => {
    const montante = parseFloat(valorPagamento);
    if (!montante || montante <= 0) return;
    const restante = devedor.valor - montante;
    const pago = restante <= 0;
    const novoPagamento = { id: uid(), valor: montante, data: today() };

    setDevedores(prev => prev.map(d => d.id === devedor.id ? {
      ...d, valor: Math.max(0, restante), pago,
      pagamentos: [...(d.pagamentos || []), novoPagamento],
    } : d));

    if (devedor.negocio && devedor.negocio !== "outro") {
      const entrada: LogEntry = {
        id: uid(), tipo: "venda", negocio: devedor.negocio,
        descricao: `Pagamento dívida — ${devedor.nome}${devedor.produto ? ` (${devedor.produto})` : ""}`,
        valor: montante, custo: 0, lucroVenda: montante,
        cliente: devedor.nome, qty: 1, data: today(),
        registadoEm: new Date().toISOString(),
      };
      setNegocios(prev => {
        const current = prev[devedor.negocio];
        if (!current) return prev;
        return {
          ...prev,
          [devedor.negocio]: {
            ...current,
            receita: (current.receita || 0) + montante,
            log: [...(current.log || []), entrada],
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

  const getNegLabel = (id: string) => negociosCfg.find(n => n.id === id)?.nome || id;

  return (
    <div>
      <SectionHeader icon={<Wallet size={22} />} title="Contas a Receber" sub="Nunca mais te esqueças de cobrar" />
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
        <StatCard label="Total por cobrar" value={fmtMasked(totalPendente, ocultarValores)} color="hsl(var(--garcia-red))" />
        <StatCard label="Devedores ativos" value={pendentes.length} color="hsl(var(--garcia-gold))" />
      </div>

      <GBtn onClick={() => setShowForm(!showForm)} color="hsl(var(--primary))">+ Registar Devedor</GBtn>

      {showForm && (
        <GCard className="mt-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GInput label="Nome*" value={form.nome} onChange={v => setForm({ ...form, nome: v })} placeholder="Nome do cliente" />
            <GInput label={`Valor (${simbolo})*`} value={form.valor} onChange={v => setForm({ ...form, valor: v })} type="number" placeholder="0" />
            <GInput label="Produto/Serviço" value={form.produto} onChange={v => setForm({ ...form, produto: v })} placeholder="Ex: iPhone 13" />
            <GInput label="Data da dívida" value={form.data} onChange={v => setForm({ ...form, data: v })} type="date" />
            <GSelect label="Negócio associado" value={form.negocio} onChange={v => setForm({ ...form, negocio: v })} options={negocioOptions} />
          </div>
          <div className="mt-2.5">
            <GInput label="Notas" value={form.notas} onChange={v => setForm({ ...form, notas: v })} placeholder="Observações..." />
          </div>
          <div className="mt-3 flex gap-2">
            <GBtn onClick={add} color="hsl(var(--primary))">Guardar</GBtn>
            <GBtn onClick={() => setShowForm(false)} color="hsl(var(--garcia-neutral))">Cancelar</GBtn>
          </div>
        </GCard>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {pendentes.length === 0 && <Empty msg="Sem cobranças pendentes" />}
        {pendentes.map(d => (
          <DevedorRow
            key={d.id} d={d}
            negLabel={getNegLabel(d.negocio)}
            negocioOptions={negocioOptions}
            ocultarValores={ocultarValores}
            onPagar={() => setPagandoId(pagandoId === d.id ? null : d.id)}
            onDel={() => del(d.id)}
            isPagando={pagandoId === d.id}
            valorPagamento={valorPagamento}
            setValorPagamento={setValorPagamento}
            onConfirmarPagamento={() => registarPagamento(d)}
            isEdit={editId === d.id}
            editForm={editForm}
            setEditForm={setEditForm}
            onStartEdit={() => startEdit(d)}
            onSaveEdit={saveEdit}
            onCancelEdit={() => { setEditId(null); setEditForm({}); }}
          />
        ))}
      </div>

      {pagos.length > 0 && (
        <details className="mt-5">
          <summary className="text-muted-foreground cursor-pointer mb-2">Recebidos ({pagos.length}) — {fmtMasked(pagos.reduce((s, d) => s + (d.valorOriginal || d.valor), 0), ocultarValores)}</summary>
          <div className="flex flex-col gap-1.5">
            {pagos.map(d => (
              <DevedorRow key={d.id} d={d} negLabel={getNegLabel(d.negocio)} negocioOptions={negocioOptions}
                ocultarValores={ocultarValores}
                onPagar={() => {}} onDel={() => del(d.id)} done
                isPagando={false} valorPagamento="" setValorPagamento={() => {}} onConfirmarPagamento={() => {}}
                isEdit={false} editForm={{}} setEditForm={() => {}} onStartEdit={() => {}} onSaveEdit={() => {}} onCancelEdit={() => {}}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function DevedorRow({
  d, negLabel, negocioOptions, ocultarValores, onPagar, onDel, done = false,
  isPagando, valorPagamento, setValorPagamento, onConfirmarPagamento,
  isEdit, editForm, setEditForm, onStartEdit, onSaveEdit, onCancelEdit,
}: {
  d: Devedor; negLabel: string; negocioOptions: string[]; ocultarValores: boolean;
  onPagar: () => void; onDel: () => void; done?: boolean;
  isPagando: boolean; valorPagamento: string; setValorPagamento: (v: string) => void; onConfirmarPagamento: () => void;
  isEdit: boolean; editForm: Partial<Devedor>; setEditForm: (v: Partial<Devedor>) => void;
  onStartEdit: () => void; onSaveEdit: () => void; onCancelEdit: () => void;
}) {
  const fmtMasked = useFmtMasked();
  const simbolo = useSimbolo();
  const dias = Math.floor((Date.now() - new Date(d.data).getTime()) / 86400000);
  const urgente = dias > 30 && !done;

  if (isEdit) {
    return (
      <GCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <GInput label="Nome" value={editForm.nome || ""} onChange={v => setEditForm({ ...editForm, nome: v })} />
          <GInput label={`Valor (${simbolo})`} value={String(editForm.valor ?? "")} onChange={v => setEditForm({ ...editForm, valor: parseFloat(v) || 0 })} type="number" />
          <GInput label="Produto" value={editForm.produto || ""} onChange={v => setEditForm({ ...editForm, produto: v })} />
          <GSelect label="Negócio" value={editForm.negocio || ""} onChange={v => setEditForm({ ...editForm, negocio: v })} options={negocioOptions} />
        </div>
        <div className="mt-2.5"><GInput label="Notas" value={editForm.notas || ""} onChange={v => setEditForm({ ...editForm, notas: v })} /></div>
        <div className="mt-3 flex gap-2">
          <GBtn onClick={onSaveEdit} color="hsl(var(--garcia-green))"><Check size={14} /> Guardar</GBtn>
          <GBtn onClick={onCancelEdit} color="hsl(var(--garcia-neutral))"><X size={14} /> Cancelar</GBtn>
        </div>
      </GCard>
    );
  }

  return (
    <div className="bg-card rounded-lg px-4 py-3" style={{
      border: `1px solid ${urgente ? "hsl(var(--garcia-red))" : "hsl(var(--border))"}`,
      opacity: done ? 0.5 : 1,
    }}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px]">{d.nome}</div>
          <div className="text-xs text-muted-foreground">{d.produto} · {d.data}{d.notas ? ` · ${d.notas}` : ""}</div>
          <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><Briefcase size={11} /> {negLabel}</div>
          {urgente && <div className="text-[11px] font-semibold inline-flex items-center gap-1" style={{ color: "hsl(var(--garcia-red))" }}><AlertTriangle size={11} /> {dias} dias em atraso!</div>}
          {(d.pagamentos || []).length > 0 && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {d.pagamentos.length} pagamento(s) · Original: {fmtMasked(d.valorOriginal || d.valor, ocultarValores)}
            </div>
          )}
        </div>
        <div className="text-right shrink-0 min-w-0 max-w-[45%]">
          <div className="font-extrabold text-base sm:text-lg break-words" style={{ color: done ? "hsl(var(--garcia-green))" : "hsl(var(--primary))", overflowWrap: "anywhere" }}>{fmtMasked(d.valor, ocultarValores)}</div>
          <div className="flex gap-1.5 mt-1 justify-end">
            {!done && <GBtn onClick={onPagar} color="hsl(var(--garcia-green))" small><CreditCard size={12} /> Pagar</GBtn>}
            {!done && <GBtn onClick={onStartEdit} color="hsl(var(--garcia-blue))" small><Pencil size={12} /></GBtn>}
            <GBtn onClick={onDel} color="hsl(var(--garcia-red))" small><Trash2 size={12} /></GBtn>
          </div>
        </div>
      </div>
      {isPagando && (
        <div className="mt-3 flex gap-2 items-end border-t border-border pt-3">
          <GInput label={`Valor do pagamento (${simbolo})`} value={valorPagamento} onChange={setValorPagamento} type="number" placeholder={`Max: ${d.valor}`} />
          <GBtn onClick={onConfirmarPagamento} color="hsl(var(--garcia-green))">Confirmar</GBtn>
          <GBtn onClick={onPagar} color="hsl(var(--garcia-neutral))">Cancelar</GBtn>
        </div>
      )}
    </div>
  );
}
