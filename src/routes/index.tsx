import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientOnly } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { MapPin, Search, Utensils, Coffee, Wine, Award, Heart, ChevronRight, Clock, Navigation2, X } from "lucide-react";
import heroImage from "@/assets/hero-dinner.jpg";
import { isOpenNow, cuisineLabel } from "@/lib/osm-labels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlaceResults — Ontdek de beste restaurants" },
      { name: "description", content: "Vind restaurants, cafés en bars met echte reviews en ratings. Plan jouw volgende eetafspraak met PlaceResults." },
      { property: "og:title", content: "PlaceResults — Restaurantgids met reviews" },
      { property: "og:description", content: "Vind restaurants, cafés en bars met echte reviews." },
    ],
  }),
  component: Home,
});

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  city: string | null;
  address: string | null;
  cuisine: string[] | null;
  avg_rating: number | null;
  review_count: number | null;
  opening_hours: string | null;
  raw_osm_tags: Record<string, string> | null;
};

const CARD_COLORS = [
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-lime-400 to-green-500",
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const PAGE_SIZE = 24;
const POPULAR_CUISINES = [
  "burger", "pizza", "italian", "chinese", "japanese", "sushi", "thai",
  "indian", "french", "mexican", "vietnamese", "mediterranean",
  "vegetarian", "vegan", "seafood", "kebab",
];

type SortKey = "popular" | "rating" | "distance" | "name";

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Home() {
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [openNow, setOpenNow] = useState(false);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [sort, setSort] = useState<SortKey>("popular");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const debouncedSearch = useDebounced(search, 300);

  const chipFilterCount = (openNow ? 1 : 0) + cuisines.length + (userPos ? 1 : 0);
  const prevChipCountRef = useRef(0);

  useEffect(() => {
    if (chipFilterCount > 0 && prevChipCountRef.current === 0) {
      const el = document.getElementById("ontdek");
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top > 80) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    prevChipCountRef.current = chipFilterCount;
  }, [chipFilterCount]);

  // Server-side search: re-runs when any filter changes; resets to page 0.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(0);
    const effectiveSort: SortKey = userPos && sort === "popular" ? "distance" : sort;
    supabase
      .rpc("search_restaurants", {
        _q: debouncedSearch || undefined,
        _cuisines: cuisines.length ? cuisines : undefined,
        _lat: userPos?.lat,
        _lng: userPos?.lng,
        _radius_km: userPos ? radiusKm : undefined,
        _sort: effectiveSort,
        _limit: PAGE_SIZE,
        _offset: 0,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[search]", error);
          setRestaurants([]);
          setTotal(0);
        } else {
          const rows = (data ?? []) as (Restaurant & { total_count: number })[];
          const filtered = openNow ? rows.filter((r) => isOpenNow(r.opening_hours) === true) : rows;
          setRestaurants(filtered);
          setTotal(Number(rows[0]?.total_count ?? 0));
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedSearch, cuisines, userPos, radiusKm, sort, openNow]);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const effectiveSort: SortKey = userPos && sort === "popular" ? "distance" : sort;
    const { data, error } = await supabase.rpc("search_restaurants", {
      _q: debouncedSearch || undefined,
      _cuisines: cuisines.length ? cuisines : undefined,
      _lat: userPos?.lat,
      _lng: userPos?.lng,
      _radius_km: userPos ? radiusKm : undefined,
      _sort: effectiveSort,
      _limit: PAGE_SIZE,
      _offset: nextPage * PAGE_SIZE,
    });
    if (!error && data) {
      const rows = data as (Restaurant & { total_count: number })[];
      const add = openNow ? rows.filter((r) => isOpenNow(r.opening_hours) === true) : rows;
      setRestaurants((prev) => [...prev, ...add]);
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  const allCuisines = POPULAR_CUISINES;

  const toggleCuisine = (c: string) =>
    setCuisines((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const useNearby = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("Locatie niet ondersteund door je browser");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message || "Kon je locatie niet ophalen");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const clearFilters = () => {
    setSearch("");
    setOpenNow(false);
    setCuisines([]);
    setUserPos(null);
    setSort("popular");
  };

  const activeFilterCount =
    (search ? 1 : 0) + (openNow ? 1 : 0) + cuisines.length + (userPos ? 1 : 0);

  const hasMore = restaurants.length < total;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero search={search} setSearch={setSearch} />
      <FilterBar
        openNow={openNow}
        setOpenNow={setOpenNow}
        cuisines={cuisines}
        toggleCuisine={toggleCuisine}
        allCuisines={allCuisines}
        useNearby={useNearby}
        userPos={userPos}
        clearNearby={() => setUserPos(null)}
        radiusKm={radiusKm}
        setRadiusKm={setRadiusKm}
        geoError={geoError}
        geoLoading={geoLoading}
        resultCount={total}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        sort={sort}
        setSort={setSort}
      />
      <Categories />
      <TopRated items={restaurants.slice(0, 8)} loading={loading} />
      <MapSection restaurants={restaurants} />
      <AllList
        restaurants={restaurants}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMore}
        loadingMore={loadingMore}
        total={total}
      />
      <SiteFooter />
    </div>
  );
}

function FilterBar({
  openNow, setOpenNow, cuisines, toggleCuisine, allCuisines,
  useNearby, userPos, clearNearby, radiusKm, setRadiusKm,
  geoError, geoLoading, resultCount, activeFilterCount, clearFilters,
  sort, setSort,
}: {
  openNow: boolean; setOpenNow: (b: boolean) => void;
  cuisines: string[]; toggleCuisine: (c: string) => void; allCuisines: string[];
  useNearby: () => void; userPos: { lat: number; lng: number } | null; clearNearby: () => void;
  radiusKm: number; setRadiusKm: (n: number) => void;
  geoError: string | null; geoLoading: boolean;
  resultCount: number; activeFilterCount: number; clearFilters: () => void;
  sort: SortKey; setSort: (s: SortKey) => void;
}) {
  return (
    <section id="filters" className="border-b border-border bg-card sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={openNow ? "default" : "outline"}
            size="sm"
            onClick={() => setOpenNow(!openNow)}
            className="rounded-full gap-1.5"
          >
            <Clock className="w-4 h-4" /> Open nu
          </Button>
          <Button
            variant={userPos ? "default" : "outline"}
            size="sm"
            onClick={userPos ? clearNearby : useNearby}
            disabled={geoLoading}
            className="rounded-full gap-1.5"
          >
            <Navigation2 className="w-4 h-4" />
            {geoLoading ? "Zoeken..." : userPos ? `In de buurt (${radiusKm} km)` : "In de buurt"}
          </Button>
          {userPos && (
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="h-9 rounded-full border border-input bg-background px-3 text-sm"
              aria-label="Zoekradius"
            >
              {[1, 2, 5, 10, 25, 50].map((k) => (
                <option key={k} value={k}>{k} km</option>
              ))}
            </select>
          )}
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-full gap-1 text-muted-foreground">
              <X className="w-4 h-4" /> Wis filters ({activeFilterCount})
            </Button>
          )}
          <div className="ml-auto text-sm text-muted-foreground">
            {resultCount} resultaten
          </div>
        </div>

        {allCuisines.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Keuken:</span>
            {allCuisines.map((c) => {
              const active = cuisines.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  {cuisineLabel(c)}
                </button>
              );
            })}
          </div>
        )}

        {geoError && <div className="text-xs text-destructive">{geoError}</div>}
      </div>
    </section>
  );
}


