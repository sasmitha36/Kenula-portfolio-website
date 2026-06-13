import { supabase } from "@/integrations/supabase/client";

// Upload a file to the "media" storage bucket as the signed-in admin.
// Returns { path, signedUrl } — store `path` in DB; UI can use signedUrl for preview.
export async function uploadToMedia(file: File, folder = "uploads"): Promise<{ path: string; signedUrl: string }> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 7);
  return { path, signedUrl: data?.signedUrl || "" };
}
