import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListProjects, adminListCategories, saveProject, deleteProject, addMedia } from "@/lib/admin.functions";
import { uploadToMedia } from "@/lib/upload";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/projects")({ component: ProjectsAdmin });

function ProjectsAdmin() {
  const listFn = useServerFn(adminListProjects);
  const catsFn = useServerFn(adminListCategories);
  const saveFn = useServerFn(saveProject);
  const delFn = useServerFn(deleteProject);
  const qc = useQueryClient();
  const { data: projects = [] } = useQuery({ queryKey: ["admin", "projects"], queryFn: () => listFn() });
  const { data: cats = [] } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => catsFn() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  function startNew() { setEditing({ title: "", slug: "", category_id: cats[0]?.id, description: "", cover_url: "", year: "", awards: "", external_url: "", featured: false, published: true }); setOpen(true); }
  function startEdit(p: any) { setEditing({ ...p }); setOpen(true); }

  const saveMut = useMutation({
    mutationFn: (v: any) => saveFn({ data: v }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin", "projects"] }); setOpen(false); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "projects"] }); },
  });

  async function onCoverUpload(file: File) {
    try { const { signedUrl, path } = await uploadToMedia(file, "covers"); setEditing((e: any) => ({ ...e, cover_url: signedUrl, _cover_path: path })); }
    catch (e: any) { toast.error(e?.message || "Upload failed"); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl">All projects</h2>
        <button onClick={startNew} className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-5 py-2.5 text-sm hover:bg-gold-muted">
          <Plus size={16}/> New project
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p: any) => (
          <div key={p.id} className="border border-border/60 p-4">
            <div className="flex gap-3">
              <div className="h-16 w-16 bg-card overflow-hidden shrink-0">
                {p.cover_url ? <img src={p.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="grid place-items-center h-full text-muted-foreground"><ImageIcon size={16}/></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg truncate">{p.title}</p>
                <p className="text-[11px] uppercase tracking-widest text-gold">{p.categories?.kind} · {p.categories?.name}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <button onClick={() => startEdit(p)} className="border border-border px-3 py-1 hover:border-gold">Edit</button>
              <button onClick={() => confirm("Delete this project?") && delMut.mutate(p.id)} className="text-destructive hover:underline inline-flex items-center gap-1"><Trash2 size={12}/> Delete</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
      </div>

      {open && editing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm grid place-items-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl p-6 my-10">
            <h3 className="font-display text-2xl mb-6">{editing.id ? "Edit project" : "New project"}</h3>
            <div className="space-y-4 text-sm">
              <Row label="Title"><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} className="w-full bg-input/40 border border-border px-3 py-2"/></Row>
              <Row label="Slug (URL)"><input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="w-full bg-input/40 border border-border px-3 py-2"/></Row>
              <Row label="Category">
                <select value={editing.category_id} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })} className="w-full bg-input/40 border border-border px-3 py-2">
                  {cats.map((c: any) => <option key={c.id} value={c.id}>{c.kind} — {c.name}</option>)}
                </select>
              </Row>
              <Row label="Year"><input value={editing.year || ""} onChange={(e) => setEditing({ ...editing, year: e.target.value })} className="w-full bg-input/40 border border-border px-3 py-2"/></Row>
              <Row label="Awards"><input value={editing.awards || ""} onChange={(e) => setEditing({ ...editing, awards: e.target.value })} className="w-full bg-input/40 border border-border px-3 py-2"/></Row>
              <Row label="Full video / external link (YouTube, Vimeo, article URL)"><input type="url" placeholder="https://youtube.com/watch?v=..." value={editing.external_url || ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} className="w-full bg-input/40 border border-border px-3 py-2"/></Row>
              <Row label="Description"><textarea rows={5} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full bg-input/40 border border-border px-3 py-2 resize-y"/></Row>
              <Row label="Cover image">
                <div className="flex items-center gap-3">
                  {editing.cover_url && <img src={editing.cover_url} className="h-16 w-16 object-cover border border-border" />}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onCoverUpload(e.target.files[0])} className="text-sm" />
                </div>
              </Row>
              <Row label="Options">
                <label className="inline-flex items-center gap-2 mr-4"><input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}/> Featured</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editing.published !== false} onChange={(e) => setEditing({ ...editing, published: e.target.checked })}/> Published</label>
              </Row>
              {editing.id && <MediaUploader projectId={editing.id} />}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm border border-border">Cancel</button>
              <button disabled={saveMut.isPending} onClick={() => { const { _cover_path, categories, created_at, ...rest } = editing; saveMut.mutate(rest); }} className="bg-gold text-primary-foreground px-5 py-2 text-sm hover:bg-gold-muted disabled:opacity-50">
                {saveMut.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{label}</label>
      {children}
    </div>
  );
}

function MediaUploader({ projectId }: { projectId: string }) {
  const add = useServerFn(addMedia);
  const [busy, setBusy] = useState(false);
  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const { path, signedUrl } = await uploadToMedia(file, `projects/${projectId}`);
        await add({ data: { project_id: projectId, kind: isVideo ? "video" : "image", url: signedUrl, storage_path: path } });
      }
      toast.success("Media added");
    } catch (e: any) { toast.error(e?.message || "Upload failed"); }
    finally { setBusy(false); }
  }
  return (
    <div className="border-t border-border/60 pt-4">
      <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Add photos / videos to this project</label>
      <input type="file" multiple accept="image/*,video/*" disabled={busy} onChange={(e) => handle(e.target.files)} className="text-sm" />
      {busy && <p className="text-xs text-muted-foreground mt-2">Uploading…</p>}
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
