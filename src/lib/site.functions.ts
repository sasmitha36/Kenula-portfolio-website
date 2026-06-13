// Public, unauthenticated reads. Use supabaseAdmin (loaded inside handler)
// because public-route loaders run during SSR/prerender with no bearer.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public: read a single site_content row
export const getSiteContent = createServerFn({ method: "GET" })
  .inputValidator((d: { key: string }) => z.object({ key: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("site_content").select("key,value").eq("key", data.key).maybeSingle();
    return { key: data.key, value: (row?.value ?? {}) as Record<string, any> };
  });

// Public: list categories by kind
export const listCategories = createServerFn({ method: "GET" })
  .inputValidator((d: { kind: "acting" | "photography" }) => z.object({ kind: z.enum(["acting", "photography"]) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("categories").select("id,slug,kind,name,sort").eq("kind", data.kind).order("sort");
    return rows ?? [];
  });

// Public: list projects in a category (published only)
export const listProjects = createServerFn({ method: "GET" })
  .inputValidator((d: { kind: "acting" | "photography"; slug: string }) =>
    z.object({ kind: z.enum(["acting", "photography"]), slug: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cat } = await supabaseAdmin
      .from("categories").select("id,name,slug,kind").eq("kind", data.kind).eq("slug", data.slug).maybeSingle();
    if (!cat) return { category: null, projects: [] as Array<{ id: string; title: string; slug: string; description: string | null; cover_url: string | null; year: string | null; awards: string | null; featured: boolean; external_url: string | null }> };
    const { data: rows } = await supabaseAdmin
      .from("projects")
      .select("id,title,slug,description,cover_url,year,awards,featured,external_url")
      .eq("category_id", cat.id).eq("published", true)
      .order("featured", { ascending: false }).order("sort").order("created_at", { ascending: false });
    const projects = await signList(rows ?? [], "cover_url");
    return { category: cat, projects };
  });

// Public: project detail + media
export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: { kind: "acting" | "photography"; slug: string }) =>
    z.object({ kind: z.enum(["acting", "photography"]), slug: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cats } = await supabaseAdmin.from("categories").select("id,name,slug,kind").eq("kind", data.kind);
    const catIds = (cats ?? []).map((c) => c.id);
    const { data: p } = await supabaseAdmin
      .from("projects")
      .select("id,title,slug,description,cover_url,year,awards,external_url,category_id")
      .eq("slug", data.slug).in("category_id", catIds.length ? catIds : ["00000000-0000-0000-0000-000000000000"]).eq("published", true).maybeSingle();
    if (!p) return { project: null, media: [] };
    const { data: media } = await supabaseAdmin
      .from("media").select("id,kind,url,storage_path,caption,sort,external_url").eq("project_id", p.id).order("sort").order("created_at");
    const [proj] = await signList([p], "cover_url");
    const signedMedia = await signList(media ?? [], "url", "storage_path");
    return { project: proj, media: signedMedia };
  });

// Public: media list in a category (for photography galleries)
export const listCategoryMedia = createServerFn({ method: "GET" })
  .inputValidator((d: { kind: "acting" | "photography"; slug: string }) =>
    z.object({ kind: z.enum(["acting", "photography"]), slug: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cat } = await supabaseAdmin.from("categories").select("id,name,slug").eq("kind", data.kind).eq("slug", data.slug).maybeSingle();
    if (!cat) return { category: null, media: [] };
    const { data: media } = await supabaseAdmin
      .from("media").select("id,kind,url,storage_path,caption,sort,external_url").eq("category_id", cat.id).order("sort").order("created_at", { ascending: false });
    const signed = await signList(media ?? [], "url", "storage_path");
    return { category: cat, media: signed };
  });

// Helper — sign storage paths into long-lived URLs (1 week)
async function signList<T extends Record<string, any>>(rows: T[], urlField: keyof T, pathField?: keyof T): Promise<T[]> {
  if (!rows.length) return rows;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const paths: { idx: number; path: string }[] = [];
  rows.forEach((r, idx) => {
    const path = pathField ? (r[pathField] as string | null) : null;
    const url = r[urlField] as string | null;
    if (path && (!url || !/^https?:\/\//.test(url))) paths.push({ idx, path });
    else if (!pathField && url && !/^https?:\/\//.test(url)) paths.push({ idx, path: url });
  });
  if (!paths.length) return rows;
  const { data: signed } = await supabaseAdmin.storage
    .from("media")
    .createSignedUrls(paths.map((p) => p.path), 60 * 60 * 24 * 7);
  (signed ?? []).forEach((s, i) => {
    if (s.signedUrl) {
      const target = rows[paths[i].idx] as any;
      target[urlField] = s.signedUrl;
    }
  });
  return rows;
}
