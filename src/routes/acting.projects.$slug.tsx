import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProject } from "@/lib/site.functions";
import { ChevronLeft, PlayCircle, ExternalLink } from "lucide-react";

// Project / Short film / Commercial detail page
export const Route = createFileRoute("/acting/projects/$slug")({
  loader: async ({ context, params }) => {
    const fn = (await import("@/lib/site.functions")).getProject;
    const res = await fn({ data: { kind: "acting", slug: params.slug } });
    if (!res.project) throw notFound();
    context.queryClient.setQueryData(["project", "acting", params.slug], res);
  },
  head: ({ loaderData }) => {
    const title = (loaderData as any)?.project?.title || "Project";
    return { meta: [
      { title: `${title} — Kenula Pathirathna` },
      { name: "description", content: (loaderData as any)?.project?.description?.slice(0, 160) || "" },
    ]};
  },
  component: ProjectPage,
});

function ProjectPage() {
  const { slug } = Route.useParams();
  const fn = useServerFn(getProject);
  const { data } = useSuspenseQuery({
    queryKey: ["project", "acting", slug],
    queryFn: () => fn({ data: { kind: "acting", slug } }),
  });
  const p = data.project!;
  const media = data.media;

  return (
    <article>
      {p.cover_url ? (
        <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
          <img src={p.cover_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-5xl w-full mx-auto px-5 md:px-8 pb-12">
              <Link to="/acting" className="inline-flex items-center gap-1 text-xs text-gold uppercase tracking-widest mb-4"><ChevronLeft size={14}/> Back to Acting</Link>
              <h1 className="font-display text-5xl md:text-7xl">{p.title}</h1>
              {p.year && <p className="mt-3 text-sm uppercase tracking-[0.3em] text-muted-foreground">{p.year}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-5 md:px-8 pt-16">
          <Link to="/acting" className="inline-flex items-center gap-1 text-xs text-gold uppercase tracking-widest mb-4"><ChevronLeft size={14}/> Back to Acting</Link>
          <h1 className="font-display text-5xl md:text-7xl">{p.title}</h1>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-5 md:px-8 py-12">
        {p.awards && (
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-gold">{p.awards}</p>
        )}
        {(p as any).external_url && (
          <a href={(p as any).external_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-6 py-3 text-sm uppercase tracking-[0.25em] hover:bg-gold-muted transition mb-8">
            <PlayCircle size={18}/> Watch full video <ExternalLink size={14} className="opacity-70"/>
          </a>
        )}
        {p.description && (
          <div className="space-y-4 text-[15px] leading-relaxed text-foreground/85">
            {p.description.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
          </div>
        )}
      </div>

      {media.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 md:px-8 pb-20 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {media.map((m: any) => (
            <figure key={m.id} className="bg-card overflow-hidden">
              {m.kind === "image" ? (
                <img src={m.url} alt={m.caption || ""} loading="lazy" className="w-full h-full object-cover aspect-[4/5]" />
              ) : m.kind === "video" ? (
                <video src={m.url} controls className="w-full aspect-video bg-black" />
              ) : m.kind === "youtube" ? (
                <iframe className="w-full aspect-video" src={m.url.replace("watch?v=", "embed/")} title="" allowFullScreen />
              ) : (
                <iframe className="w-full aspect-video" src={m.url} title="" allowFullScreen />
              )}
              {m.caption && <figcaption className="px-3 py-2 text-xs text-muted-foreground">{m.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </article>
  );
}
