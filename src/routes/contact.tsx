import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteContent } from "@/lib/site.functions";
import { submitContact } from "@/lib/contact.functions";
import { SocialLinks } from "@/components/social-links";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — Kenula Pathirathna" },
    { name: "description", content: "Get in touch with Kenula Pathirathna for collaborations, bookings and inquiries." },
  ]}),
  loader: async ({ context }) => {
    const fn = (await import("@/lib/site.functions")).getSiteContent;
    await context.queryClient.ensureQueryData({
      queryKey: ["site_content", "contact"],
      queryFn: () => fn({ data: { key: "contact" } }),
    });
  },
  component: ContactPage,
});

function ContactPage() {
  const fn = useServerFn(getSiteContent);
  const { data } = useSuspenseQuery({
    queryKey: ["site_content", "contact"],
    queryFn: () => fn({ data: { key: "contact" } }),
  });
  const v = (data?.value ?? {}) as Record<string, string>;
  const email = v.email || "";
  const phone = v.phone || "";
  const whatsapp = v.whatsapp || "";

  const submit = useServerFn(submitContact);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const mut = useMutation({
    mutationFn: submit,
    onSuccess: () => { toast.success("Message sent. Thank you."); setForm({ name: "", email: "", message: "" }); },
    onError: (e: any) => toast.error(e?.message || "Could not send. Try again."),
  });

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 grid md:grid-cols-2 gap-12">
      <div>
        <p className="text-[11px] uppercase tracking-[0.4em] text-gold">Contact</p>
        <h1 className="font-display text-5xl md:text-6xl mt-3">Let's create.</h1>
        <p className="mt-4 text-muted-foreground max-w-md">For collaborations, bookings, press or speaking — reach out below.</p>

        {/* Contact information section — edit at /admin/site → contact */}
        <ul className="mt-10 space-y-4 text-sm">
          {email && <li className="flex items-center gap-3"><Mail size={16} className="text-gold"/><a href={`mailto:${email}`} className="hover:text-gold">{email}</a></li>}
          {phone && <li className="flex items-center gap-3"><Phone size={16} className="text-gold"/><a href={`tel:${phone}`} className="hover:text-gold">{phone}</a></li>}
          {whatsapp && (
            <li>
              <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-black px-5 py-2.5 text-sm font-medium hover:opacity-90">
                <MessageCircle size={16}/> WhatsApp
              </a>
            </li>
          )}
        </ul>

        <div className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Elsewhere</p>
          <SocialLinks />
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mut.mutate({ data: form }); }}
        className="border border-border/60 p-6 md:p-8 space-y-4"
      >
        <div>
          <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Name</label>
          <input required minLength={1} maxLength={200} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-input/40 border border-border px-3 py-2.5 outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Email</label>
          <input type="email" required maxLength={320} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full bg-input/40 border border-border px-3 py-2.5 outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Message</label>
          <textarea required maxLength={5000} rows={6} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full bg-input/40 border border-border px-3 py-2.5 outline-none focus:border-gold resize-y" />
        </div>
        <button disabled={mut.isPending} type="submit"
          className="w-full bg-gold text-primary-foreground px-6 py-3 text-sm tracking-wide hover:bg-gold-muted transition disabled:opacity-50">
          {mut.isPending ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
