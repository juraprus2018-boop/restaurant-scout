import { createFileRoute, Link, ClientOnly, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Star, MapPin, Phone, Globe, Clock, ArrowLeft, Mail, Accessibility,
  Wifi, CreditCard, Utensils, Cigarette, Leaf, ShoppingBag, Truck,
  Sun, Users, Baby, Dog, ParkingCircle, ExternalLink, Tag, ChevronDown,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { getRestaurantBySlug } from "@/lib/restaurants-public.functions";
import { amenityLabel, cuisineLabel, parseOpeningHours, YESNO_NL } from "@/lib/osm-labels";
import defaultBanner from "@/assets/default-restaurant-banner.jpg";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";

const restaurantQuery = (slug: string) =>
  queryOptions({
    queryKey: ["restaurant", slug],
    queryFn: () => getRestaurantBySlug({ data: { slug } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/restaurant/$slug")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(restaurantQuery(params.slug)),
  component: RestaurantPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={() => { reset(); router.invalidate(); }}>Opnieuw proberen</Button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Restaurant niet gevonden</h1>
      <Link to="/" className="text-primary hover:underline">← Terug naar kaart</Link>
    </div>
  ),
  head: ({ params, loaderData }) => {
    const r = loaderData?.restaurant;
    if (!r) {
      return { meta: [{ title: "Restaurant — PlaceResults" }] };
    }
    const tags = (r.raw_osm_tags ?? {}) as Record<string, string>;
    const img = tagImage(tags) ?? defaultBanner;
    const cuisines = (r.cuisine ?? []).map(cuisineLabel).join(", ");
    const cityPart = r.city ? ` in ${r.city}` : "";
    const ratingPart = (r.avg_rating ?? 0) > 0 ? ` · ${Number(r.avg_rating).toFixed(1)}★ (${r.review_count})` : "";
    const title = `${r.name}${cityPart} — Menu, openingstijden & reviews | PlaceResults`.slice(0, 70);
    const description = `${r.name}${cityPart}${cuisines ? ` · ${cuisines}` : ""}${ratingPart}. ${
      tags.description ?? `Bekijk openingstijden, contact, voorzieningen en reviews van bezoekers.`
    }`.slice(0, 158);

    const ldRestaurant: any = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: r.name,
      "@id": `/restaurant/${params.slug}`,
      url: `/restaurant/${params.slug}`,
      image: img,
      address: {
        "@type": "PostalAddress",
        streetAddress: [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ") || r.address || undefined,
        addressLocality: r.city ?? tags["addr:city"] ?? undefined,
        postalCode: tags["addr:postcode"] ?? undefined,
        addressCountry: r.country ?? tags["addr:country"] ?? undefined,
      },
      geo: { "@type": "GeoCoordinates", latitude: r.lat, longitude: r.lng },
      telephone: r.phone ?? undefined,
      ...(r.website ? { sameAs: [r.website] } : {}),
      servesCuisine: (r.cuisine ?? []).map(cuisineLabel),
      ...(r.opening_hours ? { openingHours: r.opening_hours } : {}),
      ...((r.avg_rating ?? 0) > 0 && (r.review_count ?? 0) > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(r.avg_rating).toFixed(1),
              reviewCount: r.review_count,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    };

    const ldBreadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "/" },
        ...(r.city ? [{ "@type": "ListItem", position: 2, name: r.city, item: `/?city=${encodeURIComponent(r.city)}` }] : []),
        { "@type": "ListItem", position: r.city ? 3 : 2, name: r.name, item: `/restaurant/${params.slug}` },
      ],
    };

    const faq = buildFaq(r, tags);
    const ldFaq = faq.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "restaurant.restaurant" },
        { property: "og:url", content: `/restaurant/${params.slug}` },
        { property: "og:image", content: img },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: img },
      ],
      links: [{ rel: "canonical", href: `/restaurant/${params.slug}` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(ldRestaurant) },
        { type: "application/ld+json", children: JSON.stringify(ldBreadcrumbs) },
        ...(ldFaq ? [{ type: "application/ld+json", children: JSON.stringify(ldFaq) }] : []),
      ],
    };
  },
});

type Review = { id: string; rating: number; comment: string | null; created_at: string; user_id: string };

const YES = (v?: string) => v === "yes" || v === "designated" || v === "limited" || v === "only";
const NO = (v?: string) => v === "no";

