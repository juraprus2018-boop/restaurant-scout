CREATE OR REPLACE FUNCTION public.list_city_cuisine_combos(_min_count integer DEFAULT 1, _limit integer DEFAULT 5000)
RETURNS TABLE(city text, cuisine text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.city,
         lower(c) AS cuisine,
         count(*)::bigint AS count
  FROM public.restaurants r
  CROSS JOIN LATERAL unnest(r.cuisine) AS c
  WHERE r.city IS NOT NULL
    AND r.cuisine IS NOT NULL
  GROUP BY r.city, lower(c)
  HAVING count(*) >= _min_count
  ORDER BY count(*) DESC
  LIMIT _limit;
$$;

REVOKE EXECUTE ON FUNCTION public.list_city_cuisine_combos(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_city_cuisine_combos(integer, integer) TO anon, authenticated, service_role;