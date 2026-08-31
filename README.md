# My Daily Compass

import { useState, useEffect, useCallback } from "react";

// ── palette ──────────────────────────────────────────────────────────────

const C = {

  bg: "#0a0c10",

  surface: "#12151c",

  surfaceHi: "#1a1f2a",

  border: "#252b38",

  accent: "#f97316",

  accentDim: "#c2410c",

  accentSoft: "#431407",

  gold: "#fbbf24",

  green: "#22c55e",

  red: "#ef4444",

  blue: "#3b82f6",

  purple: "#a855f7",

  text: "#f0f2f7",

  muted: "#6b7280",

  dimmed: "#374151",

};

// ── tiny helpers ──────────────────────────────────────────────────────────

const fmt = (n) =>

  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "AOA" }).format(n);

const today = () => new Date().toISOString().split("T")[0];

const uid = () => Math.random().toString(36).slice(2, 8);

// ── storage helpers ───────────────────────────────────────────────────────

const load = async (key) => {

  try {

    const r = await window.storage.get(key);

    return r ? JSON.parse(r.value) : null;

  } catch { return null; }

};

const save = async (key, val) => {

  try { await window.storage.set(key, JSON.stringify(val)); } catch {}

};

// ══════════════════════════════════════════════════════════════════════════

// MAIN APP

// ══════════════════════════════════════════════════════════════════════════

export default function App() {

  const [tab, setTab] = useState("rotina");

  const [loaded, setLoaded] = useState(false);

  // ── state ──

  const [devedores, setDevedores] = useState([]);

  const [negocios, setNegocios] = useState({

    smartphone: { receita: 0, gastos: 0, meta: 0, notas: "" },

    sobrilho: { receita: 0, gastos: 0, meta: 0, notas: "" },

    roupas: { receita: 0, gastos: 0, meta: 0, notas: "" },

    rendas: { receita: 0, proxima: "", notas: "" },

  });

  const [tese, setTese] = useState({

    titulo: "Blockchain-Secured FL for Trustworthy Edge Intelligence",

    capitulos: [

      { id: "c1", nome: "Introdução", progresso: 80 },

      { id: "c2", nome: "Estado da Arte", progresso: 60 },

      { id: "c3", nome: "Arquitetura Proposta", progresso: 40 },

      { id: "c4", nome: "Implementação", progresso: 20 },

      { id: "c5", nome: "Avaliação & Resultados", progresso: 0 },

      { id: "c6", nome: "Conclusão", progresso: 0 },

    ],

    tarefas: [],

  });

  const [tarefas, setTarefas] = useState([]);

  const [rotinaDia, setRotinaDia] = useState({});

  const [finanas, setFinanas] = useState({ entradas: [], saidas: [] });

  // ── load ──

  useEffect(() => {

    (async () => {

      const d = await load("garcia:devedores");

      if (d) setDevedores(d);

      const n = await load("garcia:negocios");

      if (n) setNegocios(n);

      const t = await load("garcia:tese");

      if (t) setTese(t);

      const tk = await load("garcia:tarefas");

      if (tk) setTarefas(tk);

      const rd = await load("garcia:rotina");

      if (rd) setRotinaDia(rd);

      const fi = await load("garcia:finanas");

      if (fi) setFinanas(fi);

      setLoaded(true);

    })();

  }, []);

  useEffect(() => { if (loaded) save("garcia:devedores", devedores); }, [devedores, loaded]);

  useEffect(() => { if (loaded) save("garcia:negocios", negocios); }, [negocios, loaded]);

  useEffect(() => { if (loaded) save("garcia:tese", tese); }, [tese, loaded]);

  useEffect(() => { if (loaded) save("garcia:tarefas", tarefas); }, [tarefas, loaded]);

  useEffect(() => { if (loaded) save("garcia:rotina", rotinaDia); }, [rotinaDia, loaded]);

  useEffect(() => { if (loaded) save("garcia:finanas", finanas); }, [finanas, loaded]);

  const tabs = [

    { id: "rotina", icon: "⏰", label: "Rotina" },

    { id: "tarefas", icon: "✅", label: "Tarefas" },

    { id: "devedores", icon: "💰", label: "Cobranças" },

    { id: "negocios", icon: "📊", label: "Negócios" },

    { id: "tese", icon: "🎓", label: "Tese" },

    { id: "finanas", icon: "💳", label: "Finanças" },

  ];

  if (!loaded) return (

    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>

      <div style={{ color: C.accent, fontSize: 24, fontFamily: "monospace" }}>A carregar o teu sistema...</div>

    </div>

  );

  return (

    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: C.text }}>

      {/* header */}

      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>

        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>G</div>

        <div>

          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.5px" }}>Sistema Garcia</div>

          <div style={{ color: C.muted, fontSize: 11 }}>

            {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}

          </div>

        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>

          <MiniStat label="Cobranças" value={devedores.filter(d => !d.pago).length} color={C.red} />

          <MiniStat label="Tarefas" value={tarefas.filter(t => !t.feito).length} color={C.gold} />

        </div>

      </div>

      {/* nav */}

      <div style={{ display: "flex", overflowX: "auto", background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 12px" }}>

        {tabs.map(t => (

          <button key={t.id} onClick={() => setTab(t.id)} style={{

            padding: "12px 16px", border: "none", background: "none", cursor: "pointer",

            color: tab === t.id ? C.accent : C.muted, fontSize: 13, fontWeight: tab === t.id ? 700 : 400,

            borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",

            whiteSpace: "nowrap", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,

          }}>

            {t.icon} {t.label}

          </button>

        ))}

      </div>

      {/* content */}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>

        {tab === "rotina" && <TabRotina rotinaDia={rotinaDia} setRotinaDia={setRotinaDia} />}

        {tab === "tarefas" && <TabTarefas tarefas={tarefas} setTarefas={setTarefas} />}

        {tab === "devedores" && <TabDevedores devedores={devedores} setDevedores={setDevedores} />}

        {tab === "negocios" && <TabNegocios negocios={negocios} setNegocios={setNegocios} />}

        {tab === "tese" && <TabTese tese={tese} setTese={setTese} />}

        {tab === "finanas" && <TabFinanas finanas={finanas} setFinanas={setFinanas} />}

      </div>

    </div>

  );

}

