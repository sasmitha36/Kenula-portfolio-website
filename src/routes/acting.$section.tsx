import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProjects } from "@/lib/site.functions";

// Generic Acting sub-section page (short-films, commercials, theatre, dancing)
const ALLOWED = ["short-films", "commercials", "theatre", "dancing"] as const;

const HEADINGS: Record<string, { eyebrow: string; title: string; description: string }> = {
  "short-films": { eyebrow: "Cinema", title: "Short Films", description: "Selected screen work — explored across cinematic forms of storytelling." },
  "commercials": { eyebrow: "Brands", title: "Commercials", description: "On-screen brand work and campaigns." },
  "theatre": { eyebrow: "Stage", title: "Theatre", description: "Live productions, ensembles and stagecraft." },
  "dancing": { eyebrow: "Movement", title: "Dancing", description: "Dance theatre, traditional and contemporary performance." },
};

export const Route = createFileRoute("/acting/$section")({
  beforeLoad: ({ params }) => {
    if (!ALLOWED.includes(params.section as any)) throw notFound();
  },
  loader: async ({ context, params }) => {
    const fn = (await import("@/lib/site.functions")).listProjects;
    await context.queryClient.ensureQueryData({
      queryKey: ["projects", "acting", params.section],
      queryFn: () => fn({ data: { kind: "acting", slug: params.section } }),
    });
  },
  head: ({ params }) => {
    const h = HEADINGS[params.section] || { title: params.section, eyebrow: "Acting", description: "" };
    return { meta: [
      { title: `${h.title} — Kenula Pathirathna` },
      { name: "description", content: h.description },
    ]};
  },
  component: ActingSection,
});

function ActingSection() {
  const { section } = Route.useParams();
  const fn = useServerFn(listProjects);
  const { data } = useSuspenseQuery({
    queryKey: ["projects", "acting", section],
    queryFn: () => fn({ data: { kind: "acting", slug: section } }),
  });
  const h = HEADINGS[section];
  const projects = data.projects;

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-16">
      <p className="text-[11px] uppercase tracking-[0.4em] text-gold">{h.eyebrow}</p>
      <h1 className="font-display text-5xl md:text-6xl mt-3">{h.title}</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">{h.description}</p>

      {projects.length === 0 ? (
        <div className="mt-20 border border-dashed border-border/60 py-20 text-center text-muted-foreground text-sm">
          New projects will appear here soon.
        </div>
      ) : (
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Link key={p.id} to="/acting/projects/$slug" params={{ slug: p.slug }}
              className="group block border border-border/40 hover:border-gold/60 transition">
              <div className="aspect-[4/5] overflow-hidden bg-card">
                {p.cover_url ? (
                  <img src={p.cover_url} alt={p.title} loading="lazy"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground text-xs uppercase tracking-widest">No cover yet</div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl">{p.title}</h3>
                  {p.year && <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{p.year}</span>}
                </div>
                {p.awards && <p className="mt-2 text-[11px] uppercase tracking-widest text-gold">{p.awards}</p>}
                {p.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{p.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
