import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Sign-in (admin) + sign-up + forgot password
export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Kenula Pathirathna" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        nav({ to: "/admin" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Account created — you can sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Password reset email sent.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 md:px-8 py-20">
      <p className="text-[11px] uppercase tracking-[0.4em] text-gold">Admin</p>
      <h1 className="font-display text-4xl mt-3">
        {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-10 space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-input/40 border border-border px-3 py-2.5 outline-none focus:border-gold" />
        </div>
        {mode !== "forgot" && (
          <div>
            <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input/40 border border-border px-3 py-2.5 outline-none focus:border-gold" />
          </div>
        )}
        <button disabled={loading} className="w-full bg-gold text-primary-foreground py-3 text-sm tracking-wide hover:bg-gold-muted transition disabled:opacity-50">
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset email"}
        </button>
      </form>

      <div className="mt-6 flex justify-between text-xs text-muted-foreground">
        {mode === "signin" ? (
          <>
            <button onClick={() => setMode("signup")} className="hover:text-gold">Create account</button>
            <button onClick={() => setMode("forgot")} className="hover:text-gold">Forgot password?</button>
          </>
        ) : (
          <button onClick={() => setMode("signin")} className="hover:text-gold">← Back to sign in</button>
        )}
      </div>

      <Link to="/" className="block mt-10 text-center text-xs text-muted-foreground hover:text-gold">Return to site</Link>
    </div>
  );
}