function MiniStat({ label, value, color }) {

  return (

    <div style={{ textAlign: "center", background: C.surfaceHi, borderRadius: 8, padding: "4px 10px", border: `1px solid ${C.border}` }}>

      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>

      <div style={{ fontSize: 9, color: C.muted }}>{label}</div>

    </div>

  );

}

// ══════════════════════════════════════════════════════════════════════════

// TAB ROTINA

// ══════════════════════════════════════════════════════════════════════════

const BLOCOS_ROTINA = [

  { id: "b1", hora: "07:00", label: "Acordar + café + plano do dia", icon: "🌅", bloco: "Manhã" },

  { id: "b2", hora: "07:30", label: "Preparar filhos → escola às 8:20", icon: "👨‍👧‍👦", bloco: "Manhã" },

  { id: "b3", hora: "08:30", label: "Bosch API — trabalho principal", icon: "💻", bloco: "Trabalho" },

  { id: "b4", hora: "12:30", label: "Bloco negócios rápido (30min)", icon: "📱", bloco: "Trabalho" },

  { id: "b5", hora: "13:00", label: "Almoço + descanso", icon: "🍽️", bloco: "Pausa" },

  { id: "b6", hora: "14:00", label: "TESE — foco total (sem telemóvel)", icon: "🎓", bloco: "Tese" },

  { id: "b7", hora: "17:00", label: "Ginásio", icon: "💪", bloco: "Pessoal" },

  { id: "b8", hora: "18:00", label: "Buscar filhos + família", icon: "❤️", bloco: "Família" },

  { id: "b9", hora: "21:45", label: "Finanças + cobranças", icon: "💰", bloco: "Noite" },

  { id: "b10", hora: "22:15", label: "Marketing criativo (criativos, redes sociais)", icon: "🎨", bloco: "Noite" },

  { id: "b11", hora: "23:00", label: "Revisão do dia + plano amanhã", icon: "📋", bloco: "Noite" },

  { id: "b12", hora: "23:30", label: "Desligar — esperar mulher sem stress", icon: "🌙", bloco: "Noite" },

];

const BLOCO_COLORS = {

  "Manhã": C.gold,

  "Trabalho": C.blue,

  "Pausa": C.green,

  "Tese": C.purple,

  "Pessoal": C.accent,

  "Família": "#ec4899",

  "Noite": "#6366f1",

};

