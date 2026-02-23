import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Verifica o teu email para confirmar a conta!");
    }
    setLoading(false);
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-primary-foreground"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--garcia-gold)))" }}>G</div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sistema Garcia</h1>
          <p className="text-muted-foreground text-sm mt-1">O teu sistema de produtividade pessoal</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex mb-6 bg-garcia-surface-hi rounded-lg p-1">
            <button onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              Entrar
            </button>
            <button onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${!isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" 
                placeholder="teu@email.com" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full bg-garcia-surface-hi border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                placeholder="Mínimo 6 caracteres" />
            </div>

            {error && <div className="text-sm p-2 rounded-lg bg-destructive/10 text-destructive">{error}</div>}
            {message && <div className="text-sm p-2 rounded-lg bg-garcia-green/10" style={{ color: "hsl(var(--garcia-green))" }}>{message}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm mt-1 disabled:opacity-50 transition-opacity">
              {loading ? "A processar..." : isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
