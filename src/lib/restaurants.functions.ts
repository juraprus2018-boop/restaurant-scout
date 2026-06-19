import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OsmPoi = {
  osm_id: number;
  osm_type: string;
  name: string;
  lat: number;
  lng: number;
  amenity: string;
  cuisine: string[];
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tags: Record<string, string>;
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

function buildAddress(t: Record<string, string>) {
  const parts = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
  const city = [t["addr:postcode"], t["addr:city"]].filter(Boolean).join(" ");
  return [parts, city].filter(Boolean).join(", ") || null;
}

function slugify(name: string, osmId: number) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "restaurant";
  return `${base}-${osmId}`;
}

async function fetchOverpass(lat: number, lng: number, radius: number): Promise<OsmPoi[]> {
  const query = `[out:json][timeout:15];
(
  node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|food_court|bistro)$"](around:${radius},${lat},${lng});
  way["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|food_court|bistro)$"](around:${radius},${lat},${lng});
);
out center tags;`;
  console.log(`[overpass] fetching radius=${radius}m around ${lat},${lng}`);
  let lastErr: unknown = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const t0 = Date.now();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "eetgids/1.0 (contact: info@eetgids.example)",
        },
        body: "data=" + encodeURIComponent(query),
      });
      console.log(`[overpass] ${url} → ${res.status} in ${Date.now() - t0}ms`);
      if (!res.ok) {
        const bodySnippet = await res.text().then((t) => t.slice(0, 200)).catch(() => "");
        lastErr = new Error(`Overpass ${res.status} from ${new URL(url).hostname}: ${bodySnippet}`);
        continue;
      }
      const json = (await res.json()) as { elements: any[] };
      console.log(`[overpass] got ${json.elements?.length ?? 0} elements`);
      return json.elements
        .map((el) => {
          const t = el.tags ?? {};
          if (!t.name) return null;
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (lat == null || lng == null) return null;
          return {
            osm_id: el.id,
            osm_type: el.type,
            name: t.name,
            lat,
            lng,
            amenity: t.amenity,
            cuisine: t.cuisine ? t.cuisine.split(";").map((s: string) => s.trim()) : [],
            phone: t.phone ?? t["contact:phone"] ?? null,
            website: t.website ?? t["contact:website"] ?? null,
            opening_hours: t.opening_hours ?? null,
            address: buildAddress(t),
            city: t["addr:city"] ?? null,
            country: t["addr:country"] ?? null,
            tags: t,
          } as OsmPoi;
        })
        .filter(Boolean) as OsmPoi[];
    } catch (e: any) {
      console.error(`[overpass] ${url} threw:`, e?.message || e);
      lastErr = e;
      continue;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Overpass: alle endpoints faalden");
}



export const previewArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lat: number; lng: number; radius: number }) => d)
  .handler(async ({ data, context }) => {
    const isAdmin = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin.data) throw new Error("Forbidden");

    const pois = await fetchOverpass(data.lat, data.lng, data.radius);
    const ids = pois.map((p) => p.osm_id);
    const existingSet = new Set<number>();
    const CHUNK = 100;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const { data: existing, error } = await context.supabase
        .from("restaurants")
        .select("osm_id")
        .in("osm_id", chunk);
      if (error) {
        console.error("[previewArea] existing lookup error:", error.message);
        throw new Error(error.message);
      }
      for (const r of existing ?? []) existingSet.add(Number((r as any).osm_id));
    }
    return {
      pois: pois.map((p) => ({ ...p, exists: existingSet.has(p.osm_id) })),
      total: pois.length,
      newCount: pois.length - existingSet.size,
    };
  });

export const importArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lat: number; lng: number; radius: number }) => d)
  .handler(async ({ data, context }) => {
    const isAdmin = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin.data) throw new Error("Forbidden");

    const pois = await fetchOverpass(data.lat, data.lng, data.radius);
    if (pois.length === 0) return { inserted: 0 };

    const rows = pois.map((p) => ({
      osm_id: p.osm_id,
      osm_type: p.osm_type,
      name: p.name,
      slug: slugify(p.name, p.osm_id),
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      city: p.city,
      country: p.country,
      cuisine: p.cuisine,
      phone: p.phone,
      website: p.website,
      opening_hours: p.opening_hours,
      raw_osm_tags: p.tags,
    }));

    const { data: inserted, error } = await context.supabase
      .from("restaurants")
      .upsert(rows, { onConflict: "osm_id", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(error.message);
    return { inserted: inserted?.length ?? 0, total: pois.length };
  });

export const deleteRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const isAdmin = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin.data) throw new Error("Forbidden");
    const { error } = await context.supabase.from("restaurants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
