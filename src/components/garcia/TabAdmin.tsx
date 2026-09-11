import { useEffect, useState, useCallback } from "react";
import {
  listarUtilizadores, definirPlano, planoEfectivo, daquiAMeses,
  PLANOS, type Plano, type Utilizador,
} from "@/lib/admin";
import { SectionHeader, GCard, GBtn, Empty } from "./SharedComponents";
import ConfirmarDialog from "./ConfirmarDialog";
import { ShieldCheck, RefreshCw, Crown, Search } from "lucide-react";
import { toast } from "sonner";

const COR_PLANO: Record<Plano, string> = {
  gratuito: "hsl(var(--muted-foreground))",
  pro: "hsl(var(--garcia-blue))",
  equipa: "hsl(var(--garcia-purple))",
  vitalicio: "hsl(var(--garcia-gold))",
};

interface PorAplicar {
  utilizador: Utilizador;
  plano: Plano;
  expira: string | null;
}

export default function TabAdmin() {
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState("");
  const [procura, setProcura] = useState("");
  const [porAplicar, setPorAplicar] = useState<PorAplicar | null>(null);
  const [aGravar, setAGravar] = useState(false);

  const carregar = useCallback(async () => {
    setACarregar(true);
    setErro("");
    try {
      setUtilizadores(await listarUtilizadores());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar");
    } finally {
      setACarregar(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const pedirMudanca = (u: Utilizador, plano: Plano) => {
    // Gratuito e vitalício não têm data; os pagos ficam com um mês por defeito.
    const expira = plano === "gratuito" || plano === "vitalicio" ? null : daquiAMeses(1);
    setPorAplicar({ utilizador: u, plano, expira });
  };

  const aplicar = async () => {
    if (!porAplicar) return;
    setAGravar(true);
    try {
      await definirPlano(porAplicar.utilizador.id, porAplicar.plano, porAplicar.expira);
      toast.success(`${porAplicar.utilizador.email ?? "Utilizador"} passou a ${porAplicar.plano}`);
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível mudar o plano");
    } finally {
      setAGravar(false);
      setPorAplicar(null);
    }
  };

  const filtrados = utilizadores.filter(u => {
    const q = procura.trim().toLowerCase();
    if (!q) return true;
    return (u.email ?? "").toLowerCase().includes(q) || (u.nome ?? "").toLowerCase().includes(q);
  });

  const contagem = (p: Plano) => utilizadores.filter(u => planoEfectivo(u) === p).length;

  return (
    <div>
      <SectionHeader
        icon={<ShieldCheck size={22} />}
        title="Administração"
        sub="Quem usa a app e com que plano"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {PLANOS.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-lg px-3 py-2">
            <div className="text-lg font-extrabold" style={{ color: COR_PLANO[p.id] }}>
              {contagem(p.id)}
            </div>
            <div className="text-[11px] text-muted-foreground">{p.nome}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={procura}
            onChange={e => setProcura(e.target.value)}
            placeholder="Procurar por email ou nome"
            className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground pl-9 pr-3 py-2 text-[13px] outline-none focus:border-primary transition-colors"
          />
        </div>
        <GBtn onClick={carregar} color="hsl(var(--garcia-neutral))">
          <RefreshCw size={14} /> {aCarregar ? "..." : "Actualizar"}
        </GBtn>
      </div>

      {erro && (
        <GCard className="mb-4">
          <div className="text-sm text-[hsl(var(--garcia-red))]">{erro}</div>
        </GCard>
      )}

      {aCarregar && utilizadores.length === 0 && <Empty msg="A carregar..." />}
      {!aCarregar && filtrados.length === 0 && <Empty msg="Ninguém encontrado." />}

      <div className="flex flex-col gap-2">
        {filtrados.map(u => {
          const efectivo = planoEfectivo(u);
          const expirou = u.plano !== efectivo;
          return (
            <GCard key={u.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate inline-flex items-center gap-1.5">
                    {u.email ?? "(sem email)"}
                    {u.is_admin && <Crown size={13} className="text-[hsl(var(--garcia-gold))]" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {u.nome ? `${u.nome} · ` : ""}
                    desde {u.criado_em?.slice(0, 10)}
                    {u.plano_expira_em && ` · até ${u.plano_expira_em.slice(0, 10)}`}
                  </div>
                </div>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0"
                  style={{ color: COR_PLANO[efectivo], borderColor: COR_PLANO[efectivo] }}
                >
                  {efectivo}{expirou ? " (expirou)" : ""}
                </span>
              </div>

              <div className="flex gap-1.5 mt-3 flex-wrap">
                {PLANOS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => pedirMudanca(u, p.id)}
                    disabled={u.plano === p.id}
                    title={p.desc}
                    className="px-2.5 py-1 rounded-lg text-[11px] cursor-pointer border transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                    style={{
                      borderColor: u.plano === p.id ? COR_PLANO[p.id] : "hsl(var(--border))",
                      background: u.plano === p.id ? "hsl(var(--garcia-accent-soft))" : "transparent",
                      color: u.plano === p.id ? COR_PLANO[p.id] : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {p.nome}
                  </button>
                ))}
              </div>
            </GCard>
          );
        })}
      </div>

      <ConfirmarDialog
        aberto={porAplicar !== null}
        titulo={porAplicar ? `Passar para ${porAplicar.plano}?` : ""}
        descricao={
          porAplicar
            ? `${porAplicar.utilizador.email ?? "Este utilizador"} passa ao plano ${porAplicar.plano}` +
              (porAplicar.expira
                ? `, válido até ${porAplicar.expira}. Podes mudar a data depois.`
                : porAplicar.plano === "vitalicio"
                  ? ", sem data de fim e sem pagar."
                  : ", com os limites do plano gratuito.")
            : ""
        }
        textoConfirmar={aGravar ? "A aplicar..." : "Confirmar"}
        destrutivo={porAplicar?.plano === "gratuito"}
        onConfirmar={aplicar}
        onCancelar={() => setPorAplicar(null)}
      />
    </div>
  );
}
