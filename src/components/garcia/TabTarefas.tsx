import { useState } from "react";
import { Tarefa, uid, today, PRIORIDADES, CATEGORIAS_T } from "@/lib/garcia";
import { SectionHeader, GCard, GInput, GSelect, GBtn, Empty } from "./SharedComponents";

interface Props { tarefas: Tarefa[]; setTarefas: (v: Tarefa[]) => void; }

export default function TabTarefas({ tarefas, setTarefas }: Props) {
  const [form, setForm] = useState({ texto: "", prioridade: "🟡 Importante", categoria: "Outro", prazo: "" });
  const [showForm, setShowForm] = useState(false);

  const add = () => {
    if (!form.texto.trim()) return;
    setTarefas([...tarefas, { id: uid(), ...form, feito: false, criada: today() }]);
    setForm({ texto: "", prioridade: "🟡 Importante", categoria: "Outro", prazo: "" });
    setShowForm(false);
  };
  const toggle = (id: string) => setTarefas(tarefas.map(t => t.id === id ? { ...t, feito: !t.feito } : t));
  const del = (id: string) => setTarefas(tarefas.filter(t => t.id !== id));

  const pendentes = tarefas.filter(t => !t.feito).sort((a, b) => PRIORIDADES.indexOf(a.prioridade) - PRIORIDADES.indexOf(b.prioridade));
  const feitas = tarefas.filter(t => t.feito);

  const priColor: Record<string, string> = {
    "🔴 Urgente": "hsl(var(--garcia-red))",
    "🟡 Importante": "hsl(var(--garcia-gold))",
    "🟢 Normal": "hsl(var(--garcia-green))",
  };

  return (
    <div>
      <SectionHeader icon="✅" title="Tarefas & Lembretes" sub="Tudo o que tens para fazer" />
      <GBtn onClick={() => setShowForm(!showForm)} color="hsl(var(--primary))">+ Nova Tarefa</GBtn>

      {showForm && (
        <GCard className="mt-4 mb-4">
          <GInput label="O que tens para fazer?" value={form.texto} onChange={v => setForm({ ...form, texto: v })} placeholder="Ex: Ligar ao cliente X para cobrar..." />
          <div className="grid grid-cols-3 gap-3 mt-2.5">
            <GSelect label="Prioridade" value={form.prioridade} onChange={v => setForm({ ...form, prioridade: v })} options={PRIORIDADES} />
            <GSelect label="Categoria" value={form.categoria} onChange={v => setForm({ ...form, categoria: v })} options={CATEGORIAS_T} />
            <GInput label="Prazo" value={form.prazo} onChange={v => setForm({ ...form, prazo: v })} type="date" />
          </div>
          <div className="mt-3 flex gap-2">
            <GBtn onClick={add} color="hsl(var(--primary))">Adicionar</GBtn>
            <GBtn onClick={() => setShowForm(false)} color="hsl(var(--muted))">Cancelar</GBtn>
          </div>
        </GCard>
      )}

      <div className="flex flex-col gap-2 mt-4">
        {pendentes.map(t => (
          <TarefaRow key={t.id} t={t} priColor={priColor[t.prioridade]} onToggle={() => toggle(t.id)} onDel={() => del(t.id)} />
        ))}
        {pendentes.length === 0 && <Empty msg="Sem tarefas pendentes 🎉" />}
      </div>

      {feitas.length > 0 && (
        <details className="mt-5">
          <summary className="text-muted-foreground cursor-pointer mb-2">Concluídas ({feitas.length})</summary>
          <div className="flex flex-col gap-1.5">
            {feitas.map(t => (
              <TarefaRow key={t.id} t={t} priColor={priColor[t.prioridade]} onToggle={() => toggle(t.id)} onDel={() => del(t.id)} done />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function TarefaRow({ t, priColor, onToggle, onDel, done = false }: {
  t: Tarefa; priColor: string; onToggle: () => void; onDel: () => void; done?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-3.5 py-2.5" style={{ opacity: done ? 0.5 : 1 }}>
      <div className="w-[3px] h-8 rounded-sm shrink-0" style={{ background: priColor }} />
      <div onClick={onToggle} className="w-5 h-5 rounded shrink-0 cursor-pointer flex items-center justify-center" style={{
        border: `2px solid ${done ? "hsl(var(--garcia-green))" : "hsl(var(--border))"}`,
        background: done ? "hsl(var(--garcia-green))" : "transparent",
      }}>
        {done && <span style={{ color: "#000", fontSize: 11 }}>✓</span>}
      </div>
      <div className="flex-1">
        <div className={`font-semibold text-sm ${done ? "line-through" : ""}`}>{t.texto}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{t.categoria} · {t.prioridade}{t.prazo ? ` · Prazo: ${t.prazo}` : ""}</div>
      </div>
      <button onClick={onDel} className="bg-transparent border-none text-muted-foreground cursor-pointer text-base p-1">×</button>
    </div>
  );
}
