import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientOnly } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Star, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EetGids — Vind het beste restaurant" },
      { name: "description", content: "Ontdek restaurants, cafés en bars bij jou in de buurt. Gratis kaart met OpenStreetMap data." },
      { property: "og:title", content: "EetGids — Restaurantgids op de kaart" },
      { property: "og:description", content: "Ontdek restaurants, cafés en bars in heel Nederland." },
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

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background z-20 px-4 py-3 flex items-center gap-4 shrink-0">
        <Link to="/" className="text-xl font-bold tracking-tight">
          🍽️ EetGids
        </Link>
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Zoek op naam, stad of keuken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
          Admin
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-96 border-r overflow-y-auto bg-background">
          <div className="p-4 text-sm text-muted-foreground border-b">
            {loading ? "Laden..." : `${filtered.length} restaurants`}
          </div>
          <ul>
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  to="/restaurant/$slug"
                  params={{ slug: r.slug }}
                  className="block p-4 border-b hover:bg-muted/50 transition-colors"
                >
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {r.address || r.city || "Onbekend adres"}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    {(r.avg_rating ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-600">
                        <Star className="w-3 h-3 fill-current" />
                        {Number(r.avg_rating).toFixed(1)} ({r.review_count})
                      </span>
                    )}
                    {r.cuisine?.slice(0, 2).map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
            {!loading && filtered.length === 0 && (
              <li className="p-6 text-sm text-muted-foreground text-center">
                Nog geen restaurants. Log in als admin om te importeren.
              </li>
            )}
          </ul>
        </aside>

        <main className="flex-1 relative">
          <ClientOnly fallback={<div className="h-full flex items-center justify-center text-muted-foreground">Kaart laden...</div>}>
            <RestaurantMap restaurants={filtered} />
          </ClientOnly>
        </main>
      </div>
    </div>
  );
}

function RestaurantMap({ restaurants }: { restaurants: Restaurant[] }) {
  const { MapContainer, TileLayer, Marker, Popup, OSM_ATTRIBUTION, OSM_TILES, coloredIcon } = require("@/components/MapView") as typeof import("@/components/MapView");
  return (
    <MapContainer center={[52.3676, 4.9041]} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      {restaurants.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={coloredIcon("red")}>
          <Popup>
            <div className="font-semibold">{r.name}</div>
            <div className="text-xs">{r.address}</div>
            <Link to="/restaurant/$slug" params={{ slug: r.slug }} className="text-xs text-blue-600 hover:underline">
              Bekijk →
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
