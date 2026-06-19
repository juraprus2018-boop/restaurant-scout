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

export const getRestaurantBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: r } = await sb.from("restaurants").select("*").eq("slug", data.slug).maybeSingle();
    if (!r) throw notFound();
    const { data: reviews } = await sb
      .from("reviews")
      .select("id,rating,comment,created_at,user_id,author_name")
      .eq("restaurant_id", r.id)
      .order("created_at", { ascending: false })
      .limit(50);
    return { restaurant: r, reviews: reviews ?? [] };
  });
