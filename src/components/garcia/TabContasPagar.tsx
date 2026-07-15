import { useState } from "react";
import { ContaPagar, CATS_CONTAS_PAGAR, uid, today, fmtMasked, diasAtras } from "@/lib/garcia";
import { SectionHeader, GCard, GInput, GSelect, GBtn, StatCard, Empty } from "./SharedComponents";
import { CreditCard, Trash2, Pencil, Check, X, AlertTriangle, Receipt } from "lucide-react";

interface Props {
  contas: ContaPagar[];
  setContas: (v: ContaPagar[] | ((prev: ContaPagar[]) => ContaPagar[])) => void;
  ocultarValores?: boolean;
}

export default function TabContasPagar({ contas, setContas, ocultarValores = false }: Props) {
  const [form, setForm] = useState({ descricao: "", credor: "", valor: "", categoria: CATS_CONTAS_PAGAR[0], prazo: today(), notas: "" });
  const [showForm, setShowForm] = useState(false);
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [valorPagamento, setValorPagamento] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContaPagar>>({});

  const add = () => {
    if (!form.descricao || !form.valor) return;
    const val = parseFloat(form.valor);
    setContas(prev => [...prev, {
      id: uid(), descricao: form.descricao, credor: form.credor, valor: val, valorOriginal: val,
      categoria: form.categoria, prazo: form.prazo, notas: form.notas,
      pago: false, pagamentos: [], criada: today(),
    }]);
    setForm({ descricao: "", credor: "", valor: "", categoria: CATS_CONTAS_PAGAR[0], prazo: today(), notas: "" });
    setShowForm(false);
  };

  const startEdit = (c: ContaPagar) => {
    setEditId(c.id);
    setEditForm({ descricao: c.descricao, credor: c.credor, valor: c.valor, categoria: c.categoria, prazo: c.prazo, notas: c.notas });
  };

  const saveEdit = () => {
    if (!editId) return;
    setContas(prev => prev.map(c => c.id === editId ? {
      ...c,
      descricao: editForm.descricao ?? c.descricao,
      credor: editForm.credor ?? c.credor,
      valor: editForm.valor ?? c.valor,
      categoria: editForm.categoria ?? c.categoria,
      prazo: editForm.prazo ?? c.prazo,
      notas: editForm.notas ?? c.notas,
    } : c));
    setEditId(null);
    setEditForm({});
  };

  const registarPagamento = (c: ContaPagar) => {
    const m = parseFloat(valorPagamento);
    if (!m || m <= 0) return;
    const restante = c.valor - m;
    const pago = restante <= 0;
    setContas(prev => prev.map(x => x.id === c.id ? {
      ...x, valor: Math.max(0, restante), pago,
      pagamentos: [...(x.pagamentos || []), { id: uid(), valor: m, data: today() }],
    } : x));
    setPagandoId(null);
    setValorPagamento("");
  };

  const del = (id: string) => setContas(prev => prev.filter(c => c.id !== id));

  const pendentes = contas.filter(c => !c.pago);
  const pagos = contas.filter(c => c.pago);
  const totalPendente = pendentes.reduce((s, c) => s + (c.valor || 0), 0);

  return (
    <div>
      <SectionHeader icon={<Receipt size={22} />} title="Contas a Pagar" sub="Controla o que tens de pagar" />
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
        <StatCard label="Total a pagar" value={fmtMasked(totalPendente, ocultarValores)} color="hsl(var(--garcia-red))" />
        <StatCard label="Contas em aberto" value={pendentes.length} color="hsl(var(--garcia-gold))" />
      </div>

      <GBtn onClick={() => setShowForm(!showForm)} color="hsl(var(--primary))">+ Nova Conta a Pagar</GBtn>

      {showForm && (
        <GCard className="mt-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GInput label="Descrição*" value={form.descricao} onChange={v => setForm({ ...form, descricao: v })} placeholder="Ex: Fornecedor peças" />
            <GInput label="Credor" value={form.credor} onChange={v => setForm({ ...form, credor: v })} placeholder="A quem devo" />
            <GInput label="Valor (AOA)*" value={form.valor} onChange={v => setForm({ ...form, valor: v })} type="number" placeholder="0" />
            <GSelect label="Categoria" value={form.categoria} onChange={v => setForm({ ...form, categoria: v })} options={CATS_CONTAS_PAGAR} />
            <GInput label="Prazo" value={form.prazo} onChange={v => setForm({ ...form, prazo: v })} type="date" />
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
        {pendentes.length === 0 && <Empty msg="Sem contas a pagar 🎉" />}
        {pendentes.map(c => {
          const diasParaPrazo = -diasAtras(c.prazo);
          const vencida = diasParaPrazo < 0;
          const isEdit = editId === c.id;

          if (isEdit) {
            return (
              <GCard key={c.id}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <GInput label="Descrição" value={editForm.descricao || ""} onChange={v => setEditForm({ ...editForm, descricao: v })} />
                  <GInput label="Credor" value={editForm.credor || ""} onChange={v => setEditForm({ ...editForm, credor: v })} />
                  <GInput label="Valor" value={String(editForm.valor ?? "")} onChange={v => setEditForm({ ...editForm, valor: parseFloat(v) || 0 })} type="number" />
                  <GSelect label="Categoria" value={editForm.categoria || ""} onChange={v => setEditForm({ ...editForm, categoria: v })} options={CATS_CONTAS_PAGAR} />
                  <GInput label="Prazo" value={editForm.prazo || ""} onChange={v => setEditForm({ ...editForm, prazo: v })} type="date" />
                </div>
                <div className="mt-2.5"><GInput label="Notas" value={editForm.notas || ""} onChange={v => setEditForm({ ...editForm, notas: v })} /></div>
                <div className="mt-3 flex gap-2">
                  <GBtn onClick={saveEdit} color="hsl(var(--garcia-green))"><Check size={14} /> Guardar</GBtn>
                  <GBtn onClick={() => { setEditId(null); setEditForm({}); }} color="hsl(var(--muted))"><X size={14} /> Cancelar</GBtn>
                </div>
              </GCard>
            );
          }

          return (
            <div key={c.id} className="bg-card rounded-lg px-3 sm:px-4 py-3" style={{
              border: `1px solid ${vencida ? "hsl(var(--garcia-red))" : "hsl(var(--border))"}`,
            }}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] truncate">{c.descricao}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.credor && `${c.credor} · `}{c.categoria} · Prazo {c.prazo}
                  </div>
                  {c.notas && <div className="text-[11px] text-muted-foreground truncate">{c.notas}</div>}
                  {vencida && <div className="text-[11px] font-semibold inline-flex items-center gap-1" style={{ color: "hsl(var(--garcia-red))" }}><AlertTriangle size={11} /> {Math.abs(diasParaPrazo)} dias em atraso</div>}
                  {(c.pagamentos || []).length > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {c.pagamentos.length} pagamento(s) · Original: {fmtMasked(c.valorOriginal || c.valor, ocultarValores)}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-lg" style={{ color: "hsl(var(--garcia-red))" }}>{fmtMasked(c.valor, ocultarValores)}</div>
                  <div className="flex gap-1.5 mt-1 justify-end flex-wrap">
                    <GBtn onClick={() => setPagandoId(pagandoId === c.id ? null : c.id)} color="hsl(var(--garcia-green))" small><CreditCard size={12} /> Pagar</GBtn>
                    <GBtn onClick={() => startEdit(c)} color="hsl(var(--garcia-blue))" small><Pencil size={12} /></GBtn>
                    <GBtn onClick={() => del(c.id)} color="hsl(var(--garcia-red))" small><Trash2 size={12} /></GBtn>
                  </div>
                </div>
              </div>
              {pagandoId === c.id && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-end border-t border-border pt-3">
                  <div className="flex-1"><GInput label="Valor do pagamento (AOA)" value={valorPagamento} onChange={setValorPagamento} type="number" placeholder={`Max: ${c.valor}`} /></div>
                  <div className="flex gap-2">
                    <GBtn onClick={() => registarPagamento(c)} color="hsl(var(--garcia-green))">Confirmar</GBtn>
                    <GBtn onClick={() => setPagandoId(null)} color="hsl(var(--muted))">Cancelar</GBtn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pagos.length > 0 && (
        <details className="mt-5">
          <summary className="text-muted-foreground cursor-pointer mb-2">Pagas ({pagos.length}) — {fmtMasked(pagos.reduce((s, c) => s + (c.valorOriginal || c.valor), 0), ocultarValores)}</summary>
          <div className="flex flex-col gap-1.5">
            {pagos.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2 opacity-60">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{c.descricao}</div>
                  <div className="text-[11px] text-muted-foreground">{c.credor} · {c.categoria}</div>
                </div>
                <div className="font-bold text-sm" style={{ color: "hsl(var(--garcia-green))" }}>{fmtMasked(c.valorOriginal || c.valor, ocultarValores)}</div>
                <GBtn onClick={() => del(c.id)} color="hsl(var(--garcia-red))" small><Trash2 size={12} /></GBtn>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
