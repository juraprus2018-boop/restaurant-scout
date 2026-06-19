import { createFileRoute, Link, notFound, ClientOnly } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Star, MapPin, Phone, Globe, Clock, ArrowLeft, Mail, Accessibility,
  Wifi, CreditCard, Utensils, Cigarette, Leaf, ShoppingBag, Truck,
  Sun, Users, Baby, Dog, ParkingCircle, ExternalLink, Tag,
} from "lucide-react";
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
  country: string | null;
  cuisine: string[] | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  avg_rating: number | null;
  review_count: number | null;
  osm_id: number | null;
  osm_type: string | null;
  raw_osm_tags: Record<string, string> | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
};

const YES = (v?: string) => v === "yes" || v === "designated" || v === "limited" || v === "only";
const NO = (v?: string) => v === "no";

function commonsImageUrl(tag: string): string | null {
  // tag like "File:Foo.jpg" or "Foo.jpg" or full URL
  if (!tag) return null;
  if (tag.startsWith("http")) return tag;
  const clean = tag.replace(/^File:/, "").replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=1200`;
}

function RestaurantPage() {
  const { slug } = Route.useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

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

  useEffect(() => { load(); }, [slug]);

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
    if (error) { alert(error.message); return; }
    setComment("");
    await load();
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;
  if (!restaurant) return null;

  const t = restaurant.raw_osm_tags ?? {};
  const description = t.description || t["description:nl"] || t["description:en"] || null;
  const brand = t.brand || t.operator || null;
  const email = t.email || t["contact:email"] || null;
  const facebook = t["contact:facebook"] || t.facebook || null;
  const instagram = t["contact:instagram"] || t.instagram || null;
  const twitter = t["contact:twitter"] || t.twitter || null;
  const image = t.image ? commonsImageUrl(t.image) : (t.wikimedia_commons ? commonsImageUrl(t.wikimedia_commons) : null);
  const wikipedia = t.wikipedia ? `https://${(t.wikipedia.split(":")[0]) || "en"}.wikipedia.org/wiki/${encodeURIComponent(t.wikipedia.split(":").slice(1).join(":"))}` : null;
  const capacity = t.capacity || t["capacity:persons"] || null;
  const stars = t.stars || null;
  const michelin = t["michelin_stars"] || t["michelin:stars"] || null;
  const startDate = t.start_date || null;

  const diets: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(t)) {
    if (k.startsWith("diet:") && YES(v)) diets.push([k.replace("diet:", ""), v]);
  }
  const payments: string[] = [];
  for (const [k, v] of Object.entries(t)) {
    if (k.startsWith("payment:") && YES(v)) payments.push(k.replace("payment:", ""));
  }

  const features: Array<{ icon: any; label: string; ok: boolean | null }> = [
    { icon: Truck, label: "Bezorging", ok: YES(t.delivery) ? true : NO(t.delivery) ? false : null },
    { icon: ShoppingBag, label: "Afhalen", ok: YES(t.takeaway) ? true : NO(t.takeaway) ? false : null },
    { icon: Sun, label: "Terras", ok: YES(t.outdoor_seating) ? true : NO(t.outdoor_seating) ? false : null },
    { icon: Accessibility, label: "Rolstoeltoegankelijk", ok: YES(t.wheelchair) ? true : NO(t.wheelchair) ? false : null },
    { icon: Wifi, label: "Wifi", ok: YES(t.internet_access) || t.internet_access === "wlan" ? true : NO(t.internet_access) ? false : null },
    { icon: Cigarette, label: "Roken toegestaan", ok: YES(t.smoking) ? true : NO(t.smoking) ? false : null },
    { icon: Baby, label: "Kindvriendelijk", ok: YES(t["kids_area"]) || YES(t["child_friendly"]) ? true : null },
    { icon: Dog, label: "Honden welkom", ok: YES(t.dog) ? true : NO(t.dog) ? false : null },
    { icon: ParkingCircle, label: "Parkeren", ok: YES(t.parking) ? true : null },
    { icon: CreditCard, label: "Kaart betalen", ok: payments.length > 0 ? true : NO(t["payment:cards"]) ? false : null },
  ].filter((f) => f.ok !== null);

  const osmUrl = restaurant.osm_id && restaurant.osm_type
    ? `https://www.openstreetmap.org/${restaurant.osm_type}/${restaurant.osm_id}`
    : null;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-background border-b px-4 py-3">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Terug naar kaart
        </Link>
      </header>

      {image && (
        <div className="w-full h-72 bg-muted overflow-hidden">
          <img src={image} alt={restaurant.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            {brand && <p className="text-sm text-muted-foreground mt-1">{brand}</p>}
            <div className="flex items-center flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
              {(restaurant.avg_rating ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Star className="w-4 h-4 fill-current" />
                  {Number(restaurant.avg_rating).toFixed(1)} ({restaurant.review_count} reviews)
                </span>
              )}
              {michelin && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">★ {michelin} Michelin</span>}
              {stars && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{stars} sterren</span>}
              {restaurant.cuisine?.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-full bg-muted capitalize">{c.replace(/_/g, " ")}</span>
              ))}
              {t.amenity && <span className="px-2 py-0.5 rounded-full bg-muted capitalize">{t.amenity.replace(/_/g, " ")}</span>}
            </div>
          </div>

          {description && (
            <Card className="p-4">
              <h2 className="font-semibold mb-2">Over</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
            </Card>
          )}

          {features.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Voorzieningen</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {features.map((f) => (
                  <div key={f.label} className={`flex items-center gap-2 ${f.ok ? "" : "text-muted-foreground line-through"}`}>
                    <f.icon className="w-4 h-4 shrink-0" />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {diets.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Leaf className="w-4 h-4" /> Dieetopties</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {diets.map(([d]) => (
                  <span key={d} className="px-2 py-1 rounded-full bg-green-100 text-green-800 capitalize">{d.replace(/_/g, " ")}</span>
                ))}
              </div>
            </Card>
          )}

          {payments.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Betaalmethoden</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {payments.map((p) => (
                  <span key={p} className="px-2 py-1 rounded-full bg-muted capitalize">{p.replace(/_/g, " ")}</span>
                ))}
              </div>
            </Card>
          )}

          <Card className="overflow-hidden h-64">
            <ClientOnly fallback={<div className="h-full bg-muted" />}>
              <DetailMap lat={restaurant.lat} lng={restaurant.lng} name={restaurant.name} />
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

          <Card className="p-4">
            <button
              onClick={() => setShowAllTags((s) => !s)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Tag className="w-4 h-4" /> {showAllTags ? "Verberg" : "Toon"} alle OSM-tags ({Object.keys(t).length})
            </button>
            {showAllTags && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono max-h-96 overflow-auto">
                {Object.entries(t).sort().map(([k, v]) => (
                  <div key={k} className="truncate"><span className="text-muted-foreground">{k}=</span><span>{v}</span></div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-3 text-sm">
          <Card className="p-4 space-y-3">
            {(restaurant.address || restaurant.city) && (
              <div className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>{restaurant.address}{restaurant.city && `, ${restaurant.city}`}{restaurant.country && `, ${restaurant.country}`}</span></div>
            )}
            {restaurant.phone && (
              <div className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><a href={`tel:${restaurant.phone}`} className="hover:underline">{restaurant.phone}</a></div>
            )}
            {email && (
              <div className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><a href={`mailto:${email}`} className="hover:underline truncate">{email}</a></div>
            )}
            {restaurant.website && (
              <div className="flex gap-2"><Globe className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><a href={restaurant.website} target="_blank" rel="noopener" className="hover:underline truncate">{restaurant.website.replace(/^https?:\/\//, "")}</a></div>
            )}
            {restaurant.opening_hours && (
              <div className="flex gap-2"><Clock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span className="whitespace-pre-wrap font-mono text-xs">{restaurant.opening_hours}</span></div>
            )}
            {capacity && (
              <div className="flex gap-2"><Users className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>{capacity} plaatsen</span></div>
            )}
            {startDate && (
              <div className="flex gap-2"><Utensils className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>Sinds {startDate}</span></div>
            )}
          </Card>

          {(facebook || instagram || twitter || wikipedia) && (
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold text-xs uppercase text-muted-foreground">Online</h3>
              {facebook && <a href={facebook.startsWith("http") ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noopener" className="flex items-center gap-2 hover:underline"><ExternalLink className="w-3 h-3" />Facebook</a>}
              {instagram && <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace(/^@/, "")}`} target="_blank" rel="noopener" className="flex items-center gap-2 hover:underline"><ExternalLink className="w-3 h-3" />Instagram</a>}
              {twitter && <a href={twitter.startsWith("http") ? twitter : `https://twitter.com/${twitter.replace(/^@/, "")}`} target="_blank" rel="noopener" className="flex items-center gap-2 hover:underline"><ExternalLink className="w-3 h-3" />Twitter / X</a>}
              {wikipedia && <a href={wikipedia} target="_blank" rel="noopener" className="flex items-center gap-2 hover:underline"><ExternalLink className="w-3 h-3" />Wikipedia</a>}
            </Card>
          )}

          {osmUrl && (
            <a href={osmUrl} target="_blank" rel="noopener" className="block text-xs text-muted-foreground hover:text-foreground text-center">
              Data van OpenStreetMap — bewerk op osm.org ↗
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}

function DetailMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const [mod, setMod] = useState<typeof import("@/components/MapView") | null>(null);
  useEffect(() => { import("@/components/MapView").then(setMod); }, []);
  if (!mod) return <div className="h-full bg-muted" />;
  const { MapContainer, TileLayer, Marker, Popup, OSM_ATTRIBUTION, OSM_TILES, coloredIcon } = mod;
  return (
    <MapContainer center={[lat, lng]} zoom={16} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      <Marker position={[lat, lng]} icon={coloredIcon("red")}><Popup>{name}</Popup></Marker>
    </MapContainer>
  );
}
