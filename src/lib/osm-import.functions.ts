import { createServerFn } from "@tanstack/react-start";

type OsmEl = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function parseCuisine(v?: string): string[] {
  if (!v) return [];
  return v
    .split(/[;,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function buildAddress(t: Record<string, string>): string | null {
  const street = t["addr:street"];
  const hn = t["addr:housenumber"];
  if (street && hn) return `${street} ${hn}`;
  if (street) return street;
  return null;
}

/**
 * Search OSM Overpass for restaurants near a query string, insert any new ones
 * into the database, and return the inserted/matching rows.
 * Public endpoint — rate-limited implicitly by Overpass + Nominatim.
 */
export const importOsmForQuery = createServerFn({ method: "POST" })
  .inputValidator((d: { q: string; limit?: number }) => ({
    q: String(d.q || "").trim().slice(0, 120),
    limit: Math.min(Math.max(d.limit ?? 40, 1), 80),
  }))
  .handler(async ({ data }) => {
    try {
      console.log("[osm-import] start", data.q);
    if (!data.q) return { inserted: 0, rows: [] };

    // 1) Geocode via Nominatim → bbox
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(data.q)}`,
      { headers: { "User-Agent": "PlaceResults/1.0 (contact@placeresults.com)", Accept: "application/json" } },
    );
    if (!geoRes.ok) return { inserted: 0, rows: [] };
    const geo = (await geoRes.json()) as Array<{
      lat: string; lon: string; display_name: string;
      boundingbox?: [string, string, string, string]; // [south, north, west, east]
      address?: { country?: string; city?: string; town?: string; village?: string };
    }>;
    if (!geo[0]) return { inserted: 0, rows: [] };
    const g = geo[0];
    const lat = parseFloat(g.lat);
    const lon = parseFloat(g.lon);
    let south: number, north: number, west: number, east: number;
    if (g.boundingbox) {
      south = parseFloat(g.boundingbox[0]);
      north = parseFloat(g.boundingbox[1]);
      west = parseFloat(g.boundingbox[2]);
      east = parseFloat(g.boundingbox[3]);
      // cap bbox so we don't ask Overpass to scan a whole country
      const maxSpan = 0.5; // ~55km
      if (north - south > maxSpan) {
        south = lat - maxSpan / 2; north = lat + maxSpan / 2;
      }
      if (east - west > maxSpan) {
        west = lon - maxSpan / 2; east = lon + maxSpan / 2;
      }
    } else {
      south = lat - 0.1; north = lat + 0.1; west = lon - 0.1; east = lon + 0.1;
    }

    // 2) Overpass: restaurants in bbox
    const overpassQ = `[out:json][timeout:25];
(
  node["amenity"="restaurant"](${south},${west},${north},${east});
  way["amenity"="restaurant"](${south},${west},${north},${east});
);
out tags center ${data.limit};`;
    const opRes = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQ,
      headers: { "Content-Type": "text/plain", "User-Agent": "PlaceResults/1.0" },
    });
    if (!opRes.ok) return { inserted: 0, rows: [] };
    const op = (await opRes.json()) as { elements: OsmEl[] };

    const fallbackCity = g.address?.city || g.address?.town || g.address?.village || null;
    const fallbackCountry = g.address?.country || null;

    // 3) Build rows
    const candidates: Array<{
      osm_id: number;
      osm_type: string;
      name: string;
      slug: string;
      lat: number;
      lng: number;
      address: string | null;
      city: string;
      country: string | null;
      cuisine: string[];
      phone: string | null;
      website: string | null;
      opening_hours: string | null;
      raw_osm_tags: Record<string, string>;
    }> = [];

    for (const e of op.elements) {
      const t = e.tags || {};
      const name = t.name;
      if (!name) continue;
      const elat = e.lat ?? e.center?.lat;
      const elng = e.lon ?? e.center?.lon;
      if (typeof elat !== "number" || typeof elng !== "number") continue;
      const city = t["addr:city"] || fallbackCity;
      if (!city) continue; // city is NOT NULL
      const country = t["addr:country"] || fallbackCountry;
      const baseSlug = slugify(`${name}-${city}`);
      if (!baseSlug) continue;
      candidates.push({
        osm_id: e.id,
        osm_type: e.type,
        name,
        slug: baseSlug,
        lat: elat,
        lng: elng,
        address: buildAddress(t),
        city,
        country,
        cuisine: parseCuisine(t.cuisine),
        phone: t.phone || t["contact:phone"] || null,
        website: t.website || t["contact:website"] || null,
        opening_hours: t.opening_hours || null,
        raw_osm_tags: t,
      });
    }

    if (candidates.length === 0) return { inserted: 0, rows: [] };

    // 4) Insert via admin client. Dedupe slugs in this batch.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check which osm_ids already exist
    const osmIds = candidates.map((c) => c.osm_id);
    const { data: existing } = await supabaseAdmin
      .from("restaurants")
      .select("osm_id")
      .in("osm_id", osmIds);
    const existingIds = new Set((existing ?? []).map((r) => r.osm_id));
    const fresh = candidates.filter((c) => !existingIds.has(c.osm_id));

    // Resolve slug collisions
    const seenSlugs = new Set<string>();
    if (fresh.length) {
      const slugs = fresh.map((f) => f.slug);
      const { data: collisions } = await supabaseAdmin
        .from("restaurants")
        .select("slug")
        .in("slug", slugs);
      (collisions ?? []).forEach((r) => seenSlugs.add(r.slug));
    }
    for (const r of fresh) {
      let s = r.slug;
      let i = 2;
      while (seenSlugs.has(s)) {
        s = `${r.slug}-${i++}`;
      }
      seenSlugs.add(s);
      r.slug = s;
    }

    let inserted = 0;
    if (fresh.length) {
      const { error, count } = await supabaseAdmin
        .from("restaurants")
        .insert(fresh, { count: "exact" });
      if (error) console.error("[osm-import] insert error", error);
      else inserted = count ?? fresh.length;
    }

    // 5) Return ALL matching rows (existing + new) for immediate display
    const { data: rows, error: selErr } = await supabaseAdmin
      .from("restaurants")
      .select("id,name,slug,lat,lng,city,address,avg_rating,review_count")
      .in("osm_id", osmIds);
    if (selErr) console.error("[osm-import] select error", selErr);

    const clean = (rows ?? []).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      lat: Number(r.lat),
      lng: Number(r.lng),
      city: r.city ? String(r.city) : null,
      address: r.address ? String(r.address) : null,
      avg_rating: r.avg_rating == null ? null : Number(r.avg_rating),
      review_count: r.review_count == null ? null : Number(r.review_count),
    }));

    return { inserted, rows: clean };
  });
