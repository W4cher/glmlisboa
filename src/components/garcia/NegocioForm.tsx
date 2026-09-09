import { useState } from "react";
import { NegocioCfg, TipoNegocio, NEGOCIO_ICONS, uid } from "@/lib/garcia";
import { GCard, GInput, GBtn } from "./SharedComponents";
import { Icon } from "@/lib/icons";

interface Props {
  onAdd: (cfg: NegocioCfg) => void;
  onCancel: () => void;
}

export default function NegocioForm({ onAdd, onCancel }: Props) {
  const [nome, setNome] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("package");
  const [tipo, setTipo] = useState<TipoNegocio>("produtos");

  const submit = () => {
    if (!nome.trim()) return;
    onAdd({ id: uid(), icon, nome: nome.trim(), desc: desc.trim(), tipo });
    setNome("");
    setDesc("");
    setIcon("package");
    setTipo("produtos");
  };

  return (
    <GCard className="mb-5">
      <div className="font-semibold text-sm mb-3">Criar novo negócio</div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {NEGOCIO_ICONS.map(ic => (
          <button key={ic} onClick={() => setIcon(ic)}
            className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all border"
            style={{
              background: icon === ic ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--garcia-surface-hi))",
              borderColor: icon === ic ? "hsl(var(--primary))" : "hsl(var(--border))",
              color: icon === ic ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            }}>
            <Icon name={ic} size={18} />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <GInput label="Nome do negócio*" value={nome} onChange={setNome} placeholder="Ex: Barbearia" />
        <GInput label="Descrição" value={desc} onChange={setDesc} placeholder="Ex: Cortes de cabelo" />
      </div>
      <div className="mt-3">
        <label className="block text-[11px] text-muted-foreground mb-1.5">Como funciona este negócio?</label>
        <div className="flex gap-1.5 flex-wrap">
          {([
            ["produtos", "Vendo produtos"],
            ["servicos", "Presto serviços"],
            ["recorrente", "Recebo todos os meses"],
          ] as [TipoNegocio, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTipo(t)}
              className="px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-all"
              style={{
                borderColor: tipo === t ? "hsl(var(--primary))" : "hsl(var(--border))",
                background: tipo === t ? "hsl(var(--garcia-accent-soft))" : "transparent",
                color: tipo === t ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <GBtn onClick={submit} color="hsl(var(--primary))">Criar</GBtn>
        <GBtn onClick={onCancel} color="hsl(var(--muted))">Cancelar</GBtn>
      </div>
    </GCard>
  );
}
