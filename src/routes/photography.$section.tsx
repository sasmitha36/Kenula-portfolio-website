import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCategoryMedia } from "@/lib/site.functions";

// Photography gallery for a category (art, journalism, portraits, sports, others)
const ALLOWED = ["art", "journalism", "portraits", "sports", "others"] as const;

const HEADINGS: Record<string, { eyebrow: string; title: string; description: string }> = {
  art: { eyebrow: "Creative", title: "Art Photography", description: "Personal visual experiments and creative compositions." },
  journalism: { eyebrow: "Documentary", title: "Photojournalism", description: "Published work documenting Sri Lanka and beyond." },
  portraits: { eyebrow: "People", title: "Portraits", description: "Faces, presence, and quiet moments." },
  sports: { eyebrow: "Action", title: "Sports", description: "Dynamic sporting moments — action, timing, atmosphere." },
  others: { eyebrow: "Misc.", title: "Others", description: "A selection that doesn't fit elsewhere." },
};

export const Route = createFileRoute("/photography/$section")({
  beforeLoad: ({ params }) => {
    if (!ALLOWED.includes(params.section as any)) throw notFound();
  },
  loader: async ({ context, params }) => {
    const fn = (await import("@/lib/site.functions")).listCategoryMedia;
    await context.queryClient.ensureQueryData({
      queryKey: ["category_media", "photography", params.section],
      queryFn: () => fn({ data: { kind: "photography", slug: params.section } }),
    });
  },
  head: ({ params }) => {
    const h = HEADINGS[params.section] || { title: params.section, eyebrow: "Photography", description: "" };
    return { meta: [
      { title: `${h.title} — Kenula Pathirathna` },
      { name: "description", content: h.description },
    ]};
  },
  component: GalleryPage,
});

function GalleryPage() {
  const { section } = Route.useParams();
  const fn = useServerFn(listCategoryMedia);
  const { data } = useSuspenseQuery({
    queryKey: ["category_media", "photography", section],
    queryFn: () => fn({ data: { kind: "photography", slug: section } }),
  });
  const h = HEADINGS[section];
  const media = data.media;

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-16">
      <p className="text-[11px] uppercase tracking-[0.4em] text-gold">{h.eyebrow}</p>
      <h1 className="font-display text-5xl md:text-6xl mt-3">{h.title}</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">{h.description}</p>

      {/* Add {section} photos via /admin/media */}
      {media.length === 0 ? (
        <div className="mt-20 border border-dashed border-border/60 py-20 text-center text-muted-foreground text-sm">
          New work coming soon.
        </div>
      ) : (
        <div className="mt-12 columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {media.map((m: any) => {
            const inner = (
              <>
                <img src={m.url} alt={m.caption || ""} loading="lazy"
                  className="w-full h-auto block hover:opacity-90 transition" />
                {m.caption && <figcaption className="px-3 py-2 text-xs text-muted-foreground">{m.caption}</figcaption>}
              </>
            );
            return (
              <figure key={m.id} className="break-inside-avoid bg-card overflow-hidden">
                {m.external_url ? (
                  <a href={m.external_url} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>
                ) : inner}
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