function TabRotina({ rotinaDia, setRotinaDia }) {

  const key = today();

  const checks = rotinaDia[key] || {};

  const toggle = (id) => {

    const updated = { ...rotinaDia, [key]: { ...checks, [id]: !checks[id] } };

    setRotinaDia(updated);

  };

  const feitos = Object.values(checks).filter(Boolean).length;

  const pct = Math.round((feitos / BLOCOS_ROTINA.length) * 100);

  // hora atual

  const now = new Date();

  const horaAtual = now.getHours() * 60 + now.getMinutes();

  const blocoAtivo = [...BLOCOS_ROTINA].reverse().find(b => {

    const [h, m] = b.hora.split(":").map(Number);

    return horaAtual >= h * 60 + m;

  });

  return (

    <div>

      <SectionHeader icon="⏰" title="Rotina do Dia" sub="O teu plano diário otimizado" />

      {/* progresso */}

      <div style={{ background: C.surface, borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${C.border}` }}>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>

          <span style={{ fontWeight: 600 }}>Progresso hoje</span>

          <span style={{ color: C.accent, fontWeight: 700 }}>{feitos}/{BLOCOS_ROTINA.length} blocos — {pct}%</span>

        </div>

        <div style={{ height: 8, background: C.surfaceHi, borderRadius: 4 }}>

          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.gold})`, borderRadius: 4, transition: "width 0.4s" }} />

        </div>

      </div>

      {/* blocos */}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

        {BLOCOS_ROTINA.map(b => {

          const feito = !!checks[b.id];

          const isAtivo = blocoAtivo?.id === b.id;

          const cor = BLOCO_COLORS[b.bloco];

          return (

            <div key={b.id} onClick={() => toggle(b.id)} style={{

              display: "flex", alignItems: "center", gap: 14,

              background: feito ? C.surfaceHi : C.surface,

              border: `1px solid ${isAtivo ? cor : C.border}`,

              borderRadius: 10, padding: "12px 16px", cursor: "pointer",

              opacity: feito ? 0.65 : 1,

              boxShadow: isAtivo ? `0 0 0 1px ${cor}40` : "none",

              transition: "all 0.15s",

            }}>

              <div style={{ width: 3, height: 36, borderRadius: 2, background: cor, flexShrink: 0 }} />

              <div style={{ fontSize: 20 }}>{b.icon}</div>

              <div style={{ flex: 1 }}>

                <div style={{ fontWeight: 600, fontSize: 14, textDecoration: feito ? "line-through" : "none" }}>{b.label}</div>

                <div style={{ color: C.muted, fontSize: 12 }}>{b.hora} · <span style={{ color: cor }}>{b.bloco}</span>{isAtivo ? " · 🟢 AGORA" : ""}</div>

              </div>

              <div style={{

                width: 22, height: 22, borderRadius: 6, border: `2px solid ${feito ? cor : C.border}`,

                background: feito ? cor : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,

              }}>

                {feito && <span style={{ color: "#000", fontSize: 13, fontWeight: 800 }}>✓</span>}

              </div>

            </div>

          );

        })}

      </div>

      <div style={{ marginTop: 12, color: C.muted, fontSize: 12, textAlign: "center" }}>Clica em cada bloco para marcar como feito</div>

    </div>

  );

}

// ══════════════════════════════════════════════════════════════════════════

// TAB TAREFAS

// ══════════════════════════════════════════════════════════════════════════

const PRIORIDADES = ["🔴 Urgente", "🟡 Importante", "🟢 Normal"];

const CATEGORIAS_T = ["Bosch", "Tese", "Smart X Phone", "Sobrilho", "Finanças", "Família", "TikTok", "Outro"];

