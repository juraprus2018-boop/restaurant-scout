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
import { amenityLabel, cuisineLabel } from "@/lib/osm-labels";
import defaultBanner from "@/assets/default-restaurant-banner.jpg";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import { t, parseOpeningHoursI18n, yesNoLabel } from "@/lib/i18n/strings";
import { ActionBar } from "@/components/restaurant/ActionBar";
import { OpenStatusBadge } from "@/components/restaurant/OpenStatusBadge";
import { NearbyRestaurants } from "@/components/restaurant/NearbyRestaurants";

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
        <Button onClick={() => { reset(); router.invalidate(); }}>{t(DEFAULT_LOCALE, "city.retry")}</Button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">{t(DEFAULT_LOCALE, "restaurant.notFound")}</h1>
      <Link to="/" className="text-primary hover:underline">← {t(DEFAULT_LOCALE, "restaurant.backToMap")}</Link>
    </div>
  ),
  head: ({ params, loaderData }) => buildRestaurantHead(DEFAULT_LOCALE, params.slug, loaderData?.restaurant, /* withAlternates */ true),
});

export function buildRestaurantHead(
  lang: LocaleCode,
  slug: string,
  r: any | undefined,
  withAlternates: boolean,
) {
  const basePath = lang === DEFAULT_LOCALE ? `/restaurant/${slug}` : `/${lang}/restaurant/${slug}`;
  const alternates = withAlternates
    ? [
        ...LOCALES.map((l) => ({
          rel: "alternate",
          hreflang: l.code,
          href: l.code === DEFAULT_LOCALE ? `/restaurant/${slug}` : `/${l.code}/restaurant/${slug}`,
        })),
        { rel: "alternate", hreflang: "x-default", href: `/restaurant/${slug}` },
      ]
    : [];
  if (!r) {
    return {
      meta: [{ title: "PlaceResults" }, { property: "og:locale", content: lang }],
      links: [{ rel: "canonical", href: basePath }, ...alternates],
    };
  }
  const tags = (r.raw_osm_tags ?? {}) as Record<string, string>;
  const img = tagImage(tags) ?? defaultBanner;
  const cuisines = (r.cuisine ?? []).map(cuisineLabel).join(", ");
  const cityPart = r.city ? ` · ${r.city}` : "";
  const ratingPart = (r.avg_rating ?? 0) > 0 ? ` · ${Number(r.avg_rating).toFixed(1)}★ (${r.review_count})` : "";
  const titleBase = `${r.name}${cityPart}, ${t(lang, "restaurant.titleSuffix")}`;
  const title = `${titleBase} | PlaceResults`.slice(0, 70);
  const description = `${r.name}${cityPart}${cuisines ? ` · ${cuisines}` : ""}${ratingPart}. ${
    tags[`description:${lang}`] ?? tags.description ?? t(lang, "restaurant.descFallback")
  }`.slice(0, 158);

  const ldRestaurant: any = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    "@id": basePath,
    url: basePath,
    image: img,
    inLanguage: lang,
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

  const langPrefix = lang === DEFAULT_LOCALE ? "" : `/${lang}`;
  const citiesPath = `${langPrefix}/steden`;
  const ldBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t(lang, "city.breadcrumb.home"), item: lang === DEFAULT_LOCALE ? "/" : `/${lang}` },
      { "@type": "ListItem", position: 2, name: t(lang, "city.breadcrumb.cities"), item: citiesPath },
      ...(r.city ? [{ "@type": "ListItem", position: 3, name: r.city, item: `${langPrefix}/stad/${slugifyCity(r.city)}` }] : []),
      { "@type": "ListItem", position: r.city ? 4 : 3, name: r.name, item: basePath },
    ],
  };

  const faq = buildFaq(lang, r, tags);
  const ldFaq = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: lang,
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
      { property: "og:url", content: basePath },
      { property: "og:image", content: img },
      { property: "og:locale", content: lang },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
    links: [
      { rel: "canonical", href: basePath },
      ...alternates,
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(ldRestaurant) },
      { type: "application/ld+json", children: JSON.stringify(ldBreadcrumbs) },
      ...(ldFaq ? [{ type: "application/ld+json", children: JSON.stringify(ldFaq) }] : []),
    ],
  };
}

