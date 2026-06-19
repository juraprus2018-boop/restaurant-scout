
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS author_email text;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_restaurant_id_user_id_key;

-- allow public (anon) inserts when guest fields supplied and no user_id
DROP POLICY IF EXISTS "anon insert guest reviews" ON public.reviews;
CREATE POLICY "anon insert guest reviews" ON public.reviews
  FOR INSERT TO anon
  WITH CHECK (
    user_id IS NULL
    AND author_name IS NOT NULL AND length(btrim(author_name)) BETWEEN 1 AND 80
    AND author_email IS NOT NULL AND author_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND rating BETWEEN 1 AND 5
  );

-- also allow authenticated guest-style or own inserts
DROP POLICY IF EXISTS "users insert own reviews" ON public.reviews;
CREATE POLICY "auth insert reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND rating BETWEEN 1 AND 5
    AND (
      user_id = auth.uid()
      OR (author_name IS NOT NULL AND author_email IS NOT NULL)
    )
  );

GRANT INSERT ON public.reviews TO anon;
