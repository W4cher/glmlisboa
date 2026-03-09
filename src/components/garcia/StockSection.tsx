import { useState } from "react";
import { StockItem, uid, fmt } from "@/lib/garcia";
import { GCard, GInput, GBtn, StatCard } from "./SharedComponents";

interface Props {
  stock: StockItem[];
  stockTotal: number;
  stockCustoTotal: number;
  stockVendaEstimada: number;
  stockLucroEstimado: number;
  onAdd: (item: StockItem) => void;
  onUpdate: (id: string, updates: Partial<StockItem>) => void;
  onDelete: (id: string) => void;
  onSell: (item: StockItem, qty: number) => void;
}

export default function StockSection({ stock, stockTotal, stockCustoTotal, stockVendaEstimada, stockLucroEstimado, onAdd, onUpdate, onDelete, onSell }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nome: "", quantidade: "", custoUnitario: "", precoVenda: "" });
  const [sellId, setSellId] = useState<string | null>(null);
  const [sellQty, setSellQty] = useState("1");

  const addItem = () => {
    if (!form.nome || !form.quantidade || !form.precoVenda) return;
    onAdd({
      id: uid(),
      nome: form.nome,
      quantidade: parseInt(form.quantidade) || 0,
      custoUnitario: parseFloat(form.custoUnitario) || 0,
      precoVenda: parseFloat(form.precoVenda) || 0,
    });
    setForm({ nome: "", quantidade: "", custoUnitario: "", precoVenda: "" });
    setShowAdd(false);
  };

  const handleSell = (item: StockItem) => {
    const qty = parseInt(sellQty) || 1;
    onSell(item, qty);
    setSellId(null);
    setSellQty("1");
  };

  return (
    <div className="mt-5">
      <div className="text-muted-foreground text-[13px] mb-2.5 font-semibold">📦 STOCK DE PRODUTOS</div>

      {stock.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          <StatCard label="Produtos" value={stockTotal} color="hsl(var(--garcia-blue))" small />
          <StatCard label="Investido" value={fmt(stockCustoTotal)} color="hsl(var(--garcia-gold))" small />
          <StatCard label="Est. Venda" value={fmt(stockVendaEstimada)} color="hsl(var(--garcia-green))" small />
          <StatCard label="Est. Lucro" value={fmt(stockLucroEstimado)} color={stockLucroEstimado >= 0 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))"} small />
        </div>
      )}

      <GBtn onClick={() => setShowAdd(!showAdd)} color="hsl(var(--garcia-blue))">+ Adicionar Produto</GBtn>

      {showAdd && (
        <GCard className="mt-3 mb-3">
          <div className="grid grid-cols-2 gap-3">
            <GInput label="Nome do produto*" value={form.nome} onChange={v => setForm({ ...form, nome: v })} placeholder="Ex: iPhone 13" />
            <GInput label="Quantidade*" value={form.quantidade} onChange={v => setForm({ ...form, quantidade: v })} type="number" placeholder="0" />
            <GInput label="Custo unitário (AOA)" value={form.custoUnitario} onChange={v => setForm({ ...form, custoUnitario: v })} type="number" placeholder="0" />
            <GInput label="Preço de venda (AOA)*" value={form.precoVenda} onChange={v => setForm({ ...form, precoVenda: v })} type="number" placeholder="0" />
          </div>
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
            return (
              <div key={item.id} className="bg-card border border-border rounded-lg px-3.5 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px]">{item.nome}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Qty: {item.quantidade} · Custo: {fmt(item.custoUnitario)} · Venda: {fmt(item.precoVenda)}
                    </div>
                    <div className="text-[11px]" style={{ color: lucroTotal >= 0 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))" }}>
                      Lucro estimado: {fmt(lucroTotal)}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <GBtn onClick={() => setSellId(sellId === item.id ? null : item.id)} color="hsl(var(--garcia-green))" small>Vender</GBtn>
                    <GBtn onClick={() => onDelete(item.id)} color="hsl(var(--garcia-red))" small>×</GBtn>
                  </div>
                </div>
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
