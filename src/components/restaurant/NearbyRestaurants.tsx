import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { t } from "@/lib/i18n/strings";
import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import { cuisineLabel } from "@/lib/osm-labels";
import defaultBanner from "@/assets/default-restaurant-banner.jpg";

type Row = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  cuisine: string[] | null;
  avg_rating: number | null;
  review_count: number | null;
  raw_osm_tags: Record<string, string> | null;
};

function tagImage(tg: Record<string, string> | null): string | null {
  if (!tg) return null;
  const raw = tg.image || tg.wikimedia_commons;
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const clean = raw.replace(/^File:/, "").replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=600`;
}

export function NearbyRestaurants({
  locale,
  currentId,
  city,
}: { locale: LocaleCode; currentId: string; city: string | null }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!city) { setRows([]); return; }
    let cancelled = false;
    supabase
      .from("restaurants")
      .select("id,name,slug,city,cuisine,avg_rating,review_count,raw_osm_tags")
      .eq("city", city)
      .neq("id", currentId)
      .order("review_count", { ascending: false, nullsFirst: false })
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .limit(6)
      .then(({ data }) => { if (!cancelled) setRows((data ?? []) as unknown as Row[]); });
    return () => { cancelled = true; };
  }, [city, currentId]);

  if (!city || !rows || rows.length === 0) return null;

  return (
    <section aria-labelledby="nearby-heading" className="mt-2">
      <h2 id="nearby-heading" className="text-xl font-semibold mb-3 flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        {t(locale, "nearby.title", { city })}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {rows.map((r) => {
          const img = tagImage(r.raw_osm_tags) ?? defaultBanner;
          const cuis = (r.cuisine ?? []).slice(0, 2).map(cuisineLabel).join(", ");
          const cuisineForAlt = (r.cuisine ?? [])[0] ? `${cuisineLabel((r.cuisine ?? [])[0]!)} ` : "";
          const altText = `${r.name}, ${cuisineForAlt}restaurant in ${r.city ?? city}`;
          const linkProps = locale === DEFAULT_LOCALE
            ? { to: "/restaurant/$slug" as const, params: { slug: r.slug } }
            : { to: "/$lang/restaurant/$slug" as const, params: { lang: locale, slug: r.slug } };
          return (
            <Link
              key={r.id}
              {...linkProps}
              className="group rounded-lg overflow-hidden border bg-background hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                <img src={img} alt={altText} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
              </div>
              <div className="p-2.5">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2">{r.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {(r.avg_rating ?? 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                      <Star className="w-3 h-3 fill-current" />
                      {Number(r.avg_rating).toFixed(1)}
                    </span>
                  )}
                  {cuis && <span className="truncate">{cuis}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
