
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.category_kind AS ENUM ('acting', 'photography');
CREATE TYPE public.media_kind AS ENUM ('image', 'video', 'youtube', 'vimeo');

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-grant admin to first signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- site_content
CREATE TABLE public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site_content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "admin write site_content" ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  kind category_kind NOT NULL,
  name TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  UNIQUE (kind, slug)
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admin write categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  year TEXT,
  awards TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published projects" ON public.projects FOR SELECT USING (published = true);
CREATE POLICY "admin read all projects" ON public.projects FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin write projects" ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- media
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  kind media_kind NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  storage_path TEXT,
  caption TEXT,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon, authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read media" ON public.media FOR SELECT USING (true);
CREATE POLICY "admin write media" ON public.media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- contact_messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "admin read messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed categories
INSERT INTO public.categories (slug, kind, name, sort) VALUES
  ('short-films', 'acting', 'Short Films', 1),
  ('commercials', 'acting', 'Commercials', 2),
  ('theatre', 'acting', 'Theatre', 3),
  ('dancing', 'acting', 'Dancing', 4),
  ('art', 'photography', 'Art', 1),
  ('journalism', 'photography', 'Journalism', 2),
  ('portraits', 'photography', 'Portraits', 3),
  ('sports', 'photography', 'Sports', 4),
  ('others', 'photography', 'Others', 5);

-- Seed site_content
INSERT INTO public.site_content (key, value) VALUES
  ('home', '{
    "hero_image": "",
    "name": "Kenula Sathmitha Pathirathna",
    "roles": "Actor • Professional Dancer • Percussionist • Photographer • Photojournalist",
    "bio": "I am Kenula Sathmitha Pathirathna, a 20-year-old Sri Lankan artist, actor, professional dancer, percussionist, and photographer. My work spans theatre, dance, film, and photojournalism, driven by a deep passion for storytelling and human expression.\n\nTrained at the Somalatha Subasinghe Play House and mentored by veteran artist Shyam Fernando and director Rajitha Dissanayake, I have developed a strong foundation in acting and performance.\n\nAs a dancer, I trained under Dr. Ravibandhu Vidyapathi at the Ravibandhu Samanthi Dance Ensemble, and I continue to explore rhythm and movement as a form of expression.\n\nAlongside performance, I work as a freelance photojournalist with Zuma Press, documenting stories from real life through a visual lens. Whether on stage or behind the camera, I aim to create work that connects, reflects, and communicates meaningful human experiences.",
    "acting_card_image": "",
    "photography_card_image": ""
  }'),
  ('acting_about', '{
    "hero_image": "",
    "bio": "I am a Sri Lankan actor with a strong background in stage performance, dance theatre, and short films. My journey in acting began with formal training at the Somalatha Subasinghe Play House, where I developed my foundation in theatre performance and stagecraft.\n\nI have also been guided by veteran actor Shyam Fernando and theatre director Rajitha Dissanayake, whose mentorship has played a key role in shaping my approach to acting.\n\nOn stage, I have performed in several Sri Lankan theatre productions, including Vikurthi, Punchi Apita Dan Therei, Thoppi Welenda, and Walas Pawula.\n\nI also had the opportunity to perform in the dance theatre production Draupadi, directed by Dr. Ravibandhu Vidyapathi, which deepened my understanding of movement-based storytelling and expressive performance.\n\nIn addition to theatre, I have acted in short films such as Kadulu Gas, Vipallasa, and Waeni Asna, where I explored more cinematic forms of storytelling and screen acting.\n\nMy work has been recognised at film festivals, where I received the Most Promising Filmmaker award at Agenda 14 Film Festival 2025 and the People''s Award at Onscreen ''25.\n\nI am also a member of Power of Play Pvt Ltd, a puppet theatre company, where I engage in alternative performance practices and collaborative storytelling.\n\nAs an actor, I am committed to roles that challenge me creatively and emotionally, and I continue to develop my craft across theatre, film, and performance-based art forms."
  }'),
  ('photography_about', '{
    "hero_image": "",
    "bio": "I am a Sri Lankan photojournalist and photographer working across multiple genres including documentary photography, street photography, creative art photography, event photography, and portrait photography. My work is driven by a strong visual curiosity and a commitment to capturing real moments, human stories, and powerful emotions through the lens.\n\nAs a photojournalist, my work has been published in international news platforms including The Guardian, Perspective Publishing, The Objective, Worldcrunch, Yahoo News, and DW Media, where I focus on documenting current affairs, social issues, and human-interest stories from Sri Lanka and beyond.\n\nAlongside news photography, I have worked extensively in the performing arts sector as a stage production photographer for Sinhala theatre plays such as Brothersize, Wingfield Family, and Apa Athara U, capturing the energy and emotion of live performance.\n\nI have also worked as a sports photographer for The Papare, documenting dynamic sporting moments with a focus on action, timing, and atmosphere.\n\nThrough my photography, I aim to tell authentic visual stories that reflect reality while highlighting the depth, culture, and emotion found in everyday life."
  }'),
  ('contact', '{
    "email": "",
    "phone": "",
    "whatsapp": ""
  }'),
  ('socials', '{
    "instagram": "https://www.instagram.com/kenula__/",
    "facebook": "https://www.facebook.com/kenula.sathmithe",
    "linkedin": "https://www.linkedin.com/in/kenula-pathirathna-a98981338/",
    "tiktok": "https://www.tiktok.com/@kenulapathirathna",
    "imdb": "https://www.imdb.com/name/nm18566234/"
  }'),
  ('acting_profile', '{
    "bio": "",
    "awards": "Most Promising Filmmaker — Agenda 14 Film Festival 2025\nPeople''s Award — Onscreen ''25",
    "experience": "",
    "achievements": "",
    "resume_url": ""
  }');

-- Seed short film projects
WITH c AS (SELECT id FROM public.categories WHERE kind = 'acting' AND slug = 'short-films')
INSERT INTO public.projects (category_id, title, slug, description, sort)
SELECT c.id, t.title, t.slug, '', t.sort FROM c, (VALUES
  ('Kadulu Gas', 'kadulu-gas', 1),
  ('Vipallasa', 'vipallasa', 2),
  ('I Wish They Were Too', 'i-wish-they-were-too', 3),
  ('Waeni Asna', 'waeni-asna', 4)
) AS t(title, slug, sort);

-- Seed commercial projects
WITH c AS (SELECT id FROM public.categories WHERE kind = 'acting' AND slug = 'commercials')
INSERT INTO public.projects (category_id, title, slug, description, sort)
SELECT c.id, t.title, t.slug, '', t.sort FROM c, (VALUES
  ('British Council', 'british-council', 1),
  ('Rice Factory', 'rice-factory', 2),
  ('DSI Tyres', 'dsi-tyres', 3),
  ('Valentino Pillows', 'valentino-pillows', 4)
) AS t(title, slug, sort);