function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-extrabold text-lg">●</span>
          <span className="font-display text-xl text-ink">PlaceResults</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-foreground/80">
          <a href="#ontdek" className="hover:text-primary">Restaurants</a>
          <a href="#kaart" className="hover:text-primary">Kaart</a>
          <a href="#top" className="hover:text-primary">Top beoordeeld</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="text-sm font-semibold px-4 py-2 rounded-full hover:bg-muted">Inloggen</Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ search, setSearch }: { search: string; setSearch: (s: string) => void }) {
  return (
    <section className="relative">
      <div className="relative h-[480px] sm:h-[560px] overflow-hidden">
        <img
          src={heroImage}
          alt="Vrienden genieten van een diner op een zonnig terras"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <h1 className="font-display text-white text-4xl sm:text-6xl lg:text-7xl leading-[1.05] max-w-3xl drop-shadow-lg">
              Waar wil je vandaag<br />gaan eten?
            </h1>
            <p className="mt-4 text-white/90 text-base sm:text-lg max-w-xl drop-shadow">
              Ontdek restaurants, cafés en bars met echte reviews van bezoekers.
            </p>
          </div>
        </div>
      </div>

      {/* Floating search bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="bg-card rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] border border-border p-2 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-2">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input
              placeholder="Zoek restaurants, keukens of steden..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-11 px-0 text-base bg-transparent"
            />
          </div>
          <Button size="lg" className="h-12 px-8 rounded-xl font-bold" asChild>
            <a href="#ontdek">Zoeken</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const cats = [
    { icon: Utensils, label: "Restaurants", tint: "bg-emerald-50 text-emerald-700" },
    { icon: Coffee, label: "Cafés", tint: "bg-amber-50 text-amber-700" },
    { icon: Wine, label: "Bars", tint: "bg-rose-50 text-rose-700" },
    { icon: Award, label: "Top beoordeeld", tint: "bg-sky-50 text-sky-700" },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-4">
      <h2 className="font-display text-2xl sm:text-3xl text-ink mb-6">Verken op categorie</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cats.map((c) => (
          <a
            key={c.label}
            href="#ontdek"
            className="group flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/40 transition-all"
          >
            <span className={`grid place-items-center w-12 h-12 rounded-xl ${c.tint}`}>
              <c.icon className="w-6 h-6" />
            </span>
            <span className="font-bold text-foreground group-hover:text-primary transition-colors">{c.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function RatingDots({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${v} van 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-3.5 h-3.5 rounded-full border ${i < Math.round(v) ? "bg-rating border-rating" : "bg-transparent border-rating/40"}`}
        />
      ))}
    </span>
  );
}

function TopRated({ items, loading }: { items: Restaurant[]; loading: boolean }) {
  return (
    <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl text-ink">Aanbevolen voor jou</h2>
          <p className="text-muted-foreground mt-1">Populaire plekken op basis van reviews</p>
        </div>
        <a href="#kaart" className="hidden sm:inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          Bekijk alles <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.slice(0, 8).map((r, i) => (
            <RestaurantCard key={r.id} r={r} colorIdx={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function RestaurantCard({ r, colorIdx = 0 }: { r: Restaurant; colorIdx?: number }) {
  const initial = r.name.charAt(0).toUpperCase();
  const color = CARD_COLORS[colorIdx % CARD_COLORS.length];
  const rating = Number(r.avg_rating ?? 0);
  return (
    <Link
      to="/restaurant/$slug"
      params={{ slug: r.slug }}
      className="group block rounded-2xl overflow-hidden bg-card border border-border hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className={`relative h-44 bg-gradient-to-br ${color} grid place-items-center`}>
        <span className="font-display text-7xl text-white/95 drop-shadow">{initial}</span>
        <button
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 grid place-items-center hover:scale-110 transition-transform"
          onClick={(e) => { e.preventDefault(); }}
          aria-label="Opslaan"
        >
          <Heart className="w-4 h-4 text-foreground" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg text-ink group-hover:text-primary transition-colors line-clamp-1">
          {r.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-sm">
          <RatingDots value={rating} />
          <span className="text-muted-foreground text-xs">
            {rating > 0 ? `${rating.toFixed(1)} · ${r.review_count} reviews` : "Nog geen reviews"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {r.address || r.city || "Adres onbekend"}
        </p>
        {r.cuisine && r.cuisine.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {r.cuisine.slice(0, 2).map((c) => (
              <span key={c} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold capitalize">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function MapSection({ restaurants }: { restaurants: Restaurant[] }) {
  return (
    <section id="kaart" className="bg-secondary/40 border-y border-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-ink">Op de kaart</h2>
            <p className="text-muted-foreground mt-1">{restaurants.length} locaties in de buurt</p>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-border h-[500px] sm:h-[600px] shadow-sm bg-card">
          <ClientOnly fallback={<div className="h-full grid place-items-center text-muted-foreground">Kaart laden...</div>}>
            <RestaurantMap restaurants={restaurants} />
          </ClientOnly>
        </div>
      </div>
    </section>
  );
}

function RestaurantMap({ restaurants }: { restaurants: Restaurant[] }) {
  const [mod, setMod] = useState<typeof import("@/components/MapView") | null>(null);
  useEffect(() => {
    import("@/components/MapView").then(setMod);
  }, []);
  if (!mod) return <div className="h-full grid place-items-center text-muted-foreground">Kaart laden...</div>;
  const { MapContainer, TileLayer, Marker, Popup, OSM_ATTRIBUTION, OSM_TILES, coloredIcon } = mod;
  const center: [number, number] = restaurants.length > 0 ? [restaurants[0].lat, restaurants[0].lng] : [52.3676, 4.9041];
  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      {restaurants.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={coloredIcon("green")}>
          <Popup>
            <div className="font-semibold">{r.name}</div>
            <div className="text-xs">{r.address}</div>
            <Link to="/restaurant/$slug" params={{ slug: r.slug }} className="text-xs text-primary hover:underline">
              Bekijk →
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}


function AllList({ restaurants, loading }: { restaurants: Restaurant[]; loading: boolean }) {
  if (loading || restaurants.length === 0) return null;
  return (
    <section id="ontdek" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="font-display text-3xl sm:text-4xl text-ink mb-8">Alle restaurants</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {restaurants.slice(0, 24).map((r, i) => (
          <RestaurantCard key={r.id} r={r} colorIdx={i + 2} />
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-border bg-secondary/30">
      <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-display text-2xl text-ink">Nog geen restaurants</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Log in als admin en importeer restaurants vanuit OpenStreetMap met één klik op de kaart.
      </p>
      <Button asChild className="mt-6">
        <Link to="/auth">Naar admin</Link>
      </Button>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-4 gap-8 text-sm">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2 text-white">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-accent text-ink font-extrabold">●</span>
            <span className="font-display text-xl">PlaceResults</span>
          </div>
          <p className="mt-3 max-w-sm leading-relaxed">
            De eerlijke gids voor restaurants, cafés en bars — gebouwd op open data en echte reviews.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-3">Verkennen</h4>
          <ul className="space-y-2">
            <li><a href="#ontdek" className="hover:text-accent">Restaurants</a></li>
            <li><a href="#kaart" className="hover:text-accent">Kaart</a></li>
            <li><a href="#top" className="hover:text-accent">Top beoordeeld</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-3">Over</h4>
          <p>Data via <a href="https://www.openstreetmap.org" className="underline hover:text-accent">OpenStreetMap</a>.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} PlaceResults
      </div>
    </footer>
  );
}