function TabTarefas({ tarefas, setTarefas }) {

  const [form, setForm] = useState({ texto: "", prioridade: "🟡 Importante", categoria: "Outro", prazo: "" });

  const [showForm, setShowForm] = useState(false);

  const add = () => {

    if (!form.texto.trim()) return;

    setTarefas([...tarefas, { id: uid(), ...form, feito: false, criada: today() }]);

    setForm({ texto: "", prioridade: "🟡 Importante", categoria: "Outro", prazo: "" });

    setShowForm(false);

  };

  const toggle = (id) => setTarefas(tarefas.map(t => t.id === id ? { ...t, feito: !t.feito } : t));

  const del = (id) => setTarefas(tarefas.filter(t => t.id !== id));

  const pendentes = tarefas.filter(t => !t.feito).sort((a, b) => PRIORIDADES.indexOf(a.prioridade) - PRIORIDADES.indexOf(b.prioridade));

  const feitas = tarefas.filter(t => t.feito);

  return (

    <div>

      <SectionHeader icon="✅" title="Tarefas & Lembretes" sub="Tudo o que tens para fazer" />

      <button onClick={() => setShowForm(!showForm)} style={btnStyle(C.accent)}>+ Nova Tarefa</button>

      {showForm && (

        <Card style={{ marginTop: 16, marginBottom: 16 }}>

          <Input label="O que tens para fazer?" value={form.texto} onChange={v => setForm({ ...form, texto: v })} placeholder="Ex: Ligar ao cliente X para cobrar..." />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 10 }}>

            <Select label="Prioridade" value={form.prioridade} onChange={v => setForm({ ...form, prioridade: v })} options={PRIORIDADES} />

            <Select label="Categoria" value={form.categoria} onChange={v => setForm({ ...form, categoria: v })} options={CATEGORIAS_T} />

            <Input label="Prazo" value={form.prazo} onChange={v => setForm({ ...form, prazo: v })} type="date" />

          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>

            <button onClick={add} style={btnStyle(C.accent)}>Adicionar</button>

            <button onClick={() => setShowForm(false)} style={btnStyle(C.dimmed)}>Cancelar</button>

          </div>

        </Card>

      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

        {pendentes.map(t => (

          <TarefaRow key={t.id} t={t} onToggle={() => toggle(t.id)} onDel={() => del(t.id)} />

        ))}

        {pendentes.length === 0 && <Empty msg="Sem tarefas pendentes 🎉" />}

      </div>

      {feitas.length > 0 && (

        <details style={{ marginTop: 20 }}>

          <summary style={{ color: C.muted, cursor: "pointer", marginBottom: 8 }}>Concluídas ({feitas.length})</summary>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

            {feitas.map(t => <TarefaRow key={t.id} t={t} onToggle={() => toggle(t.id)} onDel={() => del(t.id)} done />)}

          </div>

        </details>

      )}

    </div>

  );

}

