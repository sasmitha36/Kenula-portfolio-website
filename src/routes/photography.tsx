import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SubNav } from "@/components/section-shell";

// Photography section layout
const ITEMS = [
  { to: "/", label: "About" },
  { to: "/art", label: "Art" },
  { to: "/journalism", label: "Journalism" },
  { to: "/portraits", label: "Portraits" },
  { to: "/sports", label: "Sports" },
  { to: "/others", label: "Others" },
];

export const Route = createFileRoute("/photography")({
  head: () => ({ meta: [
    { title: "Photography — Kenula Pathirathna" },
    { name: "description", content: "Photojournalism, art, portraits, sports and more by Sri Lankan photographer Kenula Pathirathna." },
    { property: "og:title", content: "Photography — Kenula Pathirathna" },
    { property: "og:description", content: "Photojournalism, art, portraits, sports." },
  ]}),
  component: () => (
    <div>
      <SubNav base="/photography" items={ITEMS} />
      <Outlet />
    </div>
  ),
});
