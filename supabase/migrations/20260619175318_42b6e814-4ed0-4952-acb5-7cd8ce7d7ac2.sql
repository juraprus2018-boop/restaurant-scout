
CREATE OR REPLACE FUNCTION public.list_cities_with_coords(_min_count int DEFAULT 1, _limit int DEFAULT 5000)
RETURNS TABLE(city text, country text, count bigint, lat double precision, lng double precision)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT r.city,
         (array_agg(r.country ORDER BY r.country) FILTER (WHERE r.country IS NOT NULL))[1] AS country,
         count(*)::bigint AS count,
         avg(r.lat)::double precision AS lat,
         avg(r.lng)::double precision AS lng
  FROM public.restaurants r
  WHERE r.city IS NOT NULL AND r.city <> ''
  GROUP BY r.city
  HAVING count(*) >= _min_count
  ORDER BY count(*) DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.list_cities_with_coords(int, int) TO anon, authenticated, service_role;
