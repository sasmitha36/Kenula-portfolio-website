import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteContent } from "@/lib/site.functions";
import { SectionHero, ProseBio } from "@/components/section-shell";

// Acting About — driven by site_content "acting_about"
export const Route = createFileRoute("/acting/")({
  loader: async ({ context }) => {
    const fn = (await import("@/lib/site.functions")).getSiteContent;
    await context.queryClient.ensureQueryData({
      queryKey: ["site_content", "acting_about"],
      queryFn: () => fn({ data: { key: "acting_about" } }),
    });
  },
  component: ActingAbout,
});

function ActingAbout() {
  const fn = useServerFn(getSiteContent);
  const { data } = useSuspenseQuery({
    queryKey: ["site_content", "acting_about"],
    queryFn: () => fn({ data: { key: "acting_about" } }),
  });
  const v = (data?.value ?? {}) as Record<string, string>;
  return (
    <>
      {/* Acting section featured image — set via /admin/site → acting_about.hero_image */}
      <SectionHero eyebrow="The Actor" title="On stage. On screen." image={v.hero_image || null} />
      <ProseBio bio={v.bio || ""} />
    </>
  );
}
