
-- 1. Hide author_email from anon/authenticated SELECTs
REVOKE SELECT (author_email) ON public.reviews FROM anon, authenticated;

-- 2. Prevent anon from writing author_email column
REVOKE INSERT (author_email) ON public.reviews FROM anon;

-- 3. Replace anon insert policy: drop email requirement
DROP POLICY IF EXISTS "anon insert guest reviews" ON public.reviews;
CREATE POLICY "anon insert guest reviews"
ON public.reviews
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND author_name IS NOT NULL
  AND length(btrim(author_name)) BETWEEN 1 AND 80
  AND author_email IS NULL
  AND rating BETWEEN 1 AND 5
);

-- 4. Require authenticated inserts to be linked to auth.uid()
DROP POLICY IF EXISTS "auth insert reviews" ON public.reviews;
CREATE POLICY "auth insert reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND rating BETWEEN 1 AND 5
);

-- 5. Lock down has_role: only service_role and postgres can call directly.
-- RLS policies referencing has_role still work because SECURITY DEFINER runs as owner,
-- but the EXECUTE check uses the caller. To keep policies working we grant to authenticated
-- ONLY through policies; since direct API call surface is what the linter flags, we revoke
-- from PUBLIC and grant nothing to anon. Authenticated keeps EXECUTE because RLS policies
-- (e.g. delete own reviews or admin) invoke it on user requests.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
