import { useState } from "react";
import { StockItem, uid } from "@/lib/garcia";
import { useFmt, useFmtMasked, useSimbolo } from "@/lib/moeda";
import { GCard, GInput, GBtn, StatCard } from "./SharedComponents";
import { Package, Plus, Pencil, Trash2, ShoppingCart, Check, X } from "lucide-react";

interface Props {
  stock: StockItem[];
  stockTotal: number;
  stockCustoTotal: number;
  stockVendaEstimada: number;
  stockLucroEstimado: number;
  ocultarValores?: boolean;
  onAdd: (item: StockItem) => void;
  onUpdate: (id: string, updates: Partial<StockItem>) => void;
  onDelete: (id: string) => void;
  onSell: (item: StockItem, qty: number) => void;
}

export default function StockSection({ stock, stockTotal, stockCustoTotal, stockVendaEstimada, stockLucroEstimado, ocultarValores = false, onAdd, onUpdate, onDelete, onSell }: Props) {
  const fmt = useFmt();
  const fmtMasked = useFmtMasked();
  const simbolo = useSimbolo();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nome: "", quantidade: "", custoUnitario: "", precoVenda: "" });
  const [sellId, setSellId] = useState<string | null>(null);
  const [sellQty, setSellQty] = useState("1");
  const [addQtyId, setAddQtyId] = useState<string | null>(null);
  const [addQtyVal, setAddQtyVal] = useState("1");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StockItem>>({});

  const addItem = () => {
    if (!form.nome || !form.quantidade || !form.precoVenda) return;
    const existing = stock.find(s => s.nome.toLowerCase().trim() === form.nome.toLowerCase().trim());
    if (existing) {
      onUpdate(existing.id, { quantidade: existing.quantidade + (parseInt(form.quantidade) || 0) });
    } else {
      onAdd({
        id: uid(),
        nome: form.nome,
        quantidade: parseInt(form.quantidade) || 0,
        custoUnitario: parseFloat(form.custoUnitario) || 0,
        precoVenda: parseFloat(form.precoVenda) || 0,
      });
    }
    setForm({ nome: "", quantidade: "", custoUnitario: "", precoVenda: "" });
    setShowAdd(false);
  };

  const handleSell = (item: StockItem) => {
    const qty = parseInt(sellQty) || 1;
    onSell(item, qty);
    setSellId(null);
    setSellQty("1");
  };

  const handleAddQty = (item: StockItem) => {
    const qty = parseInt(addQtyVal) || 1;
    if (qty <= 0) return;
    onUpdate(item.id, { quantidade: item.quantidade + qty });
    setAddQtyId(null);
    setAddQtyVal("1");
  };

  const startEdit = (item: StockItem) => {
    setEditId(item.id);
    setEditForm({ nome: item.nome, quantidade: item.quantidade, custoUnitario: item.custoUnitario, precoVenda: item.precoVenda });
    setSellId(null); setAddQtyId(null);
  };

  const saveEdit = () => {
    if (!editId) return;
    onUpdate(editId, {
      nome: editForm.nome,
      quantidade: editForm.quantidade,
      custoUnitario: editForm.custoUnitario,
      precoVenda: editForm.precoVenda,
    });
    setEditId(null);
    setEditForm({});
  };

  return (
    <div className="mt-5">
      <div className="text-muted-foreground text-[13px] mb-2.5 font-semibold inline-flex items-center gap-1.5">
        <Package size={14} /> STOCK DE PRODUTOS
      </div>

      {stock.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          <StatCard label="Produtos" value={stockTotal} color="hsl(var(--garcia-blue))" small />
          <StatCard label="Investido" value={fmtMasked(stockCustoTotal, ocultarValores)} color="hsl(var(--garcia-gold))" small />
          <StatCard label="Est. Venda" value={fmtMasked(stockVendaEstimada, ocultarValores)} color="hsl(var(--garcia-green))" small />
          <StatCard label="Est. Lucro" value={fmtMasked(stockLucroEstimado, ocultarValores)} color={stockLucroEstimado >= 0 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))"} small />
        </div>
      )}

      <GBtn onClick={() => setShowAdd(!showAdd)} color="hsl(var(--garcia-blue))"><Plus size={14} /> Adicionar Produto</GBtn>

      {showAdd && (
        <GCard className="mt-3 mb-3">
          <div className="grid grid-cols-2 gap-3">
            <GInput label="Nome do produto*" value={form.nome} onChange={v => setForm({ ...form, nome: v })} placeholder="Ex: iPhone 13" />
            <GInput label="Quantidade*" value={form.quantidade} onChange={v => setForm({ ...form, quantidade: v })} type="number" placeholder="0" />
            <GInput label={`Custo unitário (${simbolo})`} value={form.custoUnitario} onChange={v => setForm({ ...form, custoUnitario: v })} type="number" placeholder="0" />
            <GInput label={`Preço de venda (${simbolo})*`} value={form.precoVenda} onChange={v => setForm({ ...form, precoVenda: v })} type="number" placeholder="0" />
          </div>
          {stock.find(s => s.nome.toLowerCase().trim() === form.nome.toLowerCase().trim()) && (
            <div className="mt-2 text-[12px] text-amber-400 font-medium">
              Produto já existe — a quantidade será adicionada ao existente
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <GBtn onClick={addItem} color="hsl(var(--garcia-blue))">Adicionar</GBtn>
            <GBtn onClick={() => setShowAdd(false)} color="hsl(var(--muted))">Cancelar</GBtn>
          </div>
        </GCard>
      )}

      {stock.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {stock.map(item => {
            const lucroUnit = item.precoVenda - item.custoUnitario;
            const lucroTotal = lucroUnit * item.quantidade;
            const isEdit = editId === item.id;
            if (isEdit) {
              return (
                <GCard key={item.id}>
                  <div className="grid grid-cols-2 gap-3">
                    <GInput label="Nome" value={editForm.nome || ""} onChange={v => setEditForm({ ...editForm, nome: v })} />
                    <GInput label="Quantidade" value={String(editForm.quantidade ?? "")} onChange={v => setEditForm({ ...editForm, quantidade: parseInt(v) || 0 })} type="number" />
                    <GInput label={`Custo unitário (${simbolo})`} value={String(editForm.custoUnitario ?? "")} onChange={v => setEditForm({ ...editForm, custoUnitario: parseFloat(v) || 0 })} type="number" />
                    <GInput label={`Preço de venda (${simbolo})`} value={String(editForm.precoVenda ?? "")} onChange={v => setEditForm({ ...editForm, precoVenda: parseFloat(v) || 0 })} type="number" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <GBtn onClick={saveEdit} color="hsl(var(--garcia-green))"><Check size={14} /> Guardar</GBtn>
                    <GBtn onClick={() => { setEditId(null); setEditForm({}); }} color="hsl(var(--muted))"><X size={14} /> Cancelar</GBtn>
                  </div>
                </GCard>
              );
            }
            return (
              <div key={item.id} className="bg-card border border-border rounded-lg px-3.5 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px]">{item.nome}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Qty: {item.quantidade} · Custo: {fmtMasked(item.custoUnitario, ocultarValores)} · Venda: {fmtMasked(item.precoVenda, ocultarValores)}
                    </div>
                    <div className="text-[11px]" style={{ color: lucroTotal >= 0 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))" }}>
                      Lucro estimado: {fmtMasked(lucroTotal, ocultarValores)}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <GBtn onClick={() => { setAddQtyId(addQtyId === item.id ? null : item.id); setSellId(null); }} color="hsl(var(--garcia-blue))" small><Plus size={12} /></GBtn>
                    <GBtn onClick={() => { setSellId(sellId === item.id ? null : item.id); setAddQtyId(null); }} color="hsl(var(--garcia-green))" small><ShoppingCart size={12} /></GBtn>
                    <GBtn onClick={() => startEdit(item)} color="hsl(var(--garcia-gold))" small><Pencil size={12} /></GBtn>
                    <GBtn onClick={() => onDelete(item.id)} color="hsl(var(--garcia-red))" small><Trash2 size={12} /></GBtn>
                  </div>
                </div>
                {addQtyId === item.id && (
                  <div className="mt-2 flex gap-2 items-end border-t border-border pt-2">
                    <GInput label="Adicionar quantidade" value={addQtyVal} onChange={setAddQtyVal} type="number" placeholder="1" />
                    <GBtn onClick={() => handleAddQty(item)} color="hsl(var(--garcia-blue))">Confirmar</GBtn>
                    <GBtn onClick={() => setAddQtyId(null)} color="hsl(var(--muted))">Cancelar</GBtn>
                  </div>
                )}
                {sellId === item.id && (
                  <div className="mt-2 flex gap-2 items-end border-t border-border pt-2">
                    <GInput label={`Quantidade (max: ${item.quantidade})`} value={sellQty} onChange={setSellQty} type="number" placeholder="1" />
                    <GBtn onClick={() => handleSell(item)} color="hsl(var(--garcia-green))">Confirmar Venda</GBtn>
                    <GBtn onClick={() => setSellId(null)} color="hsl(var(--muted))">Cancelar</GBtn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {stock.length === 0 && !showAdd && (
        <div className="text-muted-foreground text-sm text-center py-4 mt-2">Sem produtos em stock</div>
      )}
    </div>
  );
}
