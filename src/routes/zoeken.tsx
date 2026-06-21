import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { importOsmForQuery } from "@/lib/osm-import.functions";
import { MapPin, Star, Navigation, Clock } from "lucide-react";
// @ts-ignore - no types shipped
import OpeningHours from "opening_hours";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/zoeken")({
  validateSearch: searchSchema,
  head: ({ match }) => {
    const q = (match.search as { q?: string }).q || "";
    return {
      meta: [
        { title: q ? `Zoekresultaten voor "${q}", PlaceResults` : "Zoeken, PlaceResults" },
        { name: "description", content: `Zoekresultaten voor restaurants${q ? ` bij ${q}` : ""}.` },
        { name: "robots", content: "noindex,follow" },
      ],
    };
  },
  component: SearchPage,
});

type Row = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  city: string | null;
  address: string | null;
  avg_rating: number | null;
  review_count: number | null;
  opening_hours: string | null;
};

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function isOpenNow(spec: string | null): boolean | null {
  if (!spec) return null;
  try {
    const oh = new OpeningHours(spec);
    return oh.getState() as boolean;
  } catch {
    return null;
  }
}

function SearchPage() {
  const { q } = Route.useSearch();
  const [search, setSearch] = useState(q);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [requestingLoc, setRequestingLoc] = useState(false);
  const runImport = useServerFn(importOsmForQuery);

  useEffect(() => setSearch(q), [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImporting(false);
    (async () => {
      const { data } = await supabase.rpc("search_restaurants", {
        _q: q || undefined,
        _limit: 60,
        _offset: 0,
        _sort: "popular",
      });
      if (cancelled) return;
      const dbRows = ((data ?? []) as Row[]).filter((r) => r.lat && r.lng);
      if (dbRows.length > 0 || !q.trim()) {
        setRows(dbRows);
        setLoading(false);
        return;
      }
      setLoading(false);
      setImporting(true);
      try {
        const res = await runImport({ data: { q } });
        if (cancelled) return;
        const fresh = ((res?.rows ?? []) as Row[]).filter((r) => r.lat && r.lng);
        setRows(fresh);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setImporting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, runImport]);

  useEffect(() => {
    if (!q.trim()) {
      setGeo(null);
      return;
    }
    let cancelled = false;
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { Accept: "application/json" } },
    )
      .then((r) => r.json())
      .then((data: Array<{ lat: string; lon: string; display_name: string }>) => {
        if (cancelled || !data?.[0]) return;
        setGeo({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          label: data[0].display_name,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [q]);

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocError("Geolocatie niet ondersteund");
      return;
    }
    setRequestingLoc(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        setRequestingLoc(false);
      },
      (err) => {
        setLocError(err.message || "Locatie geweigerd");
        setRequestingLoc(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const enriched = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      open: isOpenNow(r.opening_hours),
      distanceKm: userLoc ? haversineKm(userLoc, [r.lat, r.lng]) : null,
    }));
  }, [rows, userLoc]);

  const sorted = useMemo(() => {
    if (!userLoc) return enriched;
    return [...enriched].sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  }, [enriched, userLoc]);

  const center = useMemo<[number, number]>(() => {
    if (geo) return [geo.lat, geo.lng];
    if (rows[0]) return [rows[0].lat, rows[0].lng];
    return [52.3676, 4.9041];
  }, [geo, rows]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-background rounded-2xl border border-border shadow-sm flex gap-2 p-2">
            <SearchAutocomplete value={search} onChange={setSearch} />
          </div>
          <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
            {q && (
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Zoeken..."
                  : importing
                  ? `Nieuwe restaurants ophalen voor "${q}"...`
                  : `${rows.length} resultaten voor "${q}"`}
              </p>
            )}
            {!userLoc ? (
              <button
                type="button"
                onClick={requestLocation}
                disabled={requestingLoc}
                className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-60"
              >
                <Navigation className="w-4 h-4" />
                {requestingLoc ? "Locatie ophalen..." : "Deel mijn locatie"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-emerald-700">
                <Navigation className="w-4 h-4" /> Locatie gedeeld, sorteert op afstand
              </span>
            )}
          </div>
          {locError && <p className="text-xs text-destructive mt-2">{locError}</p>}
        </div>
      </section>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_1.1fr] gap-6">
        <div className="order-2 lg:order-1 space-y-3">
          {loading || importing ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-border">
              <p className="text-muted-foreground">Geen restaurants gevonden voor "{q}".</p>
              <p className="text-xs text-muted-foreground mt-2">Probeer een stad of land.</p>
            </div>
          ) : (
            sorted.map((r) => (
              <Link
                key={r.id}
                to="/restaurant/$slug"
                params={{ slug: r.slug }}
                className="block p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-foreground truncate">{r.name}</h3>
                    {r.address && (
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {r.address}
                        {r.city ? `, ${r.city}` : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {r.open === true && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <Clock className="w-3 h-3" /> Open nu
                        </span>
                      )}
                      {r.open === false && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          <Clock className="w-3 h-3" /> Gesloten
                        </span>
                      )}
                      {r.distanceKm !== null && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">
                          <Navigation className="w-3 h-3" />
                          {r.distanceKm < 1
                            ? `${Math.round(r.distanceKm * 1000)} m`
                            : `${r.distanceKm.toFixed(1)} km`}
                        </span>
                      )}
                    </div>
                  </div>
                  {typeof r.avg_rating === "number" && r.avg_rating > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700 shrink-0">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      {r.avg_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-20 self-start">
          <div className="relative isolate rounded-2xl overflow-hidden border border-border h-[60vh] lg:h-[calc(100vh-9rem)] bg-card">
            <ClientOnly fallback={<div className="h-full grid place-items-center text-muted-foreground">Kaart laden...</div>}>
              <ResultsMap center={center} rows={rows} pin={geo} userLoc={userLoc} />
            </ClientOnly>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function ResultsMap({
  center,
  rows,
  pin,
  userLoc,
}: {
  center: [number, number];
  rows: Row[];
  pin: { lat: number; lng: number; label: string } | null;
  userLoc: [number, number] | null;
}) {
  const [mod, setMod] = useState<typeof import("@/components/MapView") | null>(null);
  useEffect(() => {
    import("@/components/MapView").then(setMod);
  }, []);
  if (!mod) return <div className="h-full grid place-items-center text-muted-foreground">Kaart laden...</div>;
  const { MapContainer, TileLayer, Marker, Popup, OSM_TILES, OSM_ATTRIBUTION, FlyTo, ClusterLayer, coloredIcon } = mod;
  return (
    <MapContainer center={center} zoom={pin ? 13 : 6} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      <FlyTo center={center} zoom={pin ? 13 : rows.length ? 11 : 6} />
      {pin && (
        <Marker position={[pin.lat, pin.lng]} icon={coloredIcon("red")}>
          <Popup>
            <strong>Gezochte locatie</strong>
            <div style={{ fontSize: 12, color: "#666" }}>{pin.label}</div>
          </Popup>
        </Marker>
      )}
      {userLoc && (
        <Marker position={userLoc} icon={coloredIcon("blue")}>
          <Popup>Jouw locatie</Popup>
        </Marker>
      )}
      <ClusterLayer points={rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, lat: r.lat, lng: r.lng, address: r.address }))} />
    </MapContainer>
  );
}
