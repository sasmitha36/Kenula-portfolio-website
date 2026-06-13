import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { amIAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const fn = useServerFn(amIAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "me"], queryFn: () => fn() });

  if (isLoading) return <p className="text-muted-foreground text-sm">Checking access…</p>;
  if (!data?.isAdmin) {
    return (
      <div className="border border-destructive/40 p-6">
        <p className="text-sm">Your account is signed in but is not an admin. The first account that signs up is automatically made the admin.</p>
      </div>
    );
  }

  const cards = [
    { to: "/admin/site", title: "Edit Site", body: "Hero image, biographies, contact details, social links and acting profile." },
    { to: "/admin/projects", title: "Projects", body: "Short films, commercials, theatre and dance productions." },
    { to: "/admin/media", title: "Media Library", body: "Upload images and videos. Manage all uploaded files." },
  ] as const;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {cards.map((c) => (
        <Link key={c.to} to={c.to} className="block border border-border/60 hover:border-gold/60 p-6 transition">
          <h3 className="font-display text-2xl">{c.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
        </Link>
      ))}
    </div>
  );
}
