import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  load, save, Devedor, Negocio, NegocioCfg, Tarefa, Financas, AprendizadoArea,
  BlocoRotina, Configuracoes, ContaPagar,
  DEFAULT_NEGOCIOS, DEFAULT_NEGOCIOS_CFG, DEFAULT_APRENDIZADO, DEFAULT_CONFIG,
  diasAtras,
} from "@/lib/garcia";
import TabRotina from "@/components/garcia/TabRotina";
import TabTarefas from "@/components/garcia/TabTarefas";
import TabDevedores from "@/components/garcia/TabDevedores";
import TabContasPagar from "@/components/garcia/TabContasPagar";
import TabNegocios from "@/components/garcia/TabNegocios";
import TabAprendizado from "@/components/garcia/TabAprendizado";
import TabFinancas from "@/components/garcia/TabFinancas";
import TabConfig from "@/components/garcia/TabConfig";
import AuthPage from "@/pages/Auth";
import { notify } from "@/lib/notifications";
import {
  Clock, CheckSquare, Wallet, Receipt, BarChart3, GraduationCap, CreditCard, Settings,
  Eye, EyeOff, type LucideIcon,
} from "lucide-react";

const TABS: { id: string; icon: LucideIcon; label: string }[] = [
  { id: "rotina", icon: Clock, label: "Rotina" },
  { id: "tarefas", icon: CheckSquare, label: "Tarefas" },
  { id: "devedores", icon: Wallet, label: "A Receber" },
  { id: "contaspagar", icon: Receipt, label: "A Pagar" },
  { id: "negocios", icon: BarChart3, label: "Negócios" },
  { id: "aprendizado", icon: GraduationCap, label: "Aprendizado" },
  { id: "finanas", icon: CreditCard, label: "Finanças" },
  { id: "config", icon: Settings, label: "Configurações" },
];

