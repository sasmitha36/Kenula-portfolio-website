import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SubNav } from "@/components/section-shell";

// Acting section layout — sub-nav + outlet
const ITEMS = [
  { to: "/", label: "About" },
  { to: "/short-films", label: "Short Films" },
  { to: "/commercials", label: "Commercials" },
  { to: "/theatre", label: "Theatre" },
  { to: "/dancing", label: "Dancing" },
  { to: "/profile", label: "Profile" },
];

export const Route = createFileRoute("/acting")({
  head: () => ({ meta: [
    { title: "Acting — Kenula Pathirathna" },
    { name: "description", content: "Theatre, dance theatre, short films and commercials by Sri Lankan actor Kenula Pathirathna." },
    { property: "og:title", content: "Acting — Kenula Pathirathna" },
    { property: "og:description", content: "Theatre, dance theatre, short films and commercials." },
  ]}),
  component: () => (
    <div>
      <SubNav base="/acting" items={ITEMS} />
      <Outlet />
    </div>
  ),
});
