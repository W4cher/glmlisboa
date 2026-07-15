import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AuthOAuthNamespace {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
}

function oauthNs(): AuthOAuthNamespace | null {
  const ns = (supabase.auth as any).oauth;
  return ns ?? null;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Falta authorization_id.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        navigate("/login?next=" + encodeURIComponent(next), { replace: true });
        return;
      }
      const ns = oauthNs();
      if (!ns) {
        setError("OAuth SDK indisponível.");
        return;
      }
      const { data, error } = await ns.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, navigate]);

  async function decide(approve: boolean) {
    setBusy(true);
    const ns = oauthNs();
    if (!ns) {
      setBusy(false);
      setError("OAuth SDK indisponível.");
      return;
    }
    const { data, error } = approve
      ? await ns.approveAuthorization(authorizationId)
      : await ns.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor OAuth não devolveu redirect.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 text-center">
          <h1 className="text-lg font-bold mb-2">Não foi possível carregar</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-primary text-xl font-mono">A carregar…</div>
      </div>
    );
  }

  const clientName = details.client?.name ?? details.client?.client_name ?? "esta aplicação";
  const scopes: string[] = details.scopes ?? details.requested_scopes ?? [];

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary-foreground"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--garcia-gold)))" }}>G</div>
        <h1 className="text-xl font-extrabold tracking-tight text-center mb-2">
          Ligar <span className="text-primary">{clientName}</span> à tua conta
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Isto permite que {clientName} use as ferramentas do Sistema Garcia como tu — a ler tarefas, cobranças, negócios e finanças da tua conta.
        </p>
        {scopes.length > 0 && (
          <div className="bg-garcia-surface-hi border border-border rounded-lg p-3 mb-4 text-xs">
            <div className="font-semibold mb-1">Permissões pedidas</div>
            <ul className="list-disc pl-4 text-muted-foreground">
              {scopes.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground text-center mb-5">
          As políticas de acesso da tua conta continuam a valer — nada é partilhado além do que essas políticas permitem.
        </p>
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 py-2.5 rounded-lg bg-garcia-surface-hi border border-border text-sm font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "…" : "Aprovar"}
          </button>
        </div>
      </div>
    </div>
  );
}
