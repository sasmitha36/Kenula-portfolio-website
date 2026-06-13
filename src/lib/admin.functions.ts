// Admin-only server functions. Caller must be signed in AND have admin role.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden");
}

// Save (upsert) a site_content key
export const saveSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: Record<string, unknown> }) =>
    z.object({ key: z.string().min(1).max(64), value: z.record(z.string(), z.any()) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_content")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });

// List all projects (admin view — includes unpublished)
export const adminListProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("projects")
      .select("id,title,slug,description,cover_url,year,awards,featured,published,sort,external_url,category_id, categories(name,slug,kind)")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("categories").select("*").order("kind").order("sort");
    return data ?? [];
  });

// Upsert (insert or update) a project
export const saveProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({
      id: z.string().uuid().optional(),
      category_id: z.string().uuid(),
      title: z.string().min(1).max(200),
      slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens"),
      description: z.string().max(5000).optional().nullable(),
      cover_url: z.string().max(2000).optional().nullable(),
      year: z.string().max(20).optional().nullable(),
      awards: z.string().max(2000).optional().nullable(),
      external_url: z.string().max(2000).optional().nullable(),
      featured: z.boolean().optional(),
      published: z.boolean().optional(),
      sort: z.number().int().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("projects").update(data).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("projects").insert(data).select("id").single();
    if (error) throw error;
    return { ok: true, id: row!.id };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// Add media row (file is already uploaded to storage by browser client)
export const addMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({
      project_id: z.string().uuid().optional().nullable(),
      category_id: z.string().uuid().optional().nullable(),
      kind: z.enum(["image", "video", "youtube", "vimeo"]),
      url: z.string().min(1).max(2000),
      storage_path: z.string().max(1000).optional().nullable(),
      caption: z.string().max(500).optional().nullable(),
      external_url: z.string().max(2000).optional().nullable(),
      sort: z.number().int().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("media").insert(data);
    if (error) throw error;
    return { ok: true };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin.from("media").select("storage_path").eq("id", data.id).maybeSingle();
    if (m?.storage_path) await supabaseAdmin.storage.from("media").remove([m.storage_path]);
    const { error } = await supabaseAdmin.from("media").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// Update editable fields on an existing media row (caption / external_url)
export const updateMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z.object({
      id: z.string().uuid(),
      caption: z.string().max(500).optional().nullable(),
      external_url: z.string().max(2000).optional().nullable(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin.from("media").update(rest).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const adminListMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("media").select("id,kind,url,storage_path,caption,sort,project_id,category_id,external_url,created_at")
      .order("created_at", { ascending: false }).limit(500);
    if (!data) return [];
    // sign storage paths
    const paths = data.filter((d) => d.storage_path).map((d) => d.storage_path!) as string[];
    const signed = paths.length
      ? (await supabaseAdmin.storage.from("media").createSignedUrls(paths, 60 * 60 * 24 * 7)).data ?? []
      : [];
    const map = new Map(paths.map((p, i) => [p, signed[i]?.signedUrl]));
    return data.map((m) => ({ ...m, url: m.storage_path && map.get(m.storage_path) ? map.get(m.storage_path)! : m.url }));
  });

// Check admin status (for client gating)
export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: Boolean(data), userId: context.userId };
  });
