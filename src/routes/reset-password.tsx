import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Password reset destination — Supabase redirects here from the recovery email
export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password" }, { name: "robots", content: "noindex" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      nav({ to: "/admin" });
    } catch (err: any) {
      toast.error(err?.message || "Could not update password");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto px-5 md:px-8 py-20">
      <h1 className="font-display text-4xl">Set a new password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full bg-input/40 border border-border px-3 py-2.5 outline-none focus:border-gold" />
        <button disabled={loading} className="w-full bg-gold text-primary-foreground py-3 text-sm tracking-wide hover:bg-gold-muted transition disabled:opacity-50">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
