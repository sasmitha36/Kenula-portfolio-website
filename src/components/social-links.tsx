import { Instagram, Facebook, Linkedin, Film } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteContent } from "@/lib/site.functions";

// TikTok icon (lucide doesn't ship one)
function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V9.01a8.16 8.16 0 0 0 4.77 1.52V7.08a4.79 4.79 0 0 1-1.84-.39z"/>
    </svg>
  );
}

// Social media links section — URLs are managed via /admin/site
const DEFAULTS = {
  instagram: "https://www.instagram.com/kenula__/",
  facebook: "https://www.facebook.com/kenula.sathmithe",
  linkedin: "https://www.linkedin.com/in/kenula-pathirathna-a98981338/",
  tiktok: "https://www.tiktok.com/@kenulapathirathna",
  imdb: "https://www.imdb.com/name/nm18566234/",
};

export function SocialLinks({ size = "default" }: { size?: "default" | "lg" }) {
  const fn = useServerFn(getSiteContent);
  const { data } = useQuery({
    queryKey: ["site_content", "socials"],
    queryFn: () => fn({ data: { key: "socials" } }),
  });
  const s = { ...DEFAULTS, ...((data as any)?.value ?? {}) } as typeof DEFAULTS;
  const cls = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const items = [
    { href: s.instagram, label: "Instagram", icon: <Instagram size={size === "lg" ? 20 : 16} /> },
    { href: s.facebook, label: "Facebook", icon: <Facebook size={size === "lg" ? 20 : 16} /> },
    { href: s.linkedin, label: "LinkedIn", icon: <Linkedin size={size === "lg" ? 20 : 16} /> },
    { href: s.tiktok, label: "TikTok", icon: <TikTokIcon width={size === "lg" ? 20 : 16} height={size === "lg" ? 20 : 16} /> },
    { href: s.imdb, label: "IMDb", icon: <Film size={size === "lg" ? 20 : 16} /> },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map((it) => (
        <a key={it.label} href={it.href} target="_blank" rel="noreferrer noopener"
           aria-label={it.label}
           className={`${cls} grid place-items-center border border-border rounded-full text-muted-foreground hover:text-gold hover:border-gold transition`}>
          {it.icon}
        </a>
      ))}
    </div>
  );
}
