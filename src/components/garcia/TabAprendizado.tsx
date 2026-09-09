import { useState } from "react";
import { AprendizadoArea, APRENDIZADO_ICONS, uid } from "@/lib/garcia";
import ConfirmarDialog from "./ConfirmarDialog";
import { SectionHeader, GCard, GInput, GBtn, Empty } from "./SharedComponents";
import { Icon } from "@/lib/icons";
import { GraduationCap, Plus, Trash2, Check } from "lucide-react";

interface Props {
  areas: AprendizadoArea[];
  setAreas: (v: AprendizadoArea[]) => void;
}

export default function TabAprendizado({ areas, setAreas }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoObjetivo, setNovoObjetivo] = useState("");
  const [novoIcon, setNovoIcon] = useState("graduation-cap");
  const [novoTopico, setNovoTopico] = useState<Record<string, string>>({});
  const [areaAApagar, setAreaAApagar] = useState<string | null>(null);

  const addArea = () => {
    if (!novoNome.trim()) return;
    setAreas([...areas, { id: uid(), nome: novoNome.trim(), icon: novoIcon, objetivo: novoObjetivo.trim(), topicos: [], notas: "" }]);
    setNovoNome(""); setNovoObjetivo(""); setNovoIcon("graduation-cap");
    setShowAdd(false);
  };

  const confirmarApagarArea = () => {
    if (!areaAApagar) return;
    setAreas(areas.filter(a => a.id !== areaAApagar));
    setAreaAApagar(null);
  };

  const addTopico = (areaId: string) => {
    const texto = (novoTopico[areaId] || "").trim();
    if (!texto) return;
    setAreas(areas.map(a => a.id === areaId ? { ...a, topicos: [...a.topicos, { id: uid(), texto, feito: false }] } : a));
    setNovoTopico({ ...novoTopico, [areaId]: "" });
  };

  const toggleTopico = (areaId: string, topicoId: string) => {
    setAreas(areas.map(a => a.id === areaId ? { ...a, topicos: a.topicos.map(t => t.id === topicoId ? { ...t, feito: !t.feito } : t) } : a));
  };

  const delTopico = (areaId: string, topicoId: string) => {
    setAreas(areas.map(a => a.id === areaId ? { ...a, topicos: a.topicos.filter(t => t.id !== topicoId) } : a));
  };

  const updNotas = (areaId: string, notas: string) => {
    setAreas(areas.map(a => a.id === areaId ? { ...a, notas } : a));
  };

  return (
    <div>
      <SectionHeader icon={<GraduationCap size={22} />} title="Aprendizado" sub="O que estás a aprender e o teu progresso" />

      <GBtn onClick={() => setShowAdd(!showAdd)} color="hsl(var(--garcia-purple))"><Plus size={14} /> Nova área</GBtn>

      {showAdd && (
        <GCard className="mt-4 mb-4">
          <div className="font-semibold text-sm mb-3">Criar área de aprendizado</div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {APRENDIZADO_ICONS.map(ic => (
              <button key={ic} onClick={() => setNovoIcon(ic)}
                className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all border"
                style={{
                  background: novoIcon === ic ? "hsl(var(--garcia-accent-soft))" : "hsl(var(--garcia-surface-hi))",
                  borderColor: novoIcon === ic ? "hsl(var(--primary))" : "hsl(var(--border))",
                  color: novoIcon === ic ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}>
                <Icon name={ic} size={18} />
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <GInput label="Nome*" value={novoNome} onChange={setNovoNome} placeholder="Ex: Inglês, Contabilidade, Marketing..." />
            <GInput label="Objetivo" value={novoObjetivo} onChange={setNovoObjetivo} placeholder="Ex: Ler papers em inglês" />
          </div>
          <div className="mt-3 flex gap-2">
            <GBtn onClick={addArea} color="hsl(var(--garcia-purple))">Criar</GBtn>
            <GBtn onClick={() => setShowAdd(false)} color="hsl(var(--garcia-neutral))">Cancelar</GBtn>
          </div>
        </GCard>
      )}

      {areas.length === 0 && <Empty msg="Sem áreas de aprendizado. Cria a primeira para começar a acompanhar o teu progresso." />}

      <div className="flex flex-col gap-4 mt-4">
        {areas.map(a => {
          const feitos = a.topicos.filter(t => t.feito).length;
          const total = a.topicos.length;
          const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
          return (
            <GCard key={a.id}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[hsl(var(--garcia-accent-soft))] text-primary shrink-0">
                  <Icon name={a.icon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px]">{a.nome}</div>
                  {a.objetivo && <div className="text-xs text-muted-foreground">{a.objetivo}</div>}
                  <div className="flex justify-between mt-2 text-[12px]">
                    <span className="text-muted-foreground">{feitos}/{total} tópicos</span>
                    <span className="text-primary font-bold">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-garcia-surface-hi rounded-sm mt-1">
                    <div className="h-full rounded-sm bg-[hsl(var(--garcia-purple))]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button onClick={() => setAreaAApagar(a.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5 mt-3">
                {a.topicos.map(t => (
                  <div key={t.id} className="flex items-center gap-2.5 bg-garcia-surface-hi border border-border rounded-lg px-3 py-2">
                    <div onClick={() => toggleTopico(a.id, t.id)} className="w-[18px] h-[18px] rounded shrink-0 cursor-pointer flex items-center justify-center" style={{
                      border: `2px solid ${t.feito ? "hsl(var(--garcia-purple))" : "hsl(var(--border))"}`,
                      background: t.feito ? "hsl(var(--garcia-purple))" : "transparent",
                    }}>
                      {t.feito && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span className={`flex-1 text-sm ${t.feito ? "line-through opacity-60" : ""}`}>{t.texto}</span>
                    <button onClick={() => delTopico(a.id, t.id)} className="text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={novoTopico[a.id] || ""}
                  onChange={e => setNovoTopico({ ...novoTopico, [a.id]: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && addTopico(a.id)}
                  placeholder="Adicionar tópico..."
                  className="flex-1 bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2 text-[13px] outline-none"
                />
                <GBtn onClick={() => addTopico(a.id)} color="hsl(var(--garcia-purple))"><Plus size={14} /></GBtn>
              </div>

              <textarea value={a.notas} onChange={e => updNotas(a.id, e.target.value)}
                placeholder="Notas, recursos, links..."
                className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2.5 text-[13px] min-h-[60px] resize-y mt-3" />
            </GCard>
          );
        })}
      </div>

      <ConfirmarDialog
        aberto={areaAApagar !== null}
        titulo="Apagar esta área de aprendizado?"
        descricao="Os tópicos e as notas desta área são apagados e não há forma de os recuperar."
        textoConfirmar="Apagar"
        destrutivo
        onConfirmar={confirmarApagarArea}
        onCancelar={() => setAreaAApagar(null)}
      />
    </div>
  );
}
