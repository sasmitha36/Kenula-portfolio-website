import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteContent } from "@/lib/site.functions";
import { SocialLinks } from "@/components/social-links";
import { ChevronRight } from "lucide-react";
import heroPortrait from "@/assets/hero-portrait.jpg";
import actingCard from "@/assets/acting-card.jpg";
import photoCard from "@/assets/photography-card.jpg";

// =====================================================================
// HOMEPAGE — Hero, biography, dual portfolio cards, social section
// To update the hero image, biography, or other text on this page,
// go to /admin → Edit Site. Defaults below are used when admin fields are empty.
// =====================================================================

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kenula Pathirathna — Sri Lankan Actor, Dancer & Photographer" },
      { name: "description", content: "Official portfolio of Kenula Sathmitha Pathirathna — actor, professional dancer, percussionist, photographer and photojournalist." },
    ],
  }),
  loader: async ({ context }) => {
    const fn = (await import("@/lib/site.functions")).getSiteContent;
    await context.queryClient.ensureQueryData({
      queryKey: ["site_content", "home"],
      queryFn: () => fn({ data: { key: "home" } }),
    });
  },
  component: HomePage,
});

function HomePage() {
  const fn = useServerFn(getSiteContent);
  const { data } = useSuspenseQuery({
    queryKey: ["site_content", "home"],
    queryFn: () => fn({ data: { key: "home" } }),
  });
  const v = (data?.value ?? {}) as Record<string, string>;

  // Fallback to bundled images & default copy if admin hasn't set values
  const heroImage = v.hero_image || heroPortrait;          // Replace homepage hero image via /admin/site
  const actingImage = v.acting_card_image || actingCard;
  const photographyImage = v.photography_card_image || photoCard;
  const name = v.name || "Kenula Sathmitha Pathirathna";
  const roles = v.roles || "Actor • Professional Dancer • Percussionist • Photographer • Photojournalist";
  const bio = v.bio || "";

  return (
    <>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-20 grid md:grid-cols-12 gap-10 md:gap-14 items-center">
        <div className="md:col-span-5 order-1">
          <div className="aspect-[4/5] overflow-hidden bg-card">
            <img src={heroImage} alt={name}
              width={1280} height={1600}
              className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition duration-700" />
          </div>
        </div>
        <div className="md:col-span-7 order-2">
          <p className="text-[11px] uppercase tracking-[0.45em] text-gold mb-6">PORTFOLIO ·</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.02]">{name}</h1>
          <p className="mt-6 text-sm md:text-base tracking-[0.18em] uppercase text-muted-foreground">{roles}</p>
          <div className="mt-10 max-w-2xl space-y-4 text-[15px] leading-relaxed text-foreground/85">
            {bio.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/acting" className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-7 py-3 text-sm tracking-wide hover:bg-gold-muted transition">
              View Acting <ChevronRight size={16} />
            </Link>
            <Link to="/photography" className="inline-flex items-center gap-2 border border-gold/40 text-gold px-7 py-3 text-sm tracking-wide hover:bg-gold hover:text-primary-foreground transition">
              View Photography
            </Link>
          </div>
        </div>
      </section>

      {/* Dual portfolio cards */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 border-t border-border/60">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-display text-3xl md:text-5xl">Two crafts. <span className="text-gold italic">One vision.</span></h2>
          <p className="hidden md:block text-xs uppercase tracking-[0.3em] text-muted-foreground">Select a portfolio</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <PortfolioCard
            to="/acting"
            label="01 — Stage & Screen"
            title="Acting"
            description="Theatre, dance theatre, short films and commercials — work shaped at the Somalatha Subasinghe Play House and beyond."
            image={actingImage}
          />
          <PortfolioCard
            to="/photography"
            label="02 — Through the Lens"
            title="Photography"
            description="Photojournalism for international press, stage production photography and creative art portraits."
            image={photographyImage}
          />
        </div>
      </section>

      {/* Social media section */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20 border-t border-border/60 text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-gold">Elsewhere</p>
        <h2 className="font-display text-3xl md:text-4xl mt-4">Follow the journey</h2>
        <div className="mt-8 flex justify-center"><SocialLinks size="lg" /></div>
      </section>
    </>
  );
}

function PortfolioCard({ to, label, title, description, image }: { to: "/acting" | "/photography"; label: string; title: string; description: string; image: string }) {
  return (
    <Link to={to} className="group relative block overflow-hidden bg-card aspect-[4/5] md:aspect-[3/4]">
      <img src={image} alt={title} loading="lazy"
        className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-105 transition duration-[1200ms] ease-out" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end">
        <p className="text-[11px] uppercase tracking-[0.4em] text-gold mb-3">{label}</p>
        <h3 className="font-display text-4xl md:text-6xl">{title}</h3>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">{description}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm text-gold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition">
          Enter <ChevronRight size={16} />
        </span>
      </div>
    </Link>
  );
}
