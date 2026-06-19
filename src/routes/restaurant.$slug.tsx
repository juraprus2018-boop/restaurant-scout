import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientOnly } from "@tanstack/react-router";
import { Star, MapPin, Phone, Globe, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/restaurant/$slug")({
  ssr: false,
  component: RestaurantPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Restaurant niet gevonden</h1>
      <Link to="/" className="text-primary hover:underline">← Terug</Link>
    </div>
  ),
});

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  address: string | null;
  city: string | null;
  cuisine: string[] | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  avg_rating: number | null;
  review_count: number | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
};

function RestaurantPage() {
  const { slug } = Route.useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const { data: r } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
    if (!r) throw notFound();
    setRestaurant(r as Restaurant);
    const { data: rev } = await supabase
      .from("reviews")
      .select("id,rating,comment,created_at,user_id")
      .eq("restaurant_id", r.id)
      .order("created_at", { ascending: false });
    setReviews((rev ?? []) as Review[]);
    const { data: u } = await supabase.auth.getUser();
    setUser(u.user);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [slug]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").upsert({
      restaurant_id: restaurant.id,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
    }, { onConflict: "restaurant_id,user_id" });
    setSubmitting(false);
    if (error) {
      alert(error.message);
      return;
    }
    setComment("");
    await load();
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  if (!restaurant) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-background border-b px-4 py-3">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Terug naar kaart
        </Link>
      </header>

      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              {(restaurant.avg_rating ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Star className="w-4 h-4 fill-current" />
                  {Number(restaurant.avg_rating).toFixed(1)} ({restaurant.review_count} reviews)
                </span>
              )}
              {restaurant.cuisine?.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-full bg-muted">{c}</span>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden h-64">
            <ClientOnly fallback={<div className="h-full bg-muted" />}>
              {() => <DetailMap lat={restaurant.lat} lng={restaurant.lng} name={restaurant.name} />}
            </ClientOnly>
          </Card>

          <section>
            <h2 className="text-xl font-semibold mb-3">Reviews</h2>
            {user ? (
              <form onSubmit={submitReview} className="bg-background border rounded-lg p-4 mb-4 space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)}>
                      <Star className={`w-6 h-6 ${n <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <Textarea placeholder="Vertel over je ervaring..." value={comment} onChange={(e) => setComment(e.target.value)} />
                <Button type="submit" disabled={submitting}>{submitting ? "Versturen..." : "Plaats review"}</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                <Link to="/auth" className="text-primary hover:underline">Log in</Link> om een review te plaatsen.
              </p>
            )}
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-background border rounded-lg p-4">
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${n <= r.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("nl-NL")}</p>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-sm text-muted-foreground">Nog geen reviews.</p>}
            </div>
          </section>
        </div>

        <aside className="space-y-3 text-sm">
          {restaurant.address && (
            <div className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>{restaurant.address}{restaurant.city && `, ${restaurant.city}`}</span></div>
          )}
          {restaurant.phone && (
            <div className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><a href={`tel:${restaurant.phone}`} className="hover:underline">{restaurant.phone}</a></div>
          )}
          {restaurant.website && (
            <div className="flex gap-2"><Globe className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><a href={restaurant.website} target="_blank" rel="noopener" className="hover:underline truncate">{restaurant.website}</a></div>
          )}
          {restaurant.opening_hours && (
            <div className="flex gap-2"><Clock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span className="whitespace-pre-wrap">{restaurant.opening_hours}</span></div>
          )}
        </aside>
      </div>
    </div>
  );
}

function DetailMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const { MapContainer, TileLayer, Marker, Popup, OSM_ATTRIBUTION, OSM_TILES } = require("@/components/MapView") as typeof import("@/components/MapView");
  return (
    <MapContainer center={[lat, lng]} zoom={16} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      <Marker position={[lat, lng]}><Popup>{name}</Popup></Marker>
    </MapContainer>
  );
}
