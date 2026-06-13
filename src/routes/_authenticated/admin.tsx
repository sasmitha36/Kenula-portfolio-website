import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Admin shell layout
export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminShell,
});

function AdminShell() {
  const nav = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/auth", replace: true });
  }
  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-gold">Admin</p>
          <h1 className="font-display text-3xl mt-2">Dashboard</h1>
        </div>
        <button onClick={signOut} className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">Sign out</button>
      </div>
      <nav className="flex flex-wrap gap-6 border-b border-border/60 pb-3 mb-8 text-[12px] uppercase tracking-[0.25em]">
        <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: "text-gold" }} className="text-muted-foreground hover:text-gold">Overview</Link>
        <Link to="/admin/site" activeProps={{ className: "text-gold" }} className="text-muted-foreground hover:text-gold">Edit Site</Link>
        <Link to="/admin/projects" activeProps={{ className: "text-gold" }} className="text-muted-foreground hover:text-gold">Projects</Link>
        <Link to="/admin/media" activeProps={{ className: "text-gold" }} className="text-muted-foreground hover:text-gold">Media Library</Link>
      </nav>
      <Outlet />
    </div>
  );
}
