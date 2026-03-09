import { useState } from "react";
import { NegocioCfg, NEGOCIO_ICONS, uid } from "@/lib/garcia";
import { GCard, GInput, GBtn } from "./SharedComponents";

interface Props {
  onAdd: (cfg: NegocioCfg) => void;
  onCancel: () => void;
}

export default function NegocioForm({ onAdd, onCancel }: Props) {
  const [nome, setNome] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("📦");

  const submit = () => {
    if (!nome.trim()) return;
    onAdd({ id: uid(), icon, nome: nome.trim(), desc: desc.trim() });
    setNome("");
    setDesc("");
    setIcon("📦");
  };

  return (
    <GCard className="mb-5">
      <div className="font-semibold text-sm mb-3">➕ Criar novo negócio</div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {NEGOCIO_ICONS.map(ic => (
          <button key={ic} onClick={() => setIcon(ic)}
            className="w-9 h-9 rounded-lg text-lg flex items-center justify-center cursor-pointer transition-all border"
            style={{
              background: icon === ic ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--garcia-surface-hi))",
              borderColor: icon === ic ? "hsl(var(--primary))" : "hsl(var(--border))",
            }}>
            {ic}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <GInput label="Nome do negócio*" value={nome} onChange={setNome} placeholder="Ex: Barbearia" />
        <GInput label="Descrição" value={desc} onChange={setDesc} placeholder="Ex: Cortes de cabelo" />
      </div>
      <div className="mt-3 flex gap-2">
        <GBtn onClick={submit} color="hsl(var(--primary))">Criar</GBtn>
        <GBtn onClick={onCancel} color="hsl(var(--muted))">Cancelar</GBtn>
      </div>
    </GCard>
  );
}
