// Public contact form submission
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; message: string }) =>
    z.object({
      name: z.string().trim().min(1).max(200),
      email: z.string().trim().email().max(320),
      message: z.string().trim().min(1).max(5000),
    }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert(data);
    if (error) throw error;
    return { ok: true };
  });
