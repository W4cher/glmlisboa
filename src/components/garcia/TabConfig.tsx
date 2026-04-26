import { Configuracoes } from "@/lib/garcia";
import { SectionHeader, GCard, GInput, GBtn } from "./SharedComponents";
import { ensureNotifPermission, notify } from "@/lib/notifications";
import { Settings, Bell, Eye, User, BellRing } from "lucide-react";
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
        <GInput label="O teu nome (aparece na app)" value={config.nome} onChange={v => setConfig({ ...config, nome: v })} placeholder="Ex: Garcia" />
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