function tagImage(t: Record<string, string>): string | null {
  const raw = t.image || t.wikimedia_commons;
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const clean = raw.replace(/^File:/, "").replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=1600`;
}

function buildFaq(r: any, t: Record<string, string>): Array<{ q: string; a: string }> {
  const faq: Array<{ q: string; a: string }> = [];
  if (r.opening_hours) faq.push({ q: `Wat zijn de openingstijden van ${r.name}?`, a: `${r.name} is geopend: ${r.opening_hours}.` });
  const addr = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || r.address;
  if (addr) faq.push({ q: `Waar ligt ${r.name}?`, a: `${r.name} bevindt zich aan ${addr}${r.city ? `, ${r.city}` : ""}.` });
  if (r.phone) faq.push({ q: `Hoe kan ik ${r.name} bereiken?`, a: `Bel ${r.phone}${r.website ? ` of bezoek ${r.website}` : ""}.` });
  if (YES(t.takeaway) || YES(t.delivery)) {
    const opts = [YES(t.takeaway) && "afhalen", YES(t.delivery) && "bezorgen"].filter(Boolean).join(" en ");
    faq.push({ q: `Kan ik bij ${r.name} ${opts}?`, a: `Ja, ${r.name} biedt ${opts} aan.` });
  } else if (NO(t.takeaway) && NO(t.delivery)) {
    faq.push({ q: `Kan ik bij ${r.name} afhalen of bezorgen?`, a: `Nee, ${r.name} biedt geen afhaal- of bezorgservice.` });
  }
  if (t.wheelchair) {
    const label = { yes: "volledig rolstoeltoegankelijk", limited: "beperkt rolstoeltoegankelijk", no: "niet rolstoeltoegankelijk" }[t.wheelchair] ?? null;
    if (label) faq.push({ q: `Is ${r.name} rolstoeltoegankelijk?`, a: `${r.name} is ${label}.` });
  }
  if ((r.cuisine ?? []).length) {
    faq.push({ q: `Welke keuken serveert ${r.name}?`, a: `${r.name} staat bekend om ${(r.cuisine as string[]).map(cuisineLabel).join(", ")}.` });
  }
  return faq;
}

function RestaurantPage() {
  return <RestaurantPageBody />;
}

export function RestaurantPageBody({ locale = DEFAULT_LOCALE, slug: slugOverride }: { locale?: LocaleCode; slug?: string } = {}) {
  // When called from the localized route, slug is passed in explicitly.
  // For the NL route, fall back to Route.useParams().
  const slug = slugOverride ?? Route.useParams().slug;
  const { data, refetch } = useSuspenseQuery(restaurantQuery(slug));
  const restaurant = data.restaurant as any;
  const initialReviews = data.reviews as Review[];

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  useEffect(() => { setReviews(initialReviews); }, [initialReviews]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
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
    await refetch();
    const { data: rev } = await supabase
      .from("reviews").select("id,rating,comment,created_at,user_id")
      .eq("restaurant_id", restaurant.id).order("created_at", { ascending: false });
    setReviews((rev ?? []) as Review[]);
  }

  const t: Record<string, string> = restaurant.raw_osm_tags ?? {};
  const description = t.description || t["description:nl"] || t["description:en"] || null;
  const brand = t.brand || t.operator || null;
  const email = t.email || t["contact:email"] || null;
  const facebook = t["contact:facebook"] || t.facebook || null;
  const instagram = t["contact:instagram"] || t.instagram || null;
  const twitter = t["contact:twitter"] || t.twitter || null;
  const heroImg = tagImage(t) ?? defaultBanner;
  const usingDefaultBanner = !tagImage(t);
  const wikipedia = t.wikipedia
    ? `https://${t.wikipedia.split(":")[0] || "en"}.wikipedia.org/wiki/${encodeURIComponent(t.wikipedia.split(":").slice(1).join(":"))}`
    : null;
  const capacity = t.capacity || t["capacity:persons"] || null;
  const michelin = t["michelin_stars"] || t["michelin:stars"] || null;
  const startDate = t.start_date || null;
  const note = t.note || null;

  const diets: string[] = [];
  for (const [k, v] of Object.entries(t)) if (k.startsWith("diet:") && YES(v)) diets.push(k.replace("diet:", ""));
  const payments: string[] = [];
  for (const [k, v] of Object.entries(t)) if (k.startsWith("payment:") && YES(v)) payments.push(k.replace("payment:", ""));

  const features: Array<{ icon: any; label: string; ok: boolean }> = [
    { icon: Truck, label: "Bezorging", ok: YES(t.delivery) },
    { icon: ShoppingBag, label: "Afhalen", ok: YES(t.takeaway) },
    { icon: Sun, label: "Terras", ok: YES(t.outdoor_seating) },
    { icon: Home, label: "Binnen zitten", ok: YES(t.indoor_seating) },
    { icon: Accessibility, label: t.wheelchair === "limited" ? "Beperkt rolstoeltoegankelijk" : "Rolstoeltoegankelijk", ok: YES(t.wheelchair) },
    { icon: Wifi, label: "Wifi", ok: YES(t.internet_access) || t.internet_access === "wlan" },
    { icon: Cigarette, label: "Roken toegestaan", ok: YES(t.smoking) },
    { icon: Baby, label: "Kindvriendelijk", ok: YES(t["kids_area"]) || YES(t["child_friendly"]) },
    { icon: Dog, label: "Honden welkom", ok: YES(t.dog) },
    { icon: ParkingCircle, label: "Parkeren", ok: YES(t.parking) },
    { icon: CreditCard, label: "Kaart betalen", ok: payments.length > 0 },
  ].filter((f) => f.ok || NO(t[featureKey(f.label)] ?? ""));

  const osmUrl = restaurant.osm_id && restaurant.osm_type
    ? `https://www.openstreetmap.org/${restaurant.osm_type}/${restaurant.osm_id}`
    : null;
  const osmEditUrl = restaurant.osm_id && restaurant.osm_type
    ? `https://www.openstreetmap.org/edit?${restaurant.osm_type}=${restaurant.osm_id}`
    : null;

  const openingRows = restaurant.opening_hours ? parseOpeningHours(restaurant.opening_hours) : [];
  const faq = buildFaq(restaurant, t);
  const cuisines = (restaurant.cuisine ?? []).map(cuisineLabel);

  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader locale={locale} />
      <header className="bg-background border-b px-4 py-3">

        <nav aria-label="Kruimelpad" className="max-w-5xl mx-auto text-sm">
          <ol className="flex items-center gap-1 text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Home</Link></li>
            {restaurant.city && (<>
              <li>/</li>
              <li>{restaurant.city}</li>
            </>)}
            <li>/</li>
            <li className="text-foreground font-medium truncate">{restaurant.name}</li>
          </ol>
        </nav>
      </header>

      <div className="relative w-full h-72 md:h-96 bg-muted overflow-hidden">
        <img
          src={heroImg}
          alt={`${restaurant.name}${restaurant.city ? ` in ${restaurant.city}` : ""}`}
          className="w-full h-full object-cover"
          width={1600}
          height={640}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold drop-shadow">{restaurant.name}</h1>
          <p className="mt-2 text-sm md:text-base opacity-90">
            {[brand, t.amenity && amenityLabel(t.amenity), restaurant.city].filter(Boolean).join(" · ")}
          </p>
          {usingDefaultBanner && (
            <p className="absolute top-2 right-3 text-[10px] opacity-60">Sfeerbeeld</p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center flex-wrap gap-2 text-sm">
            {(restaurant.avg_rating ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <Star className="w-4 h-4 fill-current" />
                {Number(restaurant.avg_rating).toFixed(1)}
                <span className="text-muted-foreground font-normal">({restaurant.review_count} reviews)</span>
              </span>
            )}
            {michelin && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">★ {michelin} Michelin</span>}
            {cuisines.map((c: string) => (
              <span key={c} className="px-2 py-0.5 rounded-full bg-muted">{c}</span>
            ))}
          </div>

          {description && (
            <Card className="p-4">
              <h2 className="font-semibold mb-2">Over {restaurant.name}</h2>
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
                {diets.map((d) => (
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

          {openingRows.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Openingstijden</h2>
              <table className="text-sm w-full">
                <tbody>
                  {openingRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 pr-4 text-muted-foreground">{row.days || "—"}</td>
                      <td className="py-1.5 font-medium">{row.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <Card className="overflow-hidden h-64">
            <ClientOnly fallback={<div className="h-full bg-muted" />}>
              <DetailMap lat={restaurant.lat} lng={restaurant.lng} name={restaurant.name} />
            </ClientOnly>
          </Card>

          {faq.length > 0 && (
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-3">Veelgestelde vragen</h2>
              <div className="divide-y">
                {faq.map((f, i) => (
                  <details key={i} className="py-3 group">
                    <summary className="cursor-pointer font-medium flex items-center justify-between">
                      {f.q}
                      <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
                  </details>
                ))}
              </div>
            </Card>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-3">Reviews</h2>
            {user ? (
              <form onSubmit={submitReview} className="bg-background border rounded-lg p-4 mb-4 space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} sterren`}>
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
                <article key={r.id} className="bg-background border rounded-lg p-4">
                  <div className="flex gap-0.5 mb-1" aria-label={`${r.rating} sterren`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${n <= r.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("nl-NL")}</p>
                </article>
              ))}
              {reviews.length === 0 && <p className="text-sm text-muted-foreground">Nog geen reviews — wees de eerste!</p>}
            </div>
          </section>

          <Card className="p-4">
            <button
              onClick={() => setShowAllTags((s) => !s)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Tag className="w-4 h-4" /> {showAllTags ? "Verberg" : "Toon"} ruwe OSM-data ({Object.keys(t).length})
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
            <h2 className="font-semibold text-base">Contact &amp; locatie</h2>
            {(restaurant.address || restaurant.city) && (
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <address className="not-italic">
                  {restaurant.address}{restaurant.address && (restaurant.city || restaurant.country) ? <br/> : null}
                  {[restaurant.city, restaurant.country].filter(Boolean).join(", ")}
                </address>
              </div>
            )}
            {restaurant.phone && (
              <div className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><a href={`tel:${restaurant.phone}`} className="hover:underline">{restaurant.phone}</a></div>
            )}
            {email && (
              <div className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><a href={`mailto:${email}`} className="hover:underline truncate">{email}</a></div>
            )}
            {restaurant.website && (
              <div className="flex gap-2"><Globe className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><a href={restaurant.website} target="_blank" rel="noopener nofollow" className="hover:underline truncate">{restaurant.website.replace(/^https?:\/\//, "")}</a></div>
            )}
            {capacity && (
              <div className="flex gap-2"><Users className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>{capacity} plaatsen</span></div>
            )}
            {startDate && (
              <div className="flex gap-2"><Utensils className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>Sinds {startDate}</span></div>
            )}
            {t.wheelchair && (
              <div className="flex gap-2"><Accessibility className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>Rolstoel: {YESNO_NL(t.wheelchair)}</span></div>
            )}
          </Card>

          {(facebook || instagram || twitter || wikipedia) && (
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold text-xs uppercase text-muted-foreground">Online</h3>
              {facebook && <a href={facebook.startsWith("http") ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noopener nofollow" className="flex items-center gap-2 hover:underline"><ExternalLink className="w-3 h-3" />Facebook</a>}
              {instagram && <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace(/^@/, "")}`} target="_blank" rel="noopener nofollow" className="flex items-center gap-2 hover:underline"><ExternalLink className="w-3 h-3" />Instagram</a>}
              {twitter && <a href={twitter.startsWith("http") ? twitter : `https://twitter.com/${twitter.replace(/^@/, "")}`} target="_blank" rel="noopener nofollow" className="flex items-center gap-2 hover:underline"><ExternalLink className="w-3 h-3" />Twitter / X</a>}
              {wikipedia && <a href={wikipedia} target="_blank" rel="noopener" className="flex items-center gap-2 hover:underline"><ExternalLink className="w-3 h-3" />Wikipedia</a>}
            </Card>
          )}

          {note && (
            <p className="text-xs text-muted-foreground italic px-1">{note}</p>
          )}

          {osmUrl && (
            <div className="flex flex-col gap-1 text-xs text-center">
              <a href={osmUrl} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground">
                Bekijk op OpenStreetMap ↗
              </a>
              {osmEditUrl && (
                <a href={osmEditUrl} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground">
                  Bewerken in iD-editor ↗
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}

function featureKey(label: string): string {
  return ({
    "Bezorging": "delivery", "Afhalen": "takeaway", "Terras": "outdoor_seating",
    "Binnen zitten": "indoor_seating", "Wifi": "internet_access", "Roken toegestaan": "smoking",
    "Honden welkom": "dog", "Parkeren": "parking",
  } as Record<string, string>)[label] ?? "";
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
