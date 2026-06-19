CREATE TABLE public.seo_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  key text NOT NULL,
  lang text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  intro text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scope, key, lang)
);
GRANT SELECT ON public.seo_translations TO anon, authenticated;
GRANT ALL ON public.seo_translations TO service_role;
ALTER TABLE public.seo_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo translations public read" ON public.seo_translations FOR SELECT USING (true);
CREATE INDEX seo_translations_lookup_idx ON public.seo_translations (scope, key, lang);