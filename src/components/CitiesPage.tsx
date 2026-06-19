import { useMemo, useState } from "react";
import { ClientOnly, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listCitiesWithCoords } from "@/lib/seo-public.functions";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { MapPin, Search } from "lucide-react";
import { LOCALES, DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";

export const citiesQuery = () =>
  queryOptions({
    queryKey: ["cities-all"],
    queryFn: () => listCitiesWithCoords({ data: { minCount: 1, limit: 5000 } }),
    staleTime: 30 * 60_000,
  });

type CityRow = { city: string; slug: string; country: string; count: number; lat: number; lng: number };

const REGION = new Intl.DisplayNames(undefined, { type: "region" });
function countryName(code: string, locale: LocaleCode): string {
  if (!code) return "";
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return REGION.of(code) ?? code;
  }
}

export function CitiesPageBody({ locale = DEFAULT_LOCALE }: { locale?: LocaleCode }) {
  const { data } = useSuspenseQuery(citiesQuery());
  const cities = data as CityRow[];

  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("");

  const countries = useMemo(() => {
    const set = new Map<string, number>();
    for (const c of cities) {
      if (!c.country) continue;
      set.set(c.country, (set.get(c.country) ?? 0) + 1);
    }
    return Array.from(set.keys())
      .map((code) => ({ code, label: countryName(code, locale) }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [cities, locale]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cities.filter((c) =>
      (!country || c.country === country) &&
      (!needle || c.city.toLowerCase().includes(needle))
    );
  }, [cities, q, country]);

  const langPrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const citiesPath = `${langPrefix}/steden`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t(locale, "cities.heading"),
    inLanguage: locale,
    numberOfItems: cities.length,
    itemListElement: cities.slice(0, 50).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${langPrefix}/stad/${c.slug}`,
      name: c.city,
    })),
  };

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t(locale, "city.breadcrumb.home"), item: locale === DEFAULT_LOCALE ? "/" : `/${locale}` },
      { "@type": "ListItem", position: 2, name: t(locale, "city.breadcrumb.cities"), item: citiesPath },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />

      <section className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary">{t(locale, "city.breadcrumb.home")}</Link>
            {" / "}
            <span className="text-foreground">{t(locale, "city.breadcrumb.cities")}</span>
          </nav>
          <h1 className="font-display text-4xl sm:text-5xl text-ink">{t(locale, "cities.heading")}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">{t(locale, "cities.intro")}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-2xl overflow-hidden border border-border bg-card" style={{ height: 420 }}>
          <ClientOnly fallback={<div className="w-full h-full bg-muted animate-pulse" />}>
            <CitiesMap cities={filtered} locale={locale} />
          </ClientOnly>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t(locale, "cities.searchPlaceholder")}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm"
            />
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm min-w-[180px]"
          >
            <option value="">{t(locale, "cities.countryAll")}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">{t(locale, "cities.empty")}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/stad/$city"
                  params={{ city: c.slug }}
                  className="group block rounded-2xl bg-card border border-border p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg text-ink group-hover:text-primary line-clamp-1">{c.city}</h2>
                    <span className="text-xs font-semibold rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 whitespace-nowrap">
                      {c.count}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {countryName(c.country, locale) || "—"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SiteFooter locale={locale} />
    </div>
  );
}

function CitiesMap({ cities, locale }: { cities: CityRow[]; locale: LocaleCode }) {
  // Lazy import leaflet bits only on the client
  const Map = require("@/components/MapView") as typeof import("@/components/MapView");
  const { MapContainer, TileLayer, Marker, Popup, OSM_TILES, OSM_ATTRIBUTION } = Map;
  const center: [number, number] = cities.length
    ? [cities.reduce((s, c) => s + c.lat, 0) / cities.length, cities.reduce((s, c) => s + c.lng, 0) / cities.length]
    : [50, 10];
  const langPrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;

  return (
    <MapContainer center={center} zoom={4} scrollWheelZoom={false} style={{ width: "100%", height: "100%" }}>
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      {cities.map((c) => (
        <Marker key={c.slug} position={[c.lat, c.lng]}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{c.city}</div>
              <div className="text-muted-foreground">{c.count} {t(locale, "cities.venues")}</div>
              <a href={`${langPrefix}/stad/${c.slug}`} className="text-primary underline">
                {t(locale, "cities.viewCity")}
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
