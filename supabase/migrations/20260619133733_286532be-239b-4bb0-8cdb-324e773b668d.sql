
CREATE OR REPLACE FUNCTION public.list_cities(_min_count int DEFAULT 1, _limit int DEFAULT 5000)
RETURNS TABLE (city text, count bigint)
LANGUAGE sql STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT r.city, count(*)::bigint
  FROM public.restaurants r
  WHERE r.city IS NOT NULL AND r.city <> ''
  GROUP BY r.city
  HAVING count(*) >= _min_count
  ORDER BY count(*) DESC
  LIMIT _limit;
$$;

CREATE OR REPLACE FUNCTION public.list_cuisines(_min_count int DEFAULT 1, _limit int DEFAULT 500)
RETURNS TABLE (cuisine text, count bigint)
LANGUAGE sql STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT c AS cuisine, count(*)::bigint
  FROM public.restaurants r, unnest(r.cuisine) AS c
  WHERE c IS NOT NULL AND c <> ''
  GROUP BY c
  HAVING count(*) >= _min_count
  ORDER BY count(*) DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.list_cities(int, int) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_cuisines(int, int) TO anon, authenticated, service_role;
