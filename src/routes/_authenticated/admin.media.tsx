import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListMedia, adminListCategories, addMedia, deleteMedia, updateMedia } from "@/lib/admin.functions";
import { uploadToMedia } from "@/lib/upload";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Link as LinkIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/media")({ component: MediaLibrary });

function MediaLibrary() {
  const listFn = useServerFn(adminListMedia);
  const catsFn = useServerFn(adminListCategories);
  const addFn = useServerFn(addMedia);
  const delFn = useServerFn(deleteMedia);
  const updateFn = useServerFn(updateMedia);
  const qc = useQueryClient();

  const { data: media = [] } = useQuery({ queryKey: ["admin", "media"], queryFn: () => listFn() });
  const { data: cats = [] } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => catsFn() });
  const photoCats = (cats as any[]).filter((c) => c.kind === "photography");

  const [catId, setCatId] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  async function onUpload(files: FileList | null) {
    if (!files?.length || !catId) return toast.error("Pick a photography category first");
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const { path, signedUrl } = await uploadToMedia(file, `category/${catId}`);
        await addFn({ data: { category_id: catId, kind: isVideo ? "video" : "image", url: signedUrl, storage_path: path, caption: caption || null } });
      }
      toast.success("Uploaded");
      setCaption("");
      qc.invalidateQueries({ queryKey: ["admin", "media"] });
    } catch (e: any) { toast.error(e?.message || "Upload failed"); }
    finally { setBusy(false); }
  }

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "media"] }); },
  });

  return (
    <div>
      <section className="border border-border/60 p-6 mb-8">
        <h2 className="font-display text-2xl mb-4">Upload to a photography gallery</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <select value={catId} onChange={(e) => setCatId(e.target.value)} className="bg-input/40 border border-border px-3 py-2.5">
            <option value="">— Select gallery —</option>
            {photoCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} className="bg-input/40 border border-border px-3 py-2.5" />
          <input type="file" multiple accept="image/*,video/*" disabled={busy || !catId} onChange={(e) => onUpload(e.target.files)} className="text-sm self-center" />
        </div>
        {busy && <p className="mt-3 text-xs text-muted-foreground">Uploading…</p>}
      </section>

      <h2 className="font-display text-2xl mb-4">All uploads</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {(media as any[]).map((m) => (
          <div key={m.id} className="relative group border border-border/40">
            {m.kind === "image" ? (
              <img src={m.url} alt={m.caption || ""} className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square bg-card grid place-items-center text-xs uppercase tracking-widest text-muted-foreground">{m.kind}</div>
            )}
            {m.external_url && (
              <span className="absolute bottom-1 left-1 bg-gold/90 text-primary-foreground text-[10px] px-1.5 py-0.5 uppercase tracking-widest">link</span>
            )}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
              <button
                title="Attach / edit link"
                onClick={async () => {
                  const url = window.prompt("External link URL (leave blank to remove):", m.external_url || "");
                  if (url === null) return;
                  try {
                    await updateFn({ data: { id: m.id, external_url: url || null } });
                    toast.success("Link saved");
                    qc.invalidateQueries({ queryKey: ["admin", "media"] });
                  } catch (e: any) { toast.error(e?.message || "Failed"); }
                }}
                className="bg-background/80 p-1.5 hover:text-gold"><LinkIcon size={14}/></button>
              <button onClick={() => confirm("Delete this file?") && delMut.mutate(m.id)}
                className="bg-background/80 p-1.5 hover:text-destructive"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
        {(media as any[]).length === 0 && <p className="text-sm text-muted-foreground col-span-full">No files yet.</p>}
      </div>
    </div>
  );
}
