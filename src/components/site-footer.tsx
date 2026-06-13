import { SocialLinks } from "./social-links";

// Site-wide footer
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="font-display text-base tracking-wide">
          Kenula <span className="text-gold">Pathirathna</span>
        </div>
        <SocialLinks />
        <p className="text-xs text-muted-foreground tracking-wide">
          © {new Date().getFullYear()} Kenula Pathirathna. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
