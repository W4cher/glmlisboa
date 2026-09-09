import {
  Configuracoes, catsOu,
  CATEGORIAS_T, CATS_ENTRADA, CATS_SAIDA, CATS_CONTAS_PAGAR,
} from "@/lib/garcia";
import { SectionHeader, GCard, GInput, GBtn } from "./SharedComponents";
import ListaCategorias from "./ListaCategorias";
import { MOEDAS, MOEDA_PADRAO, fmtMoeda, type CodigoMoeda } from "@/lib/moeda";
import { ensureNotifPermission, notify } from "@/lib/notifications";
import { Settings, Bell, Eye, User, BellRing, Tags, Coins } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  config: Configuracoes;
  setConfig: (v: Configuracoes) => void;
  onLogout: () => void;
}

export default function TabConfig({ config, setConfig, onLogout }: Props) {
  const ativarNotifs = async () => {
    const ok = await ensureNotifPermission();
    if (ok) {
      setConfig({ ...config, notificacoesAtivas: true });
      notify("Notificações activas", "Vais receber alertas de tarefas e cobranças.");
    } else {
      toast.error("Permissão de notificações negada. Activa nas definições do navegador.");
    }
  };

  const desativarNotifs = () => {
    setConfig({ ...config, notificacoesAtivas: false });
    toast("Notificações desativadas");
  };

  return (
    <div>
      <SectionHeader icon={<Settings size={22} />} title="Configurações" sub="Personaliza a tua experiência" />

      <GCard className="mb-4">
        <div className="font-semibold text-sm mb-3 inline-flex items-center gap-2"><User size={16} /> Identidade</div>
        <GInput label="O teu nome (aparece na app)" value={config.nome} onChange={v => setConfig({ ...config, nome: v })} placeholder="O teu primeiro nome" />
      </GCard>

      <GCard className="mb-4">
        <div className="font-semibold text-sm mb-3 inline-flex items-center gap-2"><Coins size={16} /> Moeda</div>
        <div className="text-xs text-muted-foreground mb-3">
          Todos os valores da app — vendas, dívidas, contas, stock e finanças — passam a ser
          mostrados nesta moeda. Os números que já registaste não são convertidos, apenas
          reescritos com o novo símbolo.
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MOEDAS.map(m => {
            const activo = (config.moeda ?? MOEDA_PADRAO) === m.codigo;
            return (
              <button key={m.codigo}
                onClick={() => setConfig({ ...config, moeda: m.codigo as CodigoMoeda })}
                className="text-left rounded-lg px-3 py-2 cursor-pointer border transition-all"
                style={{
                  borderColor: activo ? "hsl(var(--primary))" : "hsl(var(--border))",
                  background: activo ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--garcia-surface-hi))",
                }}>
                <span className="flex items-baseline gap-1.5">
                  <span className="font-extrabold text-sm"
                    style={{ color: activo ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}>
                    {m.simbolo}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{m.codigo}</span>
                </span>
                <span className="block text-[10px] text-muted-foreground truncate">{m.nome}</span>
              </button>
            );
          })}
        </div>
        <div className="text-[11px] text-muted-foreground mt-3">
          Exemplo: <span className="text-foreground font-semibold">{fmtMoeda(1500, config.moeda)}</span>
        </div>
      </GCard>

      <GCard className="mb-4">
        <div className="font-semibold text-sm mb-3 inline-flex items-center gap-2"><Bell size={16} /> Notificações</div>
        <div className="text-xs text-muted-foreground mb-3">
          Recebe alertas no telemóvel quando tens uma tarefa para fazer agora ou uma cobrança vencida.
          Funciona via notificações do navegador (também na ecrã principal se a app estiver instalada).
        </div>
        {config.notificacoesAtivas ? (
          <div className="flex gap-2 items-center">
            <span className="text-[hsl(var(--garcia-green))] text-sm inline-flex items-center gap-1.5"><BellRing size={14} /> Activas</span>
            <GBtn onClick={desativarNotifs} color="hsl(var(--muted))" small>Desativar</GBtn>
            <GBtn onClick={() => notify("Teste", "As notificações estão a funcionar!")} color="hsl(var(--garcia-blue))" small>Testar</GBtn>
          </div>
        ) : (
          <GBtn onClick={ativarNotifs} color="hsl(var(--primary))"><Bell size={14} /> Ativar notificações</GBtn>
        )}
      </GCard>

      <GCard className="mb-4">
        <div className="font-semibold text-sm mb-3 inline-flex items-center gap-2"><Tags size={16} /> Categorias</div>
        <div className="text-xs text-muted-foreground mb-4">
          Adapta as categorias ao teu negócio. Elas aparecem nas listas de escolha ao registar
          tarefas, entradas, saídas e contas a pagar.
        </div>
        <ListaCategorias
          label="Tarefas"
          valores={catsOu(config.categoriasTarefas, CATEGORIAS_T)}
          padrao={CATEGORIAS_T}
          onChange={v => setConfig({ ...config, categoriasTarefas: v })}
        />
        <ListaCategorias
          label="Entradas de dinheiro"
          valores={catsOu(config.categoriasEntrada, CATS_ENTRADA)}
          padrao={CATS_ENTRADA}
          onChange={v => setConfig({ ...config, categoriasEntrada: v })}
        />
        <ListaCategorias
          label="Saídas de dinheiro"
          valores={catsOu(config.categoriasSaida, CATS_SAIDA)}
          padrao={CATS_SAIDA}
          onChange={v => setConfig({ ...config, categoriasSaida: v })}
        />
        <ListaCategorias
          label="Contas a pagar"
          valores={catsOu(config.categoriasContas, CATS_CONTAS_PAGAR)}
          padrao={CATS_CONTAS_PAGAR}
          onChange={v => setConfig({ ...config, categoriasContas: v })}
        />
      </GCard>

      <GCard className="mb-4">
        <div className="font-semibold text-sm mb-3 inline-flex items-center gap-2"><Eye size={16} /> Privacidade</div>
        <div className="text-xs text-muted-foreground mb-3">Esconde valores monetários por defeito. Podes mostrar a qualquer momento clicando no olho do cabeçalho.</div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={config.ocultarValores} onChange={e => setConfig({ ...config, ocultarValores: e.target.checked })}
            className="w-4 h-4 cursor-pointer" />
          <span className="text-sm">Ocultar valores por defeito</span>
        </label>
      </GCard>

      <GCard>
        <div className="font-semibold text-sm mb-3">Sessão</div>
        <GBtn onClick={onLogout} color="hsl(var(--garcia-red))">Terminar sessão</GBtn>
      </GCard>
    </div>
  );
}
