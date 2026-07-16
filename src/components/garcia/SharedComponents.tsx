import React from "react";

export function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="mb-5">
      <div className="text-[22px] font-extrabold flex items-center gap-2.5">
        <span className="text-primary">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="text-muted-foreground text-[13px] mt-0.5">{sub}</div>
    </div>
  );
}

export function GCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>{children}</div>;
}

export function StatCard({ label, value, color, small = false }: { label: string; value: string | number; color: string; small?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg min-w-0 overflow-hidden" style={{ padding: small ? "8px 10px" : "12px 14px" }}>
      <div
        className={`font-extrabold leading-tight break-words ${small ? "text-sm sm:text-base" : "text-base sm:text-xl"}`}
        style={{ color, wordBreak: "break-word", overflowWrap: "anywhere" }}
        title={String(value)}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{label}</div>
    </div>
  );
}

export function GInput({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2 text-[13px] outline-none" />
    </div>
  );
}

export function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      <input type="number" value={value || ""} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2 text-[13px] outline-none" />
    </div>
  );
}

export function GSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2 text-[13px] outline-none cursor-pointer">
        <option value="">Selecionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function Empty({ msg }: { msg: string }) {
  return <div className="text-center text-muted-foreground py-6 text-sm">{msg}</div>;
}

export function GBtn({ onClick, color, children, small = false }: {
  onClick: () => void; color: string; children: React.ReactNode; small?: boolean;
}) {
  return (
    <button onClick={onClick} style={{ background: color }}
      className={`text-primary-foreground border-none rounded-lg font-semibold text-[13px] cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${small ? "px-2.5 py-1 text-xs" : "px-4 py-2"}`}>
      {children}
    </button>
  );
}
