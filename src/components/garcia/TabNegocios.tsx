import { useState } from "react";
import { Negocio, NegocioCfg, LogEntry, StockItem, enforceLogLimits, fmt, fmtMasked, uid, today } from "@/lib/garcia";
import { SectionHeader, GCard, GInput, NumInput, GBtn, StatCard } from "./SharedComponents";
import NegocioForm from "./NegocioForm";
import StockSection from "./StockSection";
import { Icon } from "@/lib/icons";
import { BarChart3, TrendingUp, TrendingDown, Trash2, Plus } from "lucide-react";

interface Props {
  negocios: Record<string, Negocio>;
  setNegocios: (v: Record<string, Negocio> | ((prev: Record<string, Negocio>) => Record<string, Negocio>)) => void;
  negociosCfg: NegocioCfg[];
  setNegociosCfg: (v: NegocioCfg[] | ((prev: NegocioCfg[]) => NegocioCfg[])) => void;
  ocultarValores?: boolean;
}

export default function TabNegocios({ negocios, setNegocios, negociosCfg, setNegociosCfg, ocultarValores = false }: Props) {
  const [sel, setSel] = useState(negociosCfg[0]?.id || "");
  const [showForm, setShowForm] = useState(false);
  const [showAddNeg, setShowAddNeg] = useState(false);
  const [tipo, setTipo] = useState<"venda" | "gasto">("venda");
  const [form, setForm] = useState({ descricao: "", valor: "", custo: "", qty: "1", cliente: "", data: today() });

  const n = negocios[sel] || { receita: 0, gastos: 0, meta: 0, notas: "", log: [], stock: [] } as Negocio;

  const registar = () => {
    if (!form.descricao || !form.valor) return;
    const qty = parseInt(form.qty) || 1;
    const valorTotal = parseFloat(form.valor) * qty;
    const custoTotal = parseFloat(form.custo || "0") * qty;

    const entrada: LogEntry = {
      id: uid(), tipo, negocio: sel,
      descricao: form.descricao, valor: valorTotal,
      custo: tipo === "venda" ? custoTotal : 0,
      lucroVenda: tipo === "venda" ? valorTotal - custoTotal : 0,
      cliente: form.cliente, qty, data: form.data,
      registadoEm: new Date().toISOString(),
    };

    const novaReceita = tipo === "venda" ? n.receita + valorTotal : n.receita;
    const novosGastos = tipo === "venda" ? n.gastos + custoTotal : n.gastos + valorTotal;

    setNegocios(prev => {
      const currentLog = [...(prev[sel]?.log || []), entrada];
      return {
        ...prev,
        [sel]: { ...prev[sel], receita: novaReceita, gastos: novosGastos, log: enforceLogLimits(currentLog) }
      };
    });

    setForm({ descricao: "", valor: "", custo: "", qty: "1", cliente: "", data: today() });
    setShowForm(false);
  };

  const delEntrada = (id: string) => {
    setNegocios(prev => ({
      ...prev,
      [sel]: { ...prev[sel], log: (prev[sel]?.log || []).filter(e => e.id !== id) }
    }));
  };

  const upd = (field: string, val: number | string) => setNegocios(prev => ({ ...prev, [sel]: { ...prev[sel], [field]: val } }));

  const addNegocio = (cfg: NegocioCfg) => {
    setNegociosCfg(prev => [...prev, cfg]);
    setNegocios(prev => ({ ...prev, [cfg.id]: { receita: 0, gastos: 0, meta: 0, notas: "", log: [], stock: [] } }));
    setSel(cfg.id);
    setShowAddNeg(false);
  };

  const delNegocio = (id: string) => {
    if (!confirm("Apagar este negócio? Os totais serão perdidos.")) return;
    setNegociosCfg(prev => prev.filter(n => n.id !== id));
    setNegocios(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (sel === id) setSel(negociosCfg.find(x => x.id !== id)?.id || "");
  };

  const addStock = (item: StockItem) => {
    setNegocios(prev => ({ ...prev, [sel]: { ...prev[sel], stock: [...(prev[sel]?.stock || []), item] } }));
  };
  const updateStock = (itemId: string, updates: Partial<StockItem>) => {
    setNegocios(prev => ({ ...prev, [sel]: { ...prev[sel], stock: (prev[sel]?.stock || []).map(s => s.id === itemId ? { ...s, ...updates } : s) } }));
  };
  const delStock = (itemId: string) => {
    setNegocios(prev => ({ ...prev, [sel]: { ...prev[sel], stock: (prev[sel]?.stock || []).filter(s => s.id !== itemId) } }));
  };
  const venderStock = (item: StockItem, qty: number) => {
    if (qty <= 0 || qty > item.quantidade) return;
    const valorVenda = item.precoVenda * qty;
    const custoVenda = item.custoUnitario * qty;
    const entrada: LogEntry = {
      id: uid(), tipo: "venda", negocio: sel,
      descricao: `${item.nome} (stock)`, valor: valorVenda,
      custo: custoVenda, lucroVenda: valorVenda - custoVenda,
      cliente: "", qty, data: today(),
      registadoEm: new Date().toISOString(),
    };
    setNegocios(prev => {
      const current = prev[sel];
      const newStock = (current?.stock || []).map(s =>
        s.id === item.id ? { ...s, quantidade: s.quantidade - qty } : s
      ).filter(s => s.quantidade > 0);
      const currentLog = [...(current?.log || []), entrada];
      return {
        ...prev,
        [sel]: {
          ...current,
          receita: (current?.receita || 0) + valorVenda,
          gastos: (current?.gastos || 0) + custoVenda,
          stock: newStock,
          log: enforceLogLimits(currentLog),
        }
      };
    });
  };

  const lucro = n.receita - n.gastos;
  const margem = n.receita > 0 ? Math.round((lucro / n.receita) * 100) : 0;
  const log = enforceLogLimits(n.log || []);
  const stock = n.stock || [];

  const stockTotal = stock.reduce((s, p) => s + p.quantidade, 0);
  const stockCustoTotal = stock.reduce((s, p) => s + p.custoUnitario * p.quantidade, 0);
  const stockVendaEstimada = stock.reduce((s, p) => s + p.precoVenda * p.quantidade, 0);
  const stockLucroEstimado = stockVendaEstimada - stockCustoTotal;

  const selCfg = negociosCfg.find(x => x.id === sel);

  return (
    <div>
      <SectionHeader icon={<BarChart3 size={22} />} title="Negócios" sub="Controlo de todos os teus projetos" />

      <div className="flex gap-2 mb-5 flex-wrap items-center">
        {negociosCfg.map(nb => (
          <button key={nb.id} onClick={() => setSel(nb.id)} className="px-3.5 py-2 rounded-lg cursor-pointer text-[13px] transition-all inline-flex items-center gap-2" style={{
            border: `1px solid ${sel === nb.id ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
            background: sel === nb.id ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--card))",
            color: sel === nb.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            fontWeight: sel === nb.id ? 700 : 400,
          }}>
            <Icon name={nb.icon} size={15} /> {nb.nome}
          </button>
        ))}
        <button onClick={() => setShowAddNeg(!showAddNeg)}
          className="px-3 py-2 rounded-lg cursor-pointer text-[13px] border border-dashed border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary transition-all bg-transparent inline-flex items-center gap-1.5">
          <Plus size={14} /> Novo
        </button>
      </div>

      {showAddNeg && <NegocioForm onAdd={addNegocio} onCancel={() => setShowAddNeg(false)} />}

      {selCfg && (
        <>
          <GCard className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-[17px] inline-flex items-center gap-2">
                <Icon name={selCfg.icon} size={18} /> {selCfg.nome}
              </div>
              <button onClick={() => delNegocio(sel)}
                className="text-xs text-muted-foreground hover:text-destructive bg-transparent border border-border rounded-lg px-2.5 py-1 cursor-pointer transition-colors inline-flex items-center gap-1">
                <Trash2 size={12} /> Apagar
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <StatCard label="Receita" value={fmtMasked(n.receita || 0, ocultarValores)} color="hsl(var(--garcia-green))" small />
              <StatCard label="Lucro" value={fmtMasked(lucro, ocultarValores)} color={lucro >= 0 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))"} small />
              <StatCard label="Margem" value={`${margem}%`} color={margem >= 30 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-gold))"} small />
            </div>

            {sel !== "rendas" && (
              <div className="mb-4">
                <NumInput label="Meta do mês (AOA)" value={n.meta || 0} onChange={v => upd("meta", v)} />
                {(n.meta || 0) > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between mb-1.5 text-[13px]">
                      <span className="text-muted-foreground">Meta do mês</span>
                      <span className="text-primary">{Math.min(100, Math.round(((n.receita || 0) / n.meta) * 100))}%</span>
                    </div>
                    <div className="h-1.5 bg-garcia-surface-hi rounded-sm">
                      <div className="h-full bg-primary rounded-sm" style={{ width: `${Math.min(100, ((n.receita || 0) / n.meta) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {sel === "rendas" && (
              <div className="mb-4">
                <GInput label="Próximo recebimento" value={n.proxima || ""} onChange={v => upd("proxima", v)} type="date" />
              </div>
            )}

            <div className="flex gap-2 mb-4 flex-wrap">
              <GBtn onClick={() => { setTipo("venda"); setShowForm(!showForm); }} color="hsl(var(--garcia-green))"><TrendingUp size={14} /> Venda</GBtn>
              <GBtn onClick={() => { setTipo("gasto"); setShowForm(!showForm); }} color="hsl(var(--garcia-red))"><TrendingDown size={14} /> Gasto</GBtn>
            </div>

            {showForm && (
              <GCard className="mb-4">
                <div className="font-semibold text-sm mb-3 inline-flex items-center gap-2">
                  {tipo === "venda" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {tipo === "venda" ? "Registar Venda" : "Registar Gasto"}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <GInput label="Descrição*" value={form.descricao} onChange={v => setForm({ ...form, descricao: v })} placeholder="Ex: iPhone 13" />
                  <GInput label="Valor unitário (AOA)*" value={form.valor} onChange={v => setForm({ ...form, valor: v })} type="number" placeholder="0" />
                  {tipo === "venda" && <GInput label="Custo unitário (AOA)" value={form.custo} onChange={v => setForm({ ...form, custo: v })} type="number" placeholder="0" />}
                  <GInput label="Quantidade" value={form.qty} onChange={v => setForm({ ...form, qty: v })} type="number" placeholder="1" />
                  {tipo === "venda" && <GInput label="Cliente" value={form.cliente} onChange={v => setForm({ ...form, cliente: v })} placeholder="Nome do cliente" />}
                  <GInput label="Data" value={form.data} onChange={v => setForm({ ...form, data: v })} type="date" />
                </div>
                <div className="mt-3 flex gap-2">
                  <GBtn onClick={registar} color={tipo === "venda" ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))"}>Guardar</GBtn>
                  <GBtn onClick={() => setShowForm(false)} color="hsl(var(--muted))">Cancelar</GBtn>
                </div>
              </GCard>
            )}

            <label className="block text-xs text-muted-foreground mb-1">Notas / Estratégia</label>
            <textarea value={n.notas || ""} onChange={e => upd("notas", e.target.value)}
              placeholder="Escreve aqui estratégias, ideias, observações..."
              className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2.5 text-[13px] min-h-[80px] resize-y" />
          </GCard>

          <StockSection
            stock={stock}
            stockTotal={stockTotal}
            stockCustoTotal={stockCustoTotal}
            stockVendaEstimada={stockVendaEstimada}
            stockLucroEstimado={stockLucroEstimado}
            ocultarValores={ocultarValores}
            onAdd={addStock}
            onUpdate={updateStock}
            onDelete={delStock}
            onSell={venderStock}
          />

          {log.length > 0 && (
            <div className="mt-5">
              <div className="text-muted-foreground text-[13px] mb-2.5 font-semibold">
                REGISTO DE TRANSAÇÕES ({log.length}/7)
                <span className="font-normal ml-2">— auto-limpeza aos 7 dias</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {log.slice().sort((a, b) => new Date(b.registadoEm).getTime() - new Date(a.registadoEm).getTime()).map(e => (
                  <div key={e.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3.5 py-2.5">
                    <div>{e.tipo === "venda" ? <TrendingUp size={16} className="text-[hsl(var(--garcia-green))]" /> : <TrendingDown size={16} className="text-[hsl(var(--garcia-red))]" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] truncate">{e.descricao}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {e.cliente ? `${e.cliente} · ` : ""}{e.data} · qty: {e.qty}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-sm" style={{ color: e.tipo === "venda" ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))" }}>
                        {e.tipo === "venda" ? "+" : "-"}{fmtMasked(e.valor, ocultarValores)}
                      </div>
                      {e.tipo === "venda" && e.lucroVenda > 0 && (
                        <div className="text-[10px] text-muted-foreground">lucro: {fmtMasked(e.lucroVenda, ocultarValores)}</div>
                      )}
                    </div>
                    <button onClick={() => delEntrada(e.id)} className="text-muted-foreground hover:text-destructive cursor-pointer bg-transparent border-none">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="text-muted-foreground text-[13px] mb-2.5 font-semibold">RESUMO GERAL</div>
            <div className="grid grid-cols-2 gap-2.5">
              {negociosCfg.map(nb => {
                const data = negocios[nb.id] || {} as Negocio;
                const l = (data.receita || 0) - (data.gastos || 0);
                return (
                  <div key={nb.id} onClick={() => setSel(nb.id)} className="bg-card border border-border rounded-lg px-3.5 py-3 cursor-pointer">
                    <div className="text-[13px] mb-1 inline-flex items-center gap-2"><Icon name={nb.icon} size={14} /> {nb.nome}</div>
                    <div className="font-extrabold text-lg" style={{ color: l >= 0 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))" }}>{fmtMasked(l, ocultarValores)}</div>
                    <div className="text-[11px] text-muted-foreground">lucro</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
