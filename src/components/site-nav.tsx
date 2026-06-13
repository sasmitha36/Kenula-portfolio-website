import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

// Top navigation — appears on every page
const LINKS = [
  { to: "/", label: "Home" },
  { to: "/acting", label: "Acting" },
  { to: "/photography", label: "Photography" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-lg tracking-wide">
          Kenula <span className="text-gold">Pathirathna</span>
        </Link>
        <nav className="hidden md:flex items-center gap-10">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[13px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold transition"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button className="md:hidden text-foreground" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <nav className="px-5 py-4 flex flex-col gap-4">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
                activeProps={{ className: "text-gold" }}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
