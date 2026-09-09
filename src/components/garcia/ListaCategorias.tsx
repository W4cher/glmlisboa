import { useState } from "react";
import { X, Plus, RotateCcw } from "lucide-react";

interface Props {
  label: string;
  valores: string[];
  padrao: string[];
  onChange: (v: string[]) => void;
}

/**
 * Editor de uma lista de categorias: chips removíveis + campo para acrescentar.
 * Usado em Configurações para as categorias de tarefas, entradas, saídas e contas.
 */
export default function ListaCategorias({ label, valores, padrao, onChange }: Props) {
  const [novo, setNovo] = useState("");

  const adicionar = () => {
    const limpo = novo.trim();
    if (!limpo) return;
    if (valores.some(v => v.toLowerCase() === limpo.toLowerCase())) {
      setNovo("");
      return;
    }
    onChange([...valores, limpo]);
    setNovo("");
  };

  const remover = (v: string) => {
    // Nunca deixar a lista vazia — os selects ficariam sem opções.
    if (valores.length <= 1) return;
    onChange(valores.filter(x => x !== v));
  };

  const alterado = valores.join("|") !== padrao.join("|");

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] text-muted-foreground">{label}</label>
        {alterado && (
          <button
            onClick={() => onChange(padrao)}
            className="text-[10px] text-muted-foreground hover:text-primary bg-transparent border-none cursor-pointer inline-flex items-center gap-1"
          >
            <RotateCcw size={10} /> Repor
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {valores.map(v => (
          <span
            key={v}
            className="inline-flex items-center gap-1 bg-garcia-surface-hi border border-border rounded-lg pl-2.5 pr-1.5 py-1 text-xs"
          >
            {v}
            <button
              onClick={() => remover(v)}
              disabled={valores.length <= 1}
              title={valores.length <= 1 ? "Tem de sobrar pelo menos uma" : `Remover ${v}`}
              className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed inline-flex"
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-1.5">
        <input
          value={novo}
          onChange={e => setNovo(e.target.value)}
          onKeyDown={e => e.key === "Enter" && adicionar()}
          placeholder="Nova categoria"
          className="flex-1 bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-1.5 text-xs outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={adicionar}
          disabled={!novo.trim()}
          className="px-2.5 rounded-lg border border-border bg-garcia-surface-hi text-muted-foreground hover:text-primary hover:border-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