export default function Index() {
  const [tab, setTab] = useState("rotina");
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [devedores, setDevedores] = useState<Devedor[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [negocios, setNegocios] = useState<Record<string, Negocio>>(DEFAULT_NEGOCIOS);
  const [negociosCfg, setNegociosCfg] = useState<NegocioCfg[]>(DEFAULT_NEGOCIOS_CFG);
  const [aprendizado, setAprendizado] = useState<AprendizadoArea[]>(DEFAULT_APRENDIZADO);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [rotinaDia, setRotinaDia] = useState<Record<string, Record<string, boolean>>>({});
  const [blocos, setBlocos] = useState<BlocoRotina[]>([]);
  const [finanas, setFinanas] = useState<Financas>({ entradas: [], saidas: [] });
  const [config, setConfig] = useState<Configuracoes>(DEFAULT_CONFIG);
  const [valoresVisiveis, setValoresVisiveis] = useState(true);

  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const debouncedSave = useCallback((key: string, val: any) => {
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => save(key, val), 500);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setLoaded(false); return; }
    (async () => {
      const [d, cp, n, nc, ap, tk, rd, bl, fi, cfg] = await Promise.all([
        load<Devedor[]>("garcia:devedores"),
        load<ContaPagar[]>("garcia:contaspagar"),
        load<Record<string, Negocio>>("garcia:negocios"),
        load<NegocioCfg[]>("garcia:negocios_cfg"),
        load<AprendizadoArea[]>("garcia:aprendizado"),
        load<Tarefa[]>("garcia:tarefas"),
        load<Record<string, Record<string, boolean>>>("garcia:rotina"),
        load<BlocoRotina[]>("garcia:blocos"),
        load<Financas>("garcia:finanas"),
        load<Configuracoes>("garcia:config"),
      ]);
      if (d) setDevedores(d);
      if (cp) setContasPagar(cp);
      if (n) setNegocios(n);
      if (nc) setNegociosCfg(nc);
      if (ap) setAprendizado(ap);
      if (tk) setTarefas(tk);
      if (rd) setRotinaDia(rd);
      if (bl) setBlocos(bl);
      if (fi) setFinanas(fi);
      if (cfg) {
        setConfig(cfg);
        setValoresVisiveis(!cfg.ocultarValores);
      }
      setLoaded(true);
    })();
  }, [user]);

  useEffect(() => { if (loaded) debouncedSave("garcia:devedores", devedores); }, [devedores, loaded, debouncedSave]);
  useEffect(() => { if (loaded) debouncedSave("garcia:negocios", negocios); }, [negocios, loaded, debouncedSave]);
  useEffect(() => { if (loaded) debouncedSave("garcia:negocios_cfg", negociosCfg); }, [negociosCfg, loaded, debouncedSave]);
  useEffect(() => { if (loaded) debouncedSave("garcia:aprendizado", aprendizado); }, [aprendizado, loaded, debouncedSave]);
  useEffect(() => { if (loaded) debouncedSave("garcia:tarefas", tarefas); }, [tarefas, loaded, debouncedSave]);
  useEffect(() => { if (loaded) debouncedSave("garcia:rotina", rotinaDia); }, [rotinaDia, loaded, debouncedSave]);
  useEffect(() => { if (loaded) debouncedSave("garcia:blocos", blocos); }, [blocos, loaded, debouncedSave]);
  useEffect(() => { if (loaded) debouncedSave("garcia:finanas", finanas); }, [finanas, loaded, debouncedSave]);
  useEffect(() => { if (loaded) debouncedSave("garcia:config", config); }, [config, loaded, debouncedSave]);
  useEffect(() => { if (loaded) debouncedSave("garcia:contaspagar", contasPagar); }, [contasPagar, loaded, debouncedSave]);

  // Verificador de notificações: tarefas urgentes para hoje + cobranças vencidas
  useEffect(() => {
    if (!loaded || !config.notificacoesAtivas) return;
    const sentKey = "garcia:notif_sent_" + new Date().toISOString().split("T")[0];
    const alreadySent: string[] = JSON.parse(sessionStorage.getItem(sentKey) || "[]");
    const novos: string[] = [];

    tarefas.filter(t => !t.feito && t.prioridade === "Urgente" && t.prazo && t.prazo <= new Date().toISOString().split("T")[0])
      .forEach(t => {
        const k = "tarefa:" + t.id;
        if (!alreadySent.includes(k)) {
          notify("Tarefa urgente", t.texto);
          novos.push(k);
        }
      });

    devedores.filter(d => !d.pago && diasAtras(d.data) > 30).forEach(d => {
      const k = "cobr:" + d.id;
      if (!alreadySent.includes(k)) {
        notify("Cobrança em atraso", `${d.nome} — ${diasAtras(d.data)} dias`);
        novos.push(k);
      }
    });

    if (novos.length > 0) {
      sessionStorage.setItem(sentKey, JSON.stringify([...alreadySent, ...novos]));
    }
  }, [loaded, config.notificacoesAtivas, tarefas, devedores]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoaded(false);
    setDevedores([]);
    setNegocios(DEFAULT_NEGOCIOS);
    setNegociosCfg(DEFAULT_NEGOCIOS_CFG);
    setAprendizado(DEFAULT_APRENDIZADO);
    setTarefas([]);
    setRotinaDia({});
    setBlocos(DEFAULT_BLOCOS_ROTINA);
    setFinanas({ entradas: [], saidas: [] });
    setConfig(DEFAULT_CONFIG);
  };

  if (!authChecked) return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="text-primary text-2xl font-mono">A carregar...</div>
    </div>
  );

  if (!user) return <AuthPage />;

  if (!loaded) return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="text-primary text-2xl font-mono">A carregar o teu sistema...</div>
    </div>
  );

  const ocultar = !valoresVisiveis;
  const nomeApp = config.nome || "Sistema Garcia";

  return (
    <div className="bg-background min-h-screen font-sans text-foreground">
      <div className="bg-card border-b border-border px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold text-primary-foreground"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--garcia-gold)))" }}>
          {(config.nome || "G").charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-base tracking-tight">{nomeApp}</div>
          <div className="text-muted-foreground text-[11px]">
            {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <div className="ml-auto flex gap-1.5 items-center">
          <button onClick={() => setValoresVisiveis(v => !v)}
            title={valoresVisiveis ? "Esconder valores" : "Mostrar valores"}
            className="text-muted-foreground hover:text-foreground bg-garcia-surface-hi border border-border rounded-lg p-1.5 transition-colors">
            {valoresVisiveis ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <MiniStat label="Cobranças" value={devedores.filter(d => !d.pago).length} color="hsl(var(--garcia-red))" />
          <MiniStat label="Tarefas" value={tarefas.filter(t => !t.feito).length} color="hsl(var(--garcia-gold))" />
        </div>
      </div>

      <div className="flex overflow-x-auto bg-card border-b border-border px-3">
        {TABS.map(t => {
          const TIcon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-3 bg-transparent border-none cursor-pointer text-[13px] whitespace-nowrap transition-all flex items-center gap-1.5"
              style={{
                color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                fontWeight: active ? 700 : 400,
                borderBottom: active ? "2px solid hsl(var(--primary))" : "2px solid transparent",
              }}>
              <TIcon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-[900px] mx-auto p-5">
        {tab === "rotina" && <TabRotina rotinaDia={rotinaDia} setRotinaDia={setRotinaDia} blocos={blocos} setBlocos={setBlocos} nome={config.nome} />}
        {tab === "tarefas" && <TabTarefas tarefas={tarefas} setTarefas={setTarefas} />}
        {tab === "devedores" && <TabDevedores devedores={devedores} setDevedores={setDevedores} negocios={negocios} setNegocios={setNegocios} negociosCfg={negociosCfg} ocultarValores={ocultar} />}
        {tab === "negocios" && <TabNegocios negocios={negocios} setNegocios={setNegocios} negociosCfg={negociosCfg} setNegociosCfg={setNegociosCfg} ocultarValores={ocultar} />}
        {tab === "aprendizado" && <TabAprendizado areas={aprendizado} setAreas={setAprendizado} />}
        {tab === "finanas" && <TabFinancas finanas={finanas} setFinanas={setFinanas} ocultarValores={ocultar} />}
        {tab === "config" && <TabConfig config={config} setConfig={setConfig} onLogout={handleLogout} />}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center bg-garcia-surface-hi rounded-lg px-2.5 py-1 border border-border">
      <div className="text-lg font-extrabold" style={{ color }}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}