function slugifyCity(c: string): string {
  return c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Review = { id: string; rating: number; comment: string | null; created_at: string; user_id: string | null; author_name: string | null };

const YES = (v?: string) => v === "yes" || v === "designated" || v === "limited" || v === "only";
const NO = (v?: string) => v === "no";

function tagImage(t: Record<string, string>): string | null {
  const raw = t.image || t.wikimedia_commons;
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const clean = raw.replace(/^File:/, "").replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=1600`;
}

function buildFaq(lang: LocaleCode, r: any, tg: Record<string, string>): Array<{ q: string; a: string }> {
  const faq: Array<{ q: string; a: string }> = [];
  const name = r.name as string;
  if (r.opening_hours) {
    faq.push({
      q: t(lang, "faq.q.hours", { name }),
      a: t(lang, "faq.a.hours", { name, hours: r.opening_hours }),
    });
  }
  const addr = [tg["addr:street"], tg["addr:housenumber"]].filter(Boolean).join(" ") || r.address;
  if (addr) {
    faq.push({
      q: t(lang, "faq.q.where", { name }),
      a: t(lang, "faq.a.where", { name, addr, city: r.city ? `, ${r.city}` : "" }),
    });
  }
  if (r.phone) {
    faq.push({
      q: t(lang, "faq.q.contact", { name }),
      a: r.website
        ? t(lang, "faq.a.contactWeb", { phone: r.phone, website: r.website })
        : t(lang, "faq.a.contact", { phone: r.phone }),
    });
  }
  if (YES(tg.takeaway) || YES(tg.delivery)) {
    const parts = [YES(tg.takeaway) && t(lang, "faq.opt.takeaway"), YES(tg.delivery) && t(lang, "faq.opt.delivery")].filter(Boolean) as string[];
    const opts = parts.join(` ${t(lang, "faq.opt.and")} `);
    faq.push({
      q: t(lang, "faq.q.takeawayDelivery", { name, opts }),
      a: t(lang, "faq.a.takeawayDelivery", { name, opts }),
    });
  } else if (NO(tg.takeaway) && NO(tg.delivery)) {
    faq.push({
      q: t(lang, "faq.q.takeawayDelivery", { name, opts: `${t(lang, "faq.opt.takeaway")} ${t(lang, "faq.opt.and")} ${t(lang, "faq.opt.delivery")}` }),
      a: t(lang, "faq.a.takeawayDeliveryNo", { name }),
    });
  }
  if (tg.wheelchair) {
    const stateKey = ({ yes: "faq.state.full", limited: "faq.state.limited", no: "faq.state.no" } as const)[tg.wheelchair as "yes" | "limited" | "no"];
    if (stateKey) {
      faq.push({
        q: t(lang, "faq.q.wheelchair", { name }),
        a: t(lang, "faq.a.wheelchair", { name, state: t(lang, stateKey) }),
      });
    }
  }
  if ((r.cuisine ?? []).length) {
    faq.push({
      q: t(lang, "faq.q.cuisine", { name }),
      a: t(lang, "faq.a.cuisine", { name, cuisines: (r.cuisine as string[]).map(cuisineLabel).join(", ") }),
    });
  }
  return faq;
}

function RestaurantPage() {
  const { slug } = Route.useParams();
  return <RestaurantPageBody slug={slug} />;
}

export function RestaurantPageBody({ locale = DEFAULT_LOCALE, slug }: { locale?: LocaleCode; slug: string }) {
  const { data, refetch } = useSuspenseQuery(restaurantQuery(slug));
  const restaurant = data.restaurant as any;
  const initialReviews = data.reviews as Review[];
  const tr = (k: Parameters<typeof t>[1], vars?: Record<string, string | number>) => t(locale, k, vars);


  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  useEffect(() => { setReviews(initialReviews); }, [initialReviews]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      if (!authorName.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(authorEmail.trim())) {
        alert("Please fill in your name and a valid email address.");
        return;
      }
    }
    setSubmitting(true);
    const payload: any = {
      restaurant_id: restaurant.id,
      rating,
      comment: comment.trim() || null,
    };
    if (user) {
      payload.user_id = user.id;
      payload.author_name = user.user_metadata?.display_name ?? null;
    } else {
      payload.author_name = authorName.trim().slice(0, 80);
      payload.author_email = authorEmail.trim().slice(0, 255);
    }
    const { error } = await supabase.from("reviews").insert(payload);
    setSubmitting(false);
    if (error) { alert(error.message); return; }
    setComment("");
    if (!user) { setAuthorName(""); setAuthorEmail(""); }
    await refetch();
    const { data: rev } = await supabase
      .from("reviews").select("id,rating,comment,created_at,user_id,author_name")
      .eq("restaurant_id", restaurant.id).order("created_at", { ascending: false });
    setReviews((rev ?? []) as Review[]);
  }

  const tags: Record<string, string> = restaurant.raw_osm_tags ?? {};
  const description = tags.description || tags["description:nl"] || tags["description:en"] || null;
  const brand = tags.brand || tags.operator || null;
  const email = tags.email || tags["contact:email"] || null;
  const facebook = tags["contact:facebook"] || tags.facebook || null;
  const instagram = tags["contact:instagram"] || tags.instagram || null;
  const twitter = tags["contact:twitter"] || tags.twitter || null;
  const heroImg = tagImage(tags) ?? defaultBanner;
  const usingDefaultBanner = !tagImage(tags);
  const wikipedia = tags.wikipedia
    ? `https://${tags.wikipedia.split(":")[0] || "en"}.wikipedia.org/wiki/${encodeURIComponent(tags.wikipedia.split(":").slice(1).join(":"))}`
    : null;
  const capacity = tags.capacity || tags["capacity:persons"] || null;
  const michelin = tags["michelin_stars"] || tags["michelin:stars"] || null;
  const startDate = tags.start_date || null;
  const note = tags.note || null;

  const diets: string[] = [];
  for (const [k, v] of Object.entries(tags)) if (k.startsWith("diet:") && YES(v)) diets.push(k.replace("diet:", ""));
  const payments: string[] = [];
  for (const [k, v] of Object.entries(tags)) if (k.startsWith("payment:") && YES(v)) payments.push(k.replace("payment:", ""));

  const featureDefs: Array<{ icon: any; key: string; tagKey: string; ok: boolean }> = [
    { icon: Truck, key: "feat.delivery", tagKey: "delivery", ok: YES(tags.delivery) },
    { icon: ShoppingBag, key: "feat.takeaway", tagKey: "takeaway", ok: YES(tags.takeaway) },
    { icon: Sun, key: "feat.terrace", tagKey: "outdoor_seating", ok: YES(tags.outdoor_seating) },
    { icon: Home, key: "feat.indoor", tagKey: "indoor_seating", ok: YES(tags.indoor_seating) },
    { icon: Accessibility, key: tags.wheelchair === "limited" ? "feat.wheelchairLimited" : "feat.wheelchair", tagKey: "wheelchair", ok: YES(tags.wheelchair) },
    { icon: Wifi, key: "feat.wifi", tagKey: "internet_access", ok: YES(tags.internet_access) || tags.internet_access === "wlan" },
    { icon: Cigarette, key: "feat.smoking", tagKey: "smoking", ok: YES(tags.smoking) },
    { icon: Baby, key: "feat.kids", tagKey: "kids_area", ok: YES(tags["kids_area"]) || YES(tags["child_friendly"]) },
    { icon: Dog, key: "feat.dogs", tagKey: "dog", ok: YES(tags.dog) },
    { icon: ParkingCircle, key: "feat.parking", tagKey: "parking", ok: YES(tags.parking) },
    { icon: CreditCard, key: "feat.card", tagKey: "", ok: payments.length > 0 },
  ];
  const features = featureDefs
    .filter((f) => f.ok || (f.tagKey && NO(tags[f.tagKey] ?? "")))
    .map((f) => ({ ...f, label: tr(f.key as any) }));

  const osmUrl = restaurant.osm_id && restaurant.osm_type
    ? `https://www.openstreetmap.org/${restaurant.osm_type}/${restaurant.osm_id}`
    : null;
  const osmEditUrl = restaurant.osm_id && restaurant.osm_type
    ? `https://www.openstreetmap.org/edit?${restaurant.osm_type}=${restaurant.osm_id}`
    : null;

  const openingRows = restaurant.opening_hours ? parseOpeningHoursI18n(restaurant.opening_hours, locale) : [];
  const faq = buildFaq(locale, restaurant, tags);
  const cuisines = (restaurant.cuisine ?? []).map(cuisineLabel);

  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader locale={locale} />
      <header className="bg-background border-b px-4 py-3">
        <nav aria-label={tr("restaurant.contact")} className="max-w-5xl mx-auto text-sm">
          <ol className="flex items-center gap-1 text-muted-foreground flex-wrap">
            <li><Link to="/" className="hover:text-foreground flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> {tr("city.breadcrumb.home")}</Link></li>
            <li>/</li>
            <li>
              {locale === DEFAULT_LOCALE ? (
                <Link to="/steden" className="hover:text-foreground">{tr("city.breadcrumb.cities")}</Link>
              ) : (
                <Link to="/$lang/steden" params={{ lang: locale }} className="hover:text-foreground">{tr("city.breadcrumb.cities")}</Link>
              )}
            </li>
            {restaurant.city && (<>
              <li>/</li>
              <li>
                {locale === DEFAULT_LOCALE ? (
                  <Link to="/stad/$city" params={{ city: slugifyCity(restaurant.city) }} className="hover:text-foreground">{restaurant.city}</Link>
                ) : (
                  <Link to="/$lang/stad/$city" params={{ lang: locale, city: slugifyCity(restaurant.city) }} className="hover:text-foreground">{restaurant.city}</Link>
                )}
              </li>
            </>)}
            <li>/</li>
            <li className="text-foreground font-medium truncate">{restaurant.name}</li>
          </ol>
        </nav>
      </header>

      <ActionBar
        locale={locale}
        id={restaurant.id}
        name={restaurant.name}
        lat={restaurant.lat}
        lng={restaurant.lng}
        phone={restaurant.phone}
        website={restaurant.website}
      />

      <div className="relative w-full h-72 md:h-96 bg-muted overflow-hidden">
        <img
          src={heroImg}
          alt={`${restaurant.name}${restaurant.city ? ` · ${restaurant.city}` : ""}`}
          className="w-full h-full object-cover"
          width={1600}
          height={640}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white max-w-5xl mx-auto">
          <div className="mb-2"><OpenStatusBadge locale={locale} openingHours={restaurant.opening_hours} /></div>
          <h1 className="text-3xl md:text-5xl font-bold drop-shadow">{restaurant.name}</h1>
          <p className="mt-2 text-sm md:text-base opacity-90">
            {[brand, tags.amenity && amenityLabel(tags.amenity), restaurant.city].filter(Boolean).join(" · ")}
          </p>
          {usingDefaultBanner && (
            <p className="absolute top-2 right-3 text-[10px] opacity-60">{tr("restaurant.stockImage")}</p>
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
                <span className="text-muted-foreground font-normal">({restaurant.review_count} {tr("city.reviewsLabel")})</span>
              </span>
            )}
            {michelin && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">★ {michelin} Michelin</span>}
            {cuisines.map((c: string) => (
              <span key={c} className="px-2 py-0.5 rounded-full bg-muted">{c}</span>
            ))}
          </div>

          {description && (
            <Card className="p-4">
              <h2 className="font-semibold mb-2">{tr("restaurant.about", { name: restaurant.name })}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
            </Card>
          )}

          {features.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3">{tr("restaurant.features")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {features.map((f) => (
                  <div key={f.key} className={`flex items-center gap-2 ${f.ok ? "" : "text-muted-foreground line-through"}`}>
                    <f.icon className="w-4 h-4 shrink-0" />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {diets.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Leaf className="w-4 h-4" /> {tr("restaurant.diet")}</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {diets.map((d) => (
                  <span key={d} className="px-2 py-1 rounded-full bg-green-100 text-green-800 capitalize">{d.replace(/_/g, " ")}</span>
                ))}
              </div>
            </Card>
          )}

          {payments.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> {tr("restaurant.payment")}</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {payments.map((p) => (
                  <span key={p} className="px-2 py-1 rounded-full bg-muted capitalize">{p.replace(/_/g, " ")}</span>
                ))}
              </div>
            </Card>
          )}

          {openingRows.length > 0 && (
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> {tr("restaurant.hours")}</h2>
              <table className="text-sm w-full">
                <tbody>
                  {openingRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 pr-4 text-muted-foreground">{row.days || ","}</td>
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
              <h2 className="text-xl font-semibold mb-3">{tr("restaurant.faq")}</h2>
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
            <h2 className="text-xl font-semibold mb-3">{tr("restaurant.reviews")}</h2>
            <form onSubmit={submitReview} className="bg-background border rounded-lg p-4 mb-4 space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={tr("restaurant.starsLabel", { n })}>
                    <Star className={`w-6 h-6 ${n <= rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              {!user && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    maxLength={80}
                    placeholder="Name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                  />
                  <input
                    type="email"
                    required
                    maxLength={255}
                    placeholder="Email (not shown)"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                  />
                </div>
              )}
              <Textarea placeholder={tr("restaurant.reviewPlaceholder")} value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button type="submit" disabled={submitting}>{submitting ? tr("restaurant.submitting") : tr("restaurant.submit")}</Button>
            </form>
            <div className="space-y-3">
              {reviews.map((r) => (
                <article key={r.id} className="bg-background border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5" aria-label={tr("restaurant.starsLabel", { n: r.rating })}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`w-4 h-4 ${n <= r.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                    {r.author_name && <span className="text-sm font-medium">{r.author_name}</span>}
                  </div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString(locale)}</p>
                </article>
              ))}
              {reviews.length === 0 && <p className="text-sm text-muted-foreground">{tr("restaurant.noReviews")}</p>}
            </div>
          </section>

          <Card className="p-4">
            <button
              onClick={() => setShowAllTags((s) => !s)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Tag className="w-4 h-4" /> {showAllTags ? tr("restaurant.rawHide") : tr("restaurant.rawShow")} ({Object.keys(tags).length})
            </button>
            {showAllTags && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono max-h-96 overflow-auto">
                {Object.entries(tags).sort().map(([k, v]) => (
                  <div key={k} className="truncate"><span className="text-muted-foreground">{k}=</span><span>{v}</span></div>
                ))}
              </div>
            )}
          </Card>

          <NearbyRestaurants locale={locale} currentId={restaurant.id} city={restaurant.city} />
        </div>

        <aside className="space-y-3 text-sm">
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold text-base">{tr("restaurant.contact")}</h2>
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
              <div className="flex gap-2"><Users className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>{capacity} {tr("restaurant.seats")}</span></div>
            )}
            {startDate && (
              <div className="flex gap-2"><Utensils className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>{tr("restaurant.since")} {startDate}</span></div>
            )}
            {tags.wheelchair && (
              <div className="flex gap-2"><Accessibility className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /><span>{tr("restaurant.wheelchairLabel")}: {yesNoLabel(locale, tags.wheelchair)}</span></div>
            )}
          </Card>

          {(facebook || instagram || twitter || wikipedia) && (
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold text-xs uppercase text-muted-foreground">{tr("restaurant.online")}</h3>
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
                {tr("restaurant.osmView")} ↗
              </a>
              {osmEditUrl && (
                <a href={osmEditUrl} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground">
                  {tr("restaurant.osmEdit")} ↗
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