function TarefaRow({ t, onToggle, onDel, done }) {

  const priColor = { "🔴 Urgente": C.red, "🟡 Importante": C.gold, "🟢 Normal": C.green }[t.prioridade] || C.muted;

  return (

    <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", opacity: done ? 0.5 : 1 }}>

      <div style={{ width: 3, height: 32, background: priColor, borderRadius: 2, flexShrink: 0 }} />

      <div onClick={onToggle} style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${done ? C.green : C.border}`, background: done ? C.green : "transparent", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {done && <span style={{ color: "#000", fontSize: 11 }}>✓</span>}

      </div>

      <div style={{ flex: 1 }}>

        <div style={{ fontWeight: 600, fontSize: 14, textDecoration: done ? "line-through" : "none" }}>{t.texto}</div>

        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>

          {t.categoria} · {t.prioridade}{t.prazo ? ` · Prazo: ${t.prazo}` : ""}

        </div>

      </div>

      <button onClick={onDel} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>

    </div>

  );

}

// ══════════════════════════════════════════════════════════════════════════

// TAB DEVEDORES

// ══════════════════════════════════════════════════════════════════════════

function TabDevedores({ devedores, setDevedores }) {

  const [form, setForm] = useState({ nome: "", valor: "", produto: "", data: today(), notas: "" });

  const [showForm, setShowForm] = useState(false);

  const add = () => {

    if (!form.nome || !form.valor) return;

    setDevedores([...devedores, { id: uid(), ...form, valor: parseFloat(form.valor), pago: false }]);

    setForm({ nome: "", valor: "", produto: "", data: today(), notas: "" });

    setShowForm(false);

  };

  const toggle = (id) => setDevedores(devedores.map(d => d.id === id ? { ...d, pago: !d.pago } : d));

  const del = (id) => setDevedores(devedores.filter(d => d.id !== id));

  const pendentes = devedores.filter(d => !d.pago);

  const pagos = devedores.filter(d => d.pago);

  const totalPendente = pendentes.reduce((s, d) => s + (d.valor || 0), 0);

  return (

    <div>

      <SectionHeader icon="💰" title="Contas a Receber" sub="Nunca mais te esqueças de cobrar" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>

        <StatCard label="Total por cobrar" value={fmt(totalPendente)} color={C.red} />

        <StatCard label="Devedores ativos" value={pendentes.length} color={C.gold} />

      </div>

      <button onClick={() => setShowForm(!showForm)} style={btnStyle(C.accent)}>+ Registar Devedor</button>

      {showForm && (

        <Card style={{ marginTop: 16, marginBottom: 16 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

            <Input label="Nome*" value={form.nome} onChange={v => setForm({ ...form, nome: v })} placeholder="Nome do cliente" />

            <Input label="Valor (AOA)*" value={form.valor} onChange={v => setForm({ ...form, valor: v })} type="number" placeholder="0" />

            <Input label="Produto/Serviço" value={form.produto} onChange={v => setForm({ ...form, produto: v })} placeholder="Ex: iPhone 13" />

            <Input label="Data da dívida" value={form.data} onChange={v => setForm({ ...form, data: v })} type="date" />

          </div>

          <div style={{ marginTop: 10 }}>

            <Input label="Notas" value={form.notas} onChange={v => setForm({ ...form, notas: v })} placeholder="Observações..." />

          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>

            <button onClick={add} style={btnStyle(C.accent)}>Guardar</button>

            <button onClick={() => setShowForm(false)} style={btnStyle(C.dimmed)}>Cancelar</button>

          </div>

        </Card>

      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>

        {pendentes.length === 0 && <Empty msg="Sem cobranças pendentes 💚" />}

        {pendentes.map(d => <DevedorRow key={d.id} d={d} onToggle={() => toggle(d.id)} onDel={() => del(d.id)} />)}

      </div>

      {pagos.length > 0 && (

        <details style={{ marginTop: 20 }}>

          <summary style={{ color: C.muted, cursor: "pointer", marginBottom: 8 }}>Recebidos ({pagos.length}) — {fmt(pagos.reduce((s, d) => s + d.valor, 0))}</summary>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

            {pagos.map(d => <DevedorRow key={d.id} d={d} onToggle={() => toggle(d.id)} onDel={() => del(d.id)} done />)}

          </div>

        </details>

      )}

    </div>

  );

}

function DevedorRow({ d, onToggle, onDel, done }) {

  const dias = Math.floor((new Date() - new Date(d.data)) / 86400000);

  const urgente = dias > 30 && !done;

  return (

    <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, border: `1px solid ${urgente ? C.red : C.border}`, borderRadius: 10, padding: "12px 16px", opacity: done ? 0.5 : 1 }}>

      <div>

        <div style={{ fontWeight: 700, fontSize: 15 }}>{d.nome}</div>

        <div style={{ fontSize: 12, color: C.muted }}>{d.produto} · {d.data}{d.notas ? ` · ${d.notas}` : ""}</div>

        {urgente && <div style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>⚠️ {dias} dias em atraso!</div>}

      </div>

      <div style={{ marginLeft: "auto", textAlign: "right" }}>

        <div style={{ fontWeight: 800, fontSize: 18, color: done ? C.green : C.accent }}>{fmt(d.valor)}</div>

        <div style={{ display: "flex", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>

          <button onClick={onToggle} style={{ ...btnStyle(done ? C.dimmed : C.green), padding: "4px 10px", fontSize: 12 }}>{done ? "↩ Desfazer" : "✓ Recebido"}</button>

          <button onClick={onDel} style={{ ...btnStyle(C.red), padding: "4px 10px", fontSize: 12 }}>×</button>

        </div>

      </div>

    </div>

  );

}

// ══════════════════════════════════════════════════════════════════════════

// TAB NEGÓCIOS

// ══════════════════════════════════════════════════════════════════════════

const NEGOCIOS_CFG = [

  { id: "smartphone", icon: "📱", nome: "Smart X Phone", desc: "Vendas de telemóveis" },

  { id: "sobrilho", icon: "🚗", nome: "Sobrilho", desc: "Pintura automóvel" },

  { id: "roupas", icon: "👗", nome: "Roupas (esposa)", desc: "Vendas de roupa" },

  { id: "rendas", icon: "🏠", nome: "Rendas", desc: "Propriedades arrendadas" },

];

function TabNegocios({ negocios, setNegocios }) {

  const [sel, setSel] = useState("smartphone");

  const n = negocios[sel] || {};

  const upd = (field, val) => setNegocios({ ...negocios, [sel]: { ...n, [field]: val } });

  const lucro = sel === "rendas" ? n.receita : (n.receita || 0) - (n.gastos || 0);

  const margem = n.receita > 0 ? Math.round((lucro / n.receita) * 100) : 0;

  return (

    <div>

      <SectionHeader icon="📊" title="Negócios" sub="Controlo de todos os teus projetos" />

      {/* tabs negócios */}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>

        {NEGOCIOS_CFG.map(nb => (

          <button key={nb.id} onClick={() => setSel(nb.id)} style={{

            padding: "8px 16px", border: `1px solid ${sel === nb.id ? C.accent : C.border}`,

            background: sel === nb.id ? C.accentSoft : C.surface, color: sel === nb.id ? C.accent : C.muted,

            borderRadius: 8, cursor: "pointer", fontWeight: sel === nb.id ? 700 : 400, fontSize: 13,

          }}>

            {nb.icon} {nb.nome}

          </button>

        ))}

      </div>

      {/* painel */}

      <Card>

        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>

          {NEGOCIOS_CFG.find(n => n.id === sel)?.icon} {NEGOCIOS_CFG.find(n => n.id === sel)?.nome}

        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>

          <NumInput label="Receita (AOA)" value={n.receita || 0} onChange={v => upd("receita", v)} />

          {sel !== "rendas" && <NumInput label="Gastos (AOA)" value={n.gastos || 0} onChange={v => upd("gastos", v)} />}

          {sel !== "rendas" && <NumInput label="Meta do mês (AOA)" value={n.meta || 0} onChange={v => upd("meta", v)} />}

          {sel === "rendas" && <Input label="Próximo recebimento" value={n.proxima || ""} onChange={v => upd("proxima", v)} type="date" />}

        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>

          <StatCard label="Receita" value={fmt(n.receita || 0)} color={C.green} small />

          {sel !== "rendas" && <StatCard label="Lucro" value={fmt(lucro)} color={lucro >= 0 ? C.green : C.red} small />}

          {sel !== "rendas" && <StatCard label="Margem" value={`${margem}%`} color={margem >= 30 ? C.green : C.gold} small />}

        </div>

        {sel !== "rendas" && n.meta > 0 && (

          <div style={{ marginBottom: 16 }}>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>

              <span style={{ color: C.muted }}>Meta do mês</span>

              <span style={{ color: C.accent }}>{Math.min(100, Math.round(((n.receita || 0) / n.meta) * 100))}%</span>

            </div>

            <div style={{ height: 6, background: C.surfaceHi, borderRadius: 3 }}>

              <div style={{ height: "100%", width: `${Math.min(100, ((n.receita || 0) / n.meta) * 100)}%`, background: C.accent, borderRadius: 3 }} />

            </div>

          </div>

        )}

        <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 4 }}>Notas / Estratégia</label>

        <textarea

          value={n.notas || ""}

          onChange={e => upd("notas", e.target.value)}

          placeholder="Escreve aqui estratégias, ideias, observações..."

          style={{ width: "100%", background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "10px 12px", fontSize: 13, minHeight: 80, resize: "vertical", boxSizing: "border-box" }}

        />

      </Card>

      {/* resumo todos */}

      <div style={{ marginTop: 20 }}>

        <div style={{ color: C.muted, fontSize: 13, marginBottom: 10, fontWeight: 600 }}>RESUMO GERAL</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>

          {NEGOCIOS_CFG.map(nb => {

            const data = negocios[nb.id] || {};

            const l = nb.id === "rendas" ? data.receita || 0 : (data.receita || 0) - (data.gastos || 0);

            return (

              <div key={nb.id} onClick={() => setSel(nb.id)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>

                <div style={{ fontSize: 13, marginBottom: 4 }}>{nb.icon} {nb.nome}</div>

                <div style={{ fontWeight: 800, fontSize: 18, color: l >= 0 ? C.green : C.red }}>{fmt(l)}</div>

                <div style={{ fontSize: 11, color: C.muted }}>{nb.id === "rendas" ? "receita" : "lucro"}</div>

              </div>

            );

          })}

        </div>

      </div>

    </div>

  );

}

// ══════════════════════════════════════════════════════════════════════════

// TAB TESE

// ══════════════════════════════════════════════════════════════════════════

function TabTese({ tese, setTese }) {

  const [novaT, setNovaT] = useState("");

  const progGeral = Math.round(tese.capitulos.reduce((s, c) => s + c.progresso, 0) / (tese.capitulos.length * 100) * 100);

  const updCap = (id, prog) => setTese({ ...tese, capitulos: tese.capitulos.map(c => c.id === id ? { ...c, progresso: prog } : c) });

  const addTarefa = () => {

    if (!novaT.trim()) return;

    setTese({ ...tese, tarefas: [...(tese.tarefas || []), { id: uid(), texto: novaT, feito: false }] });

    setNovaT("");

  };

  const toggleT = (id) => setTese({ ...tese, tarefas: (tese.tarefas || []).map(t => t.id === id ? { ...t, feito: !t.feito } : t) });

  return (

    <div>

      <SectionHeader icon="🎓" title="Tese de Mestrado" sub="Blockchain + Federated Learning — UA" />

      <Card style={{ marginBottom: 20 }}>

        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{tese.titulo}</div>

        <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Prof. Fábio Coutinho · Prof. Duarte Raposo · Prof. Pedro Rito</div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>

          <span style={{ color: C.muted, fontSize: 13 }}>Progresso geral</span>

          <span style={{ color: C.accent, fontWeight: 700, fontSize: 15 }}>{progGeral}%</span>

        </div>

        <div style={{ height: 10, background: C.surfaceHi, borderRadius: 5 }}>

          <div style={{ height: "100%", width: `${progGeral}%`, background: `linear-gradient(90deg, ${C.purple}, ${C.accent})`, borderRadius: 5, transition: "width 0.4s" }} />

        </div>

      </Card>

      <div style={{ marginBottom: 20 }}>

        <div style={{ color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>CAPÍTULOS</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {tese.capitulos.map(c => (

            <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>

                <span style={{ fontWeight: 600, fontSize: 14 }}>{c.nome}</span>

                <span style={{ color: C.accent, fontWeight: 700 }}>{c.progresso}%</span>

              </div>

              <input type="range" min={0} max={100} step={5} value={c.progresso}

                onChange={e => updCap(c.id, parseInt(e.target.value))}

                style={{ width: "100%", accentColor: C.accent }} />

            </div>

          ))}

        </div>

      </div>

      <div>

        <div style={{ color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>TAREFAS DA TESE</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>

          <input value={novaT} onChange={e => setNovaT(e.target.value)} onKeyDown={e => e.key === "Enter" && addTarefa()}

            placeholder="Adicionar tarefa da tese..." style={inputStyle()} />

          <button onClick={addTarefa} style={btnStyle(C.purple)}>+</button>

        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

          {(tese.tarefas || []).map(t => (

            <div key={t.id} onClick={() => toggleT(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", opacity: t.feito ? 0.5 : 1 }}>

              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${t.feito ? C.purple : C.border}`, background: t.feito ? C.purple : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>

                {t.feito && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}

              </div>

              <span style={{ fontSize: 14, textDecoration: t.feito ? "line-through" : "none" }}>{t.texto}</span>

            </div>

          ))}

          {(tese.tarefas || []).length === 0 && <Empty msg="Sem tarefas para a tese" />}

        </div>

      </div>

    </div>

  );

}

