import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function citySlug(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const listCitiesPublic = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number; minCount?: number }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows } = await sb.rpc("list_cities", {
      _min_count: data.minCount ?? 1,
      _limit: data.limit ?? 5000,
    });
    return (rows ?? []).map((r: any) => ({
      city: r.city as string,
      slug: citySlug(r.city),
      count: Number(r.count),
    }));
  });

export const listCuisinesPublic = createServerFn({ method: "GET" })
  .inputValidator((d: { limit?: number; minCount?: number }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows } = await sb.rpc("list_cuisines", {
      _min_count: data.minCount ?? 1,
      _limit: data.limit ?? 500,
    });
    return (rows ?? []).map((r: any) => ({ cuisine: r.cuisine as string, count: Number(r.count) }));
  });

export const listByCity = createServerFn({ method: "GET" })
  .inputValidator((d: { citySlug: string; limit?: number; offset?: number }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    // Look up real city name from slug via the aggregate list
    const { data: cities } = await sb.rpc("list_cities", { _min_count: 1, _limit: 5000 });
    const match = (cities ?? []).find((c: any) => citySlug(c.city) === data.citySlug);
    if (!match) throw notFound();
    const { data: rows, error } = await sb.rpc("search_restaurants", {
      _city: match.city,
      _limit: data.limit ?? 48,
      _offset: data.offset ?? 0,
      _sort: "rating",
    });
    if (error) throw new Error(error.message);
    return {
      city: match.city as string,
      total: Number((rows?.[0] as any)?.total_count ?? 0),
      items: (rows ?? []) as any[],
    };
  });

export const listByCuisine = createServerFn({ method: "GET" })
  .inputValidator((d: { cuisine: string; limit?: number; offset?: number }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb.rpc("search_restaurants", {
      _cuisines: [data.cuisine],
      _limit: data.limit ?? 48,
      _offset: data.offset ?? 0,
      _sort: "rating",
    });
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) throw notFound();
    return {
      cuisine: data.cuisine,
      total: Number((rows[0] as any)?.total_count ?? 0),
      items: rows as any[],
    };
  });

export const getRestaurantSitemapPage = createServerFn({ method: "GET" })
  .inputValidator((d: { page: number; pageSize?: number }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const pageSize = data.pageSize ?? 50000;
    const from = (data.page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data: rows } = await sb
      .from("restaurants")
      .select("slug,updated_at")
      .order("id", { ascending: true })
      .range(from, to);
    return (rows ?? []) as { slug: string; updated_at: string }[];
  });

export const countRestaurants = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { count } = await sb.from("restaurants").select("id", { count: "exact", head: true });
  return count ?? 0;
});
