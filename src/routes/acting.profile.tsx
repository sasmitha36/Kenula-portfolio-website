import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteContent } from "@/lib/site.functions";
import { Download } from "lucide-react";

// Acting Profile — photo gallery + CV download
export const Route = createFileRoute("/acting/profile")({
  loader: async ({ context }) => {
    const fn = (await import("@/lib/site.functions")).getSiteContent;
    await context.queryClient.ensureQueryData({
      queryKey: ["site_content", "acting_profile"],
      queryFn: () => fn({ data: { key: "acting_profile" } }),
    });
  },
  component: ProfilePage,
});

function ProfilePage() {
  const fn = useServerFn(getSiteContent);
  const { data } = useSuspenseQuery({
    queryKey: ["site_content", "acting_profile"],
    queryFn: () => fn({ data: { key: "acting_profile" } }),
  });
  const v = (data?.value ?? {}) as Record<string, any>;
  const photos: string[] = Array.isArray(v.photos) ? v.photos.filter(Boolean) : [];
  const resumeUrl: string = v.resume_url || "";

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-16">
      <p className="text-[11px] uppercase tracking-[0.4em] text-gold">Profile</p>
      <h1 className="font-display text-5xl md:text-6xl mt-3">Portfolio</h1>

      {photos.length === 0 && !resumeUrl ? (
        <p className="mt-12 text-muted-foreground">Photos and CV will appear here once added in the admin panel.</p>
      ) : (
        <>
          {photos.length > 0 && (
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {photos.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer" className="block group overflow-hidden bg-muted/20">
                  <img src={src} alt={`Profile photo ${i + 1}`} loading="lazy"
                    className="w-full h-full object-cover aspect-[3/4] transition-transform duration-500 group-hover:scale-105" />
                </a>
              ))}
            </div>
          )}

          {resumeUrl && (
            <a href={resumeUrl} target="_blank" rel="noreferrer"
               className="mt-12 inline-flex items-center gap-2 border border-gold/40 text-gold px-6 py-3 text-sm tracking-wide hover:bg-gold hover:text-primary-foreground transition">
              <Download size={16} /> Download Resume / CV
            </a>
          )}
        </>
      )}
    </div>
  );
}