// ══════════════════════════════════════════════════════════════════════════

// TAB FINANÇAS

// ══════════════════════════════════════════════════════════════════════════

const CATS_ENTRADA = ["Bosch/Salário", "Smart X Phone", "Sobrilho", "Roupas", "Rendas", "TikTok", "Outro"];

const CATS_SAIDA = ["Casa", "Alimentação", "Escola filhos", "Ginásio", "Negócios", "Transporte", "Pessoal", "Outro"];

function TabFinanas({ finanas, setFinanas }) {

  const [tipo, setTipo] = useState("entrada");

  const [form, setForm] = useState({ descricao: "", valor: "", categoria: "", data: today() });

  const [showForm, setShowForm] = useState(false);

  const add = () => {

    if (!form.descricao || !form.valor) return;

    const item = { id: uid(), ...form, valor: parseFloat(form.valor) };

    if (tipo === "entrada") setFinanas({ ...finanas, entradas: [...finanas.entradas, item] });

    else setFinanas({ ...finanas, saidas: [...finanas.saidas, item] });

    setForm({ descricao: "", valor: "", categoria: "", data: today() });

    setShowForm(false);

  };

  const del = (id, t) => {

    if (t === "entrada") setFinanas({ ...finanas, entradas: finanas.entradas.filter(i => i.id !== id) });

    else setFinanas({ ...finanas, saidas: finanas.saidas.filter(i => i.id !== id) });

  };

  const totalE = finanas.entradas.reduce((s, i) => s + i.valor, 0);

  const totalS = finanas.saidas.reduce((s, i) => s + i.valor, 0);

  const saldo = totalE - totalS;

  return (

    <div>

      <SectionHeader icon="💳" title="Finanças Pessoais" sub="Controlo do dinheiro familiar" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>

        <StatCard label="Entradas" value={fmt(totalE)} color={C.green} />

        <StatCard label="Saídas" value={fmt(totalS)} color={C.red} />

        <StatCard label="Saldo" value={fmt(saldo)} color={saldo >= 0 ? C.green : C.red} />

      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>

        {["entrada", "saida"].map(t => (

          <button key={t} onClick={() => { setTipo(t); setForm(f => ({ ...f, categoria: "" })); }} style={{

            padding: "8px 16px", border: `1px solid ${tipo === t ? (t === "entrada" ? C.green : C.red) : C.border}`,

            background: tipo === t ? (t === "entrada" ? "#14532d" : "#450a0a") : C.surface,

            color: tipo === t ? (t === "entrada" ? C.green : C.red) : C.muted,

            borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,

          }}>

            {t === "entrada" ? "▲ Entradas" : "▼ Saídas"}

          </button>

        ))}

        <button onClick={() => setShowForm(!showForm)} style={{ ...btnStyle(C.accent), marginLeft: "auto" }}>+ Adicionar</button>

      </div>

      {showForm && (

        <Card style={{ marginBottom: 16 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

            <Input label="Descrição*" value={form.descricao} onChange={v => setForm({ ...form, descricao: v })} placeholder="Ex: Salário Bosch" />

            <Input label="Valor (AOA)*" value={form.valor} onChange={v => setForm({ ...form, valor: v })} type="number" />

            <Select label="Categoria" value={form.categoria} onChange={v => setForm({ ...form, categoria: v })} options={tipo === "entrada" ? CATS_ENTRADA : CATS_SAIDA} />

            <Input label="Data" value={form.data} onChange={v => setForm({ ...form, data: v })} type="date" />

          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>

            <button onClick={add} style={btnStyle(tipo === "entrada" ? C.green : C.red)}>Guardar</button>

            <button onClick={() => setShowForm(false)} style={btnStyle(C.dimmed)}>Cancelar</button>

          </div>

        </Card>

      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

        {tipo === "entrada" && finanas.entradas.slice().reverse().map(i => (

          <FinRow key={i.id} i={i} color={C.green} sign="+" onDel={() => del(i.id, "entrada")} />

        ))}

        {tipo === "saida" && finanas.saidas.slice().reverse().map(i => (

          <FinRow key={i.id} i={i} color={C.red} sign="-" onDel={() => del(i.id, "saida")} />

        ))}

        {tipo === "entrada" && finanas.entradas.length === 0 && <Empty msg="Sem entradas registadas" />}

        {tipo === "saida" && finanas.saidas.length === 0 && <Empty msg="Sem saídas registadas" />}

      </div>

    </div>

  );

}

function FinRow({ i, color, sign, onDel }) {

  return (

    <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>

      <div style={{ flex: 1 }}>

        <div style={{ fontWeight: 600, fontSize: 14 }}>{i.descricao}</div>

        <div style={{ fontSize: 11, color: C.muted }}>{i.categoria} · {i.data}</div>

      </div>

      <div style={{ fontWeight: 800, fontSize: 16, color }}>{sign}{fmt(i.valor)}</div>

      <button onClick={onDel} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>

    </div>

  );

}

// ══════════════════════════════════════════════════════════════════════════

// REUSABLE COMPONENTS

// ══════════════════════════════════════════════════════════════════════════

function SectionHeader({ icon, title, sub }) {

  return (

    <div style={{ marginBottom: 20 }}>

      <div style={{ fontSize: 22, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>

        {icon} {title}

      </div>

      <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{sub}</div>

    </div>

  );

}

function Card({ children, style = {} }) {

  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, ...style }}>{children}</div>;

}

function StatCard({ label, value, color, small = false }) {

  return (

    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: small ? "10px 12px" : "14px 16px" }}>

      <div style={{ fontSize: small ? 18 : 22, fontWeight: 800, color }}>{value}</div>

      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>

    </div>

  );

}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {

  return (

    <div>

      <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</label>

      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}

        style={inputStyle()} />

    </div>

  );

}

function NumInput({ label, value, onChange }) {

  return (

    <div>

      <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</label>

      <input type="number" value={value || ""} onChange={e => onChange(parseFloat(e.target.value) || 0)}

        style={inputStyle()} />

    </div>

  );

}

function Select({ label, value, onChange, options }) {

  return (

    <div>

      <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</label>

      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle(), cursor: "pointer" }}>

        <option value="">Selecionar...</option>

        {options.map(o => <option key={o} value={o}>{o}</option>)}

      </select>

    </div>

  );

}

function Empty({ msg }) {

  return <div style={{ textAlign: "center", color: C.muted, padding: "24px 0", fontSize: 14 }}>{msg}</div>;

}

function inputStyle() {

  return {

    width: "100%", background: C.surfaceHi, border: `1px solid ${C.border}`,

    borderRadius: 8, color: C.text, padding: "8px 12px", fontSize: 13,

    outline: "none", boxSizing: "border-box",

  };

}

function btnStyle(bg) {

  return {

    background: bg, color: bg === C.accent ? "#fff" : bg === C.dimmed ? C.muted : "#fff",

    border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600,

    cursor: "pointer", flexShrink: 0,

  };

}

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://glmlisboa.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a92e5179-aca1-4d7e-b3ea-d5106e896726).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
