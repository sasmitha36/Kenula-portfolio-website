
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "anyone can insert" ON public.contact_messages;
CREATE POLICY "anyone can insert" ON public.contact_messages FOR INSERT WITH CHECK (
  length(name) BETWEEN 1 AND 200 AND
  length(email) BETWEEN 3 AND 320 AND
  length(message) BETWEEN 1 AND 5000
);
