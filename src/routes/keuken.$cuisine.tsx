import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { listByCuisine } from "@/lib/seo-public.functions";
import { getLandingFaq } from "@/lib/seo-faq.functions";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbListJsonLd, aggregateRatingJsonLd } from "@/lib/seo-jsonld";
import { MapPin, Star } from "lucide-react";
import { cuisineLabel } from "@/lib/osm-labels";
import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";

const cuisineQuery = (key: string) =>
  queryOptions({
    queryKey: ["cuisine", key],
    queryFn: () => listByCuisine({ data: { cuisine: key, limit: 48 } }),
    staleTime: 5 * 60_000,
  });

export const Route = createFileRoute("/keuken/$cuisine")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(cuisineQuery(params.cuisine)),
  head: ({ loaderData, params }) => buildCuisineHead(DEFAULT_LOCALE, params.cuisine, loaderData),
  component: CuisinePage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl mb-2">{t(DEFAULT_LOCALE, "city.error")}</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button onClick={() => { reset(); router.invalidate(); }} className="text-primary underline">{t(DEFAULT_LOCALE, "city.retry")}</button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-3xl mb-2">{t(DEFAULT_LOCALE, "cuisine.notFound")}</h1>
        <Link to="/" className="text-primary underline">{t(DEFAULT_LOCALE, "city.backHome")}</Link>
      </div>
    </div>
  ),
});

export function buildCuisineHead(lang: LocaleCode, cuisineSlug: string, loaderData: any) {
  const label = loaderData ? cuisineLabel(loaderData.cuisine) : cuisineSlug;
  const total = loaderData?.total ?? 0;
  const path = lang === DEFAULT_LOCALE ? `/keuken/${cuisineSlug}` : `/${lang}/keuken/${cuisineSlug}`;
  const title = `${t(lang, "cuisine.heading", { label })}, PlaceResults`.slice(0, 70);
  const desc = t(lang, "cuisine.subheading", { count: total.toLocaleString(lang), label }).slice(0, 158);
  return {
    meta: [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { property: "og:url", content: path },
      { property: "og:locale", content: lang },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: path },
      ...LOCALES.map((l) => ({
        rel: "alternate",
        hreflang: l.code,
        href: l.code === DEFAULT_LOCALE ? `/keuken/${cuisineSlug}` : `/${l.code}/keuken/${cuisineSlug}`,
      })),
      { rel: "alternate", hreflang: "x-default", href: `/keuken/${cuisineSlug}` },
    ],
  };
}

function CuisinePage() {
  const { cuisine } = Route.useParams();
  return <CuisinePageBody cuisineKey={cuisine} />;
}

export function CuisinePageBody({ locale = DEFAULT_LOCALE, cuisineKey }: { locale?: LocaleCode; cuisineKey: string }) {
  const { data } = useSuspenseQuery(cuisineQuery(cuisineKey));
  const { cuisine, total, items } = data;
  const label = cuisineLabel(cuisine);

  // FAQ loaded client-side (non-blocking)
  const { data: faqData } = useQuery({
    queryKey: ["cuisine-faq", locale, cuisineKey],
    queryFn: () =>
      getLandingFaq({
        data: {
          scope: "cuisine",
          key: cuisineKey,
          lang: locale,
          displayName: label,
          sampleNames: items.slice(0, 8).map((r: any) => r.name),
        },
      }).catch(() => ({ items: [] })),
    staleTime: 60 * 60_000,
  });

  // Top cities offering this cuisine, for internal linking
  const cityCounts = new Map<string, number>();
  for (const r of items as any[]) {
    if (r.city) cityCounts.set(r.city, (cityCounts.get(r.city) ?? 0) + 1);
  }
  const topCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([c]) => c);

  const langPrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t(locale, "cuisine.heading", { label }),
    inLanguage: locale,
    numberOfItems: total,
    itemListElement: items.slice(0, 20).map((r: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${langPrefix}/restaurant/${r.slug}`,
      name: r.name,
    })),
  };
  const breadcrumbsLd = breadcrumbListJsonLd([
    { name: t(locale, "city.breadcrumb.home"), item: locale === DEFAULT_LOCALE ? "/" : `/${locale}` },
    { name: t(locale, "cuisine.breadcrumb.cuisine"), item: `${langPrefix}/keuken/${cuisineKey}` },
    { name: label, item: `${langPrefix}/keuken/${cuisineKey}` },
  ]);
  const aggLd = aggregateRatingJsonLd(t(locale, "cuisine.heading", { label }), locale, items);

  function slugifyCity(c: string): string {
    return c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      {aggLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggLd) }} />}

      <section className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary">{t(locale, "city.breadcrumb.home")}</Link> / <span>{t(locale, "cuisine.breadcrumb.cuisine")}</span> / <span className="text-foreground">{label}</span>
          </nav>
          <h1 className="font-display text-4xl sm:text-5xl text-ink">{t(locale, "cuisine.heading", { label })}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            {t(locale, "cuisine.subheading", { label })}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((r: any) => (
            <Link
              key={r.id}
              to="/restaurant/$slug"
              params={{ slug: r.slug }}
              className="group block rounded-2xl bg-card border border-border p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <h2 className="font-display text-lg text-ink group-hover:text-primary line-clamp-1">{r.name}</h2>
              {r.avg_rating > 0 && (
                <div className="flex items-center gap-1 mt-1.5 text-sm">
                  <Star className="w-4 h-4 fill-rating text-rating" />
                  <span className="font-semibold">{Number(r.avg_rating).toFixed(1)}</span>
                  <span className="text-muted-foreground">· {r.review_count} {t(locale, "city.reviewsLabel")}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {r.address || r.city || t(locale, "city.addressUnknown")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {topCities.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="font-display text-xl text-ink mb-4">{t(locale, "internal.exploreMore")}</h2>
          <div className="flex flex-wrap gap-2">
            {topCities.map((c) =>
              locale === DEFAULT_LOCALE ? (
                <Link
                  key={c}
                  to="/stad/$city"
                  params={{ city: slugifyCity(c) }}
                  className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {label} in {c}
                </Link>
              ) : (
                <Link
                  key={c}
                  to="/$lang/stad/$city"
                  params={{ lang: locale, city: slugifyCity(c) }}
                  className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {label} in {c}
                </Link>
              ),
            )}
          </div>
        </section>
      )}

      <FaqSection locale={locale} items={faqData?.items ?? []} />

      <SiteFooter locale={locale} />
    </div>
  );
}
