import { Link } from "@tanstack/react-router";

// Sub-section nav used inside /acting and /photography
export function SubNav({ base, items }: { base: "/acting" | "/photography"; items: Array<{ to: string; label: string }> }) {
  return (
    <div className="border-b border-border/60">
      <div className="max-w-7xl mx-auto px-5 md:px-8 overflow-x-auto">
        <nav className="flex gap-8 py-5">
          {items.map((it) => {
            const fullTo = `${base}${it.to}` as any;
            return (
              <Link
                key={it.to}
                to={fullTo}
                activeOptions={{ exact: it.to === "/" || it.to === "" }}
                activeProps={{ className: "text-gold border-gold" }}
                className="text-[12px] uppercase tracking-[0.25em] whitespace-nowrap text-muted-foreground border-b border-transparent pb-1 hover:text-gold transition"
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function SectionHero({ eyebrow, title, image }: { eyebrow: string; title: string; image?: string | null }) {
  return (
    <section className="relative">
      {image ? (
        <div className="relative h-[40vh] md:h-[55vh] overflow-hidden">
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl w-full mx-auto px-5 md:px-8 pb-10">
              <p className="text-[11px] uppercase tracking-[0.4em] text-gold">{eyebrow}</p>
              <h1 className="font-display text-5xl md:text-7xl mt-3">{title}</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-16 pb-10">
          <p className="text-[11px] uppercase tracking-[0.4em] text-gold">{eyebrow}</p>
          <h1 className="font-display text-5xl md:text-7xl mt-3">{title}</h1>
        </div>
      )}
    </section>
  );
}

export function ProseBio({ bio }: { bio: string }) {
  if (!bio) return null;
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-20 space-y-5 text-[15px] leading-relaxed text-foreground/85">
      {bio.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}
