
-- Extensions for fast text & fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===== Indexes on restaurants =====
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_slug_idx ON public.restaurants (slug);
CREATE INDEX IF NOT EXISTS restaurants_name_trgm ON public.restaurants USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS restaurants_city_trgm ON public.restaurants USING gin (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS restaurants_city_lower_idx ON public.restaurants (lower(city));
CREATE INDEX IF NOT EXISTS restaurants_cuisine_gin ON public.restaurants USING gin (cuisine);
CREATE INDEX IF NOT EXISTS restaurants_rating_idx ON public.restaurants (avg_rating DESC NULLS LAST, review_count DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS restaurants_review_count_idx ON public.restaurants (review_count DESC NULLS LAST);
-- Bounding-box friendly geo filter (cheap, no PostGIS needed)
CREATE INDEX IF NOT EXISTS restaurants_lat_lng_idx ON public.restaurants (lat, lng);

-- ===== Server-side search RPC =====
-- One function that handles: text query, city, cuisines (any-of), bounding-box geo, sorting, pagination.
-- Returns the page rows + the total count for pagination UI.
CREATE OR REPLACE FUNCTION public.search_restaurants(
  _q text DEFAULT NULL,
  _city text DEFAULT NULL,
  _cuisines text[] DEFAULT NULL,
  _lat double precision DEFAULT NULL,
  _lng double precision DEFAULT NULL,
  _radius_km double precision DEFAULT NULL,
  _sort text DEFAULT 'popular',     -- 'popular' | 'rating' | 'distance' | 'name'
  _limit int DEFAULT 24,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  lat double precision,
  lng double precision,
  city text,
  address text,
  cuisine text[],
  avg_rating numeric,
  review_count int,
  opening_hours text,
  raw_osm_tags jsonb,
  distance_km double precision,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lat_delta double precision;
  _lng_delta double precision;
  _lim int := LEAST(GREATEST(COALESCE(_limit, 24), 1), 100);
  _off int := GREATEST(COALESCE(_offset, 0), 0);
BEGIN
  IF _lat IS NOT NULL AND _lng IS NOT NULL AND _radius_km IS NOT NULL THEN
    _lat_delta := _radius_km / 111.0;
    _lng_delta := _radius_km / (111.0 * cos(radians(_lat)));
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT r.*,
      CASE
        WHEN _lat IS NOT NULL AND _lng IS NOT NULL THEN
          2 * 6371 * asin(sqrt(
            sin(radians((r.lat - _lat) / 2)) ^ 2
            + cos(radians(_lat)) * cos(radians(r.lat))
              * sin(radians((r.lng - _lng) / 2)) ^ 2
          ))
        ELSE NULL
      END AS dist
    FROM public.restaurants r
    WHERE
      (_q IS NULL OR _q = '' OR
        r.name ILIKE '%' || _q || '%'
        OR r.city ILIKE '%' || _q || '%'
        OR r.address ILIKE '%' || _q || '%'
      )
      AND (_city IS NULL OR _city = '' OR lower(r.city) = lower(_city))
      AND (_cuisines IS NULL OR array_length(_cuisines, 1) IS NULL OR r.cuisine && _cuisines)
      AND (_lat_delta IS NULL OR (
        r.lat BETWEEN _lat - _lat_delta AND _lat + _lat_delta
        AND r.lng BETWEEN _lng - _lng_delta AND _lng + _lng_delta
      ))
  ),
  filtered AS (
    SELECT * FROM base
    WHERE _radius_km IS NULL OR dist IS NULL OR dist <= _radius_km
  ),
  counted AS (
    SELECT count(*) AS c FROM filtered
  )
  SELECT
    f.id, f.name, f.slug, f.lat, f.lng, f.city, f.address, f.cuisine,
    f.avg_rating, f.review_count, f.opening_hours, f.raw_osm_tags,
    f.dist,
    (SELECT c FROM counted)
  FROM filtered f
  ORDER BY
    CASE WHEN _sort = 'distance' AND f.dist IS NOT NULL THEN f.dist END ASC NULLS LAST,
    CASE WHEN _sort = 'rating'   THEN f.avg_rating END DESC NULLS LAST,
    CASE WHEN _sort = 'name'     THEN f.name END ASC,
    f.review_count DESC NULLS LAST,
    f.avg_rating DESC NULLS LAST
  LIMIT _lim OFFSET _off;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_restaurants(text, text, text[], double precision, double precision, double precision, text, int, int) TO anon, authenticated, service_role;
