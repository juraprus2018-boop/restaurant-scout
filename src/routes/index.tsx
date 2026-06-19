import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientOnly } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Search, Utensils, Coffee, Wine, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-dinner.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EetGids — Ontdek de beste restaurants in jouw stad" },
      { name: "description", content: "Een eerlijke restaurantgids: ontdek bistro's, cafés en fine dining op de kaart, lees reviews en vind jouw nieuwe favoriete plek." },
      { property: "og:title", content: "EetGids — Restaurantgids op de kaart" },
      { property: "og:description", content: "Ontdek restaurants, cafés en bistro's bij jou in de buurt." },
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
};

function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("restaurants")
      .select("id,name,slug,lat,lng,city,address,cuisine,avg_rating,review_count")
      .order("review_count", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setRestaurants((data ?? []) as Restaurant[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q) ||
        r.cuisine?.some((c) => c.toLowerCase().includes(q)),
    );
  }, [restaurants, search]);

  const featured = useMemo(
    () => [...restaurants].filter((r) => (r.avg_rating ?? 0) > 0).slice(0, 6),
    [restaurants],
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero search={search} setSearch={setSearch} count={restaurants.length} />
      <Categories />
      <FeaturedSection featured={featured} loading={loading} fallback={restaurants.slice(0, 6)} />
      <MapSection restaurants={filtered} />
      <ListSection restaurants={filtered} loading={loading} />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="absolute top-0 inset-x-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl font-bold text-cream tracking-tight flex items-center gap-2">
          <span className="text-accent">●</span> EetGids
        </Link>
        <nav className="flex items-center gap-2 sm:gap-6 text-sm text-cream/90">
          <a href="#ontdek" className="hidden sm:inline hover:text-accent transition-colors">Ontdekken</a>
          <a href="#kaart" className="hidden sm:inline hover:text-accent transition-colors">Kaart</a>
          <Link to="/auth" className="px-3 py-1.5 rounded-full border border-cream/30 hover:bg-cream/10 transition-colors">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero({ search, setSearch, count }: { search: string; setSearch: (s: string) => void; count: number }) {
  return (
    <section className="relative min-h-[88vh] flex items-end overflow-hidden">
      <img
        src={heroImage}
        alt="Sfeervolle restauranttafel met kaarsen en pasta"
        className="absolute inset-0 w-full h-full object-cover"
        width={1600}
        height={1024}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 pt-32 w-full">
        <p className="text-accent text-xs sm:text-sm uppercase tracking-[0.3em] mb-4 font-medium">
          · Een eerlijke gids ·
        </p>
        <h1 className="font-display text-cream text-5xl sm:text-7xl lg:text-8xl font-medium leading-[0.95] max-w-4xl">
          Ontdek waar de <em className="text-accent italic font-normal">echte</em><br />
          smaak woont.
        </h1>
        <p className="mt-6 text-cream/80 text-base sm:text-lg max-w-xl leading-relaxed">
          Van buurtbistro tot fine dining — verken {count > 0 ? `${count}+` : "duizenden"} restaurants, cafés en bars op de kaart.
        </p>

        <div className="mt-10 max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-2 p-2 bg-cream/95 backdrop-blur rounded-2xl shadow-2xl">
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Zoek op naam, stad of keuken..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 text-base h-12 px-0 bg-transparent text-ink placeholder:text-muted-foreground"
              />
            </div>
            <Button size="lg" className="h-12 px-8 rounded-xl" asChild>
              <a href="#ontdek">Verkennen</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const cats = [
    { icon: Utensils, label: "Restaurants" },
    { icon: Coffee, label: "Cafés" },
    { icon: Wine, label: "Bars & Bistro's" },
    { icon: Star, label: "Top beoordeeld" },
  ];
  return (
    <section className="border-b border-border bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cats.map((c) => (
          <a
            key={c.label}
            href="#ontdek"
            className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-secondary transition-colors"
          >
            <span className="grid place-items-center w-11 h-11 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
              <c.icon className="w-5 h-5" />
            </span>
            <span className="font-medium text-foreground text-sm sm:text-base">{c.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function FeaturedSection({ featured, loading, fallback }: { featured: Restaurant[]; loading: boolean; fallback: Restaurant[] }) {
  const items = featured.length > 0 ? featured : fallback;
  return (
    <section id="ontdek" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
        <div>
          <p className="text-primary text-xs uppercase tracking-[0.25em] mb-3 font-semibold">Uitgelicht</p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium text-foreground">
            Door bezoekers <em className="italic text-primary">aanbevolen</em>
          </h2>
        </div>
        <a href="#kaart" className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          Alles op de kaart <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((r) => (
            <RestaurantCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </section>
  );
}

function RestaurantCard({ r }: { r: Restaurant }) {
  const initial = r.name.charAt(0).toUpperCase();
  return (
    <Link
      to="/restaurant/$slug"
      params={{ slug: r.slug }}
      className="group block rounded-2xl overflow-hidden border border-border bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative h-44 bg-gradient-to-br from-primary/80 via-primary to-primary/60 grid place-items-center overflow-hidden">
        <span className="font-display text-7xl text-cream/90 font-medium">{initial}</span>
        {(r.avg_rating ?? 0) > 0 && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream/95 text-ink text-xs font-semibold">
            <Star className="w-3 h-3 fill-accent text-accent" />
            {Number(r.avg_rating).toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {r.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {r.address || r.city || "Adres onbekend"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          {r.cuisine?.slice(0, 3).map((c) => (
            <span key={c} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs capitalize">
              {c}
            </span>
          ))}
          {(r.review_count ?? 0) > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">{r.review_count} reviews</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function MapSection({ restaurants }: { restaurants: Restaurant[] }) {
  return (
    <section id="kaart" className="bg-ink text-cream py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-accent text-xs uppercase tracking-[0.25em] mb-3 font-semibold">Verken</p>
            <h2 className="font-display text-4xl sm:text-5xl font-medium">
              Alles op de <em className="italic text-accent">kaart</em>
            </h2>
          </div>
          <span className="text-sm text-cream/60">{restaurants.length} locaties</span>
        </div>
        <div className="relative rounded-2xl overflow-hidden border border-cream/10 h-[500px] sm:h-[600px] shadow-2xl">
          <ClientOnly fallback={<div className="h-full grid place-items-center text-cream/50">Kaart laden...</div>}>
            <RestaurantMap restaurants={restaurants} />
          </ClientOnly>
        </div>
      </div>
    </section>
  );
}

function RestaurantMap({ restaurants }: { restaurants: Restaurant[] }) {
  const { MapContainer, TileLayer, Marker, Popup, OSM_ATTRIBUTION, OSM_TILES, coloredIcon } = require("@/components/MapView") as typeof import("@/components/MapView");
  const center: [number, number] = restaurants.length > 0 ? [restaurants[0].lat, restaurants[0].lng] : [52.3676, 4.9041];
  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      {restaurants.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={coloredIcon("red")}>
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

function ListSection({ restaurants, loading }: { restaurants: Restaurant[]; loading: boolean }) {
  if (loading || restaurants.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h2 className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-8">
        Alle restaurants
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.slice(0, 24).map((r) => (
          <Link
            key={r.id}
            to="/restaurant/$slug"
            params={{ slug: r.slug }}
            className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-secondary/40 transition-colors"
          >
            <span className="grid place-items-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-display font-semibold shrink-0">
              {r.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground truncate">{r.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {r.city || r.address || "—"}
              </div>
              {(r.avg_rating ?? 0) > 0 && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-primary font-medium">
                  <Star className="w-3 h-3 fill-current" />
                  {Number(r.avg_rating).toFixed(1)} · {r.review_count}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-border bg-secondary/30">
      <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-display text-2xl font-medium text-foreground">Nog geen restaurants</h3>
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
    <footer className="bg-ink text-cream/70 border-t border-cream/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-display text-2xl text-cream font-bold flex items-center gap-2">
            <span className="text-accent">●</span> EetGids
          </div>
          <p className="mt-3 leading-relaxed">Een eerlijke gids voor restaurants, cafés en bars. Open data, eerlijke reviews.</p>
        </div>
        <div>
          <h4 className="text-cream font-semibold mb-3">Verkennen</h4>
          <ul className="space-y-2">
            <li><a href="#ontdek" className="hover:text-accent">Uitgelicht</a></li>
            <li><a href="#kaart" className="hover:text-accent">Kaart</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-cream font-semibold mb-3">Data</h4>
          <p>Restaurantdata via <a href="https://www.openstreetmap.org" className="underline hover:text-accent">OpenStreetMap</a> — vrij & open.</p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} EetGids
      </div>
    </footer>
  );
}
