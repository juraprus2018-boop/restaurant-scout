ALTER TABLE public.restaurants
  ADD CONSTRAINT restaurants_city_required CHECK (city IS NOT NULL AND city <> '') NOT VALID;
ALTER TABLE public.restaurants VALIDATE CONSTRAINT restaurants_city_required;