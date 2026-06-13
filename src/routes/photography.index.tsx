import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteContent } from "@/lib/site.functions";
import { SectionHero, ProseBio } from "@/components/section-shell";

export const Route = createFileRoute("/photography/")({
  loader: async ({ context }) => {
    const fn = (await import("@/lib/site.functions")).getSiteContent;
    await context.queryClient.ensureQueryData({
      queryKey: ["site_content", "photography_about"],
      queryFn: () => fn({ data: { key: "photography_about" } }),
    });
  },
  component: PhotoAbout,
});

function PhotoAbout() {
  const fn = useServerFn(getSiteContent);
  const { data } = useSuspenseQuery({
    queryKey: ["site_content", "photography_about"],
    queryFn: () => fn({ data: { key: "photography_about" } }),
  });
  const v = (data?.value ?? {}) as Record<string, string>;
  return (
    <>
      {/* Photography section hero image — set via /admin/site → photography_about.hero_image */}
      <SectionHero eyebrow="The Photographer" title="Stories through the lens." image={v.hero_image || null} />
      <ProseBio bio={v.bio || ""} />
    </>
  );
}
