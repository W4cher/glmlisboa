import { useState } from "react";
import { Financas, Configuracoes, uid, today, CATS_ENTRADA, CATS_SAIDA, catsOu } from "@/lib/garcia";
import { useFmt, useFmtMasked, useSimbolo } from "@/lib/moeda";
import { SectionHeader, GCard, GInput, GSelect, GBtn, StatCard, Empty } from "./SharedComponents";
import { Wallet, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

interface Props { finanas: Financas; setFinanas: (v: Financas) => void; ocultarValores?: boolean; config?: Configuracoes; }

export default function TabFinancas({ finanas, setFinanas, ocultarValores = false, config }: Props) {
  const fmt = useFmt();
  const fmtMasked = useFmtMasked();
  const simbolo = useSimbolo();
  const catsEntrada = catsOu(config?.categoriasEntrada, CATS_ENTRADA);
  const catsSaida = catsOu(config?.categoriasSaida, CATS_SAIDA);
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [form, setForm] = useState({ descricao: "", valor: "", categoria: "", data: today() });
  const [showForm, setShowForm] = useState(false);

  const add = () => {
    if (!form.descricao || !form.valor) return;
    const item = { id: uid(), descricao: form.descricao, valor: parseFloat(form.valor), categoria: form.categoria, data: form.data };
    if (tipo === "entrada") setFinanas({ ...finanas, entradas: [...finanas.entradas, item] });
    else setFinanas({ ...finanas, saidas: [...finanas.saidas, item] });
    setForm({ descricao: "", valor: "", categoria: "", data: today() });
    setShowForm(false);
  };
  const del = (id: string, t: string) => {
    if (t === "entrada") setFinanas({ ...finanas, entradas: finanas.entradas.filter(i => i.id !== id) });
    else setFinanas({ ...finanas, saidas: finanas.saidas.filter(i => i.id !== id) });
  };

  const totalE = finanas.entradas.reduce((s, i) => s + i.valor, 0);
  const totalS = finanas.saidas.reduce((s, i) => s + i.valor, 0);
  const saldo = totalE - totalS;

  return (
    <div>
      <SectionHeader icon={<Wallet size={22} />} title="Finanças Pessoais" sub="Controlo do dinheiro familiar" />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Entradas" value={fmtMasked(totalE, ocultarValores)} color="hsl(var(--garcia-green))" />
        <StatCard label="Saídas" value={fmtMasked(totalS, ocultarValores)} color="hsl(var(--garcia-red))" />
        <StatCard label="Saldo" value={fmtMasked(saldo, ocultarValores)} color={saldo >= 0 ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))"} />
      </div>

      <div className="flex gap-2 mb-4">
        {(["entrada", "saida"] as const).map(t => (
          <button key={t} onClick={() => { setTipo(t); setForm(f => ({ ...f, categoria: "" })); }}
            className="px-4 py-2 rounded-lg cursor-pointer font-semibold text-[13px] inline-flex items-center gap-1.5" style={{
              border: `1px solid ${tipo === t ? (t === "entrada" ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))") : "hsl(var(--border))"}`,
              background: tipo === t ? (t === "entrada" ? "hsl(142 71% 15%)" : "hsl(0 72% 15%)") : "hsl(var(--card))",
              color: tipo === t ? (t === "entrada" ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))") : "hsl(var(--muted-foreground))",
            }}>
            {t === "entrada" ? <ArrowUp size={14} /> : <ArrowDown size={14} />} {t === "entrada" ? "Entradas" : "Saídas"}
          </button>
        ))}
        <div className="ml-auto">
          <GBtn onClick={() => setShowForm(!showForm)} color="hsl(var(--primary))">+ Adicionar</GBtn>
        </div>
      </div>

      {showForm && (
        <GCard className="mb-4">
          <div className="grid grid-cols-2 gap-3">
            <GInput label="Descrição*" value={form.descricao} onChange={v => setForm({ ...form, descricao: v })} placeholder="Ex: Venda do dia, salário, renda recebida" />
            <GInput label={`Valor (${simbolo})*`} value={form.valor} onChange={v => setForm({ ...form, valor: v })} type="number" />
            <GSelect label="Categoria" value={form.categoria} onChange={v => setForm({ ...form, categoria: v })} options={tipo === "entrada" ? catsEntrada : catsSaida} />
            <GInput label="Data" value={form.data} onChange={v => setForm({ ...form, data: v })} type="date" />
          </div>
          <div className="mt-3 flex gap-2">
            <GBtn onClick={add} color={tipo === "entrada" ? "hsl(var(--garcia-green))" : "hsl(var(--garcia-red))"}>Guardar</GBtn>
            <GBtn onClick={() => setShowForm(false)} color="hsl(var(--muted))">Cancelar</GBtn>
          </div>
        </GCard>
      )}

      <div className="flex flex-col gap-1.5">
        {tipo === "entrada" && finanas.entradas.slice().reverse().map(i => (
          <FinRow key={i.id} i={i} color="hsl(var(--garcia-green))" sign="+" oculto={ocultarValores} onDel={() => del(i.id, "entrada")} />
        ))}
        {tipo === "saida" && finanas.saidas.slice().reverse().map(i => (
          <FinRow key={i.id} i={i} color="hsl(var(--garcia-red))" sign="-" oculto={ocultarValores} onDel={() => del(i.id, "saida")} />
        ))}
        {tipo === "entrada" && finanas.entradas.length === 0 && <Empty msg="Sem entradas registadas" />}
        {tipo === "saida" && finanas.saidas.length === 0 && <Empty msg="Sem saídas registadas" />}
      </div>
    </div>
  );
}

function FinRow({ i, color, sign, oculto, onDel }: { i: { descricao: string; valor: number; categoria: string; data: string }; color: string; sign: string; oculto: boolean; onDel: () => void }) {
  const fmtMasked = useFmtMasked();
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-3.5 py-2.5">
      <div className="flex-1">
        <div className="font-semibold text-sm">{i.descricao}</div>
        <div className="text-[11px] text-muted-foreground">{i.categoria} · {i.data}</div>
      </div>
      <div className="font-extrabold text-base" style={{ color }}>{sign}{fmtMasked(i.valor, oculto)}</div>
      <button onClick={onDel} className="bg-transparent border-none text-muted-foreground hover:text-destructive cursor-pointer">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
