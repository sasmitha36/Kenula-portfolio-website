import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteContent } from "@/lib/site.functions";
import { saveSiteContent } from "@/lib/admin.functions";
import { uploadToMedia } from "@/lib/upload";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/site")({ component: SiteEditor });

const KEYS = [
  { key: "home", title: "Homepage", fields: [
    { name: "hero_image", label: "Hero image", type: "image" },
    { name: "name", label: "Name", type: "text" },
    { name: "roles", label: "Roles (one line)", type: "text" },
    { name: "bio", label: "Biography", type: "textarea" },
    { name: "acting_card_image", label: "Acting card image", type: "image" },
    { name: "photography_card_image", label: "Photography card image", type: "image" },
  ]},
  { key: "acting_about", title: "Acting — About", fields: [
    { name: "hero_image", label: "Hero image", type: "image" },
    { name: "bio", label: "Biography", type: "textarea" },
  ]},
  { key: "photography_about", title: "Photography — About", fields: [
    { name: "hero_image", label: "Hero image", type: "image" },
    { name: "bio", label: "Biography", type: "textarea" },
  ]},
  { key: "acting_profile", title: "Acting — Profile (Photos & CV)", fields: [
    { name: "photos", label: "Profile photos", type: "images" },
    { name: "resume_url", label: "Resume / CV (upload PDF or paste URL)", type: "file" },
  ]},
  { key: "contact", title: "Contact", fields: [
    { name: "email", label: "Email", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "whatsapp", label: "WhatsApp number (digits only, with country code)", type: "text" },
  ]},
  { key: "socials", title: "Social Links", fields: [
    { name: "instagram", label: "Instagram URL", type: "text" },
    { name: "facebook", label: "Facebook URL", type: "text" },
    { name: "linkedin", label: "LinkedIn URL", type: "text" },
    { name: "tiktok", label: "TikTok URL", type: "text" },
    { name: "imdb", label: "IMDb URL", type: "text" },
  ]},
] as const;

function SiteEditor() {
  return (
    <div className="space-y-12">
      {KEYS.map((g) => <KeyEditor key={g.key} group={g as any} />)}
    </div>
  );
}

function KeyEditor({ group }: { group: { key: string; title: string; fields: Array<{ name: string; label: string; type: string }> } }) {
  const get = useServerFn(getSiteContent);
  const save = useServerFn(saveSiteContent);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["site_content", group.key], queryFn: () => get({ data: { key: group.key } }) });
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => { if (data) setForm(((data as any).value || {}) as Record<string, any>); }, [data]);

  const mut = useMutation({
    mutationFn: () => save({ data: { key: group.key, value: form } }),
    onSuccess: () => { toast.success(`${group.title} saved`); qc.invalidateQueries({ queryKey: ["site_content", group.key] }); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  async function onUpload(name: string, file: File) {
    try {
      const { signedUrl } = await uploadToMedia(file, `site/${group.key}`);
      setForm((f) => ({ ...f, [name]: signedUrl }));
      toast.success("Uploaded. Click Save to apply.");
    } catch (e: any) { toast.error(e?.message || "Upload failed"); }
  }

  async function onUploadMany(name: string, files: FileList) {
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const { signedUrl } = await uploadToMedia(file, `site/${group.key}`);
        uploaded.push(signedUrl);
      }
      setForm((f) => ({ ...f, [name]: [...(Array.isArray(f[name]) ? f[name] : []), ...uploaded] }));
      toast.success(`${uploaded.length} uploaded. Click Save to apply.`);
    } catch (e: any) { toast.error(e?.message || "Upload failed"); }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <section className="border border-border/60 p-6">
      <h2 className="font-display text-2xl mb-6">{group.title}</h2>
      <div className="space-y-5">
        {group.fields.map((f) => (
          <div key={f.name}>
            <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{f.label}</label>
            {f.type === "textarea" ? (
              <textarea rows={6} value={form[f.name] || ""} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                className="w-full bg-input/40 border border-border px-3 py-2.5 outline-none focus:border-gold resize-y" />
            ) : f.type === "image" ? (
              <div className="flex items-center gap-4">
                {form[f.name] && <img src={form[f.name]} alt="" className="h-20 w-20 object-cover border border-border" />}
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUpload(f.name, e.target.files[0])}
                  className="text-sm file:mr-3 file:px-3 file:py-2 file:bg-gold file:text-primary-foreground file:border-0 file:cursor-pointer" />
                {form[f.name] && (
                  <button type="button" onClick={() => setForm((s) => ({ ...s, [f.name]: "" }))} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
                )}
              </div>
            ) : f.type === "images" ? (
              <div className="space-y-3">
                {Array.isArray(form[f.name]) && form[f.name].length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {(form[f.name] as string[]).map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt="" className="w-full aspect-square object-cover border border-border" />
                        <button type="button"
                          onClick={() => setForm((s) => ({ ...s, [f.name]: (s[f.name] as string[]).filter((_, idx) => idx !== i) }))}
                          className="absolute top-1 right-1 bg-background/90 text-destructive text-xs px-1.5 py-0.5 opacity-0 group-hover:opacity-100">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && onUploadMany(f.name, e.target.files)}
                  className="text-sm file:mr-3 file:px-3 file:py-2 file:bg-gold file:text-primary-foreground file:border-0 file:cursor-pointer" />
              </div>
            ) : f.type === "file" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input type="file" onChange={(e) => e.target.files?.[0] && onUpload(f.name, e.target.files[0])}
                    className="text-sm file:mr-3 file:px-3 file:py-2 file:bg-gold file:text-primary-foreground file:border-0 file:cursor-pointer" />
                  {form[f.name] && (
                    <>
                      <a href={form[f.name]} target="_blank" rel="noreferrer" className="text-xs text-gold underline">View current</a>
                      <button type="button" onClick={() => setForm((s) => ({ ...s, [f.name]: "" }))} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
                    </>
                  )}
                </div>
                <input value={form[f.name] || ""} placeholder="or paste a URL"
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                  className="w-full bg-input/40 border border-border px-3 py-2.5 outline-none focus:border-gold text-sm" />
              </div>
            ) : (
              <input value={form[f.name] || ""} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                className="w-full bg-input/40 border border-border px-3 py-2.5 outline-none focus:border-gold" />
            )}
          </div>
        ))}
        <button disabled={mut.isPending} onClick={() => mut.mutate()}
          className="bg-gold text-primary-foreground px-6 py-2.5 text-sm tracking-wide hover:bg-gold-muted transition disabled:opacity-50">
          {mut.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </section>
  );
}
