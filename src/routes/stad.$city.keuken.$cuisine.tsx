import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listByCityAndCuisine } from "@/lib/seo-public.functions";
import { getLandingCopy } from "@/lib/seo-translations.functions";
import { getLandingFaq } from "@/lib/seo-faq.functions";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbListJsonLd, aggregateRatingJsonLd } from "@/lib/seo-jsonld";
import { MapPin, Star } from "lucide-react";
import { cuisineLabel } from "@/lib/osm-labels";
import { LOCALES, DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";

export const comboQuery = (lang: LocaleCode, citySlug: string, cuisine: string) =>
  queryOptions({
    queryKey: ["city-cuisine", lang, citySlug, cuisine],
    queryFn: async () => {
      const base = await listByCityAndCuisine({ data: { citySlug, cuisine, limit: 48 } });
      const label = cuisineLabel(cuisine);
      const displayName = `${label} restaurants in ${base.city}`;
      const [copy, faq] = await Promise.all([
        getLandingCopy({
          data: { scope: "city_cuisine", key: `${citySlug}|${cuisine}`, lang, displayName, total: base.total },
        }).catch(() => ({
          title: `${displayName}, PlaceResults`.slice(0, 70),
          description: `Find ${label} restaurants in ${base.city}. Sorted by visitor ratings.`.slice(0, 158),
          intro: `The best ${label} restaurants in ${base.city}, based on visitor ratings.`,
        })),
        getLandingFaq({
          data: {
            scope: "city_cuisine",
            key: `${citySlug}|${cuisine}`,
            lang,
            displayName,
            sampleNames: base.items.slice(0, 8).map((r: any) => r.name),
          },
        }).catch(() => ({ items: [] })),
      ]);
      return { ...base, label, displayName, copy, faq: faq.items };
    },
    staleTime: 60 * 60_000,
  });

export const Route = createFileRoute("/stad/$city/keuken/$cuisine")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(comboQuery(DEFAULT_LOCALE, params.city, params.cuisine)),
  head: ({ loaderData, params }) => buildComboHead(DEFAULT_LOCALE, params.city, params.cuisine, loaderData),
  component: ComboPage,
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
        <h1 className="font-display text-3xl mb-2">{t(DEFAULT_LOCALE, "city.notFound")}</h1>
        <Link to="/" className="text-primary underline">{t(DEFAULT_LOCALE, "city.backHome")}</Link>
      </div>
    </div>
  ),
});

export function buildComboHead(lang: LocaleCode, citySlug: string, cuisineKey: string, loaderData: any) {
  const path = lang === DEFAULT_LOCALE
    ? `/stad/${citySlug}/keuken/${cuisineKey}`
    : `https://placeresults.com/${lang}/stad/${citySlug}/keuken/${cuisineKey}`;
  const title = loaderData?.copy?.title ?? `${cuisineLabel(cuisineKey)} restaurants, PlaceResults`;
  const desc = loaderData?.copy?.description ?? "";
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
        href:
          l.code === DEFAULT_LOCALE
            ? `/stad/${citySlug}/keuken/${cuisineKey}`
            : `/${l.code}/stad/${citySlug}/keuken/${cuisineKey}`,
      })),
      { rel: "alternate", hreflang: "x-default", href: `/stad/${citySlug}/keuken/${cuisineKey}` },
    ],
  };
}

export function ComboPageBody({
  locale = DEFAULT_LOCALE,
  citySlug,
  cuisineKey,
}: {
  locale?: LocaleCode;
  citySlug: string;
  cuisineKey: string;
}) {
  const { data } = useSuspenseQuery(comboQuery(locale, citySlug, cuisineKey));
  const { city, label, total, items, copy, faq, displayName } = data;
  const langPrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: displayName,
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
    { name: city, item: `${langPrefix}/stad/${citySlug}` },
    { name: label, item: `${langPrefix}/stad/${citySlug}/keuken/${cuisineKey}` },
  ]);
  const aggLd = aggregateRatingJsonLd(displayName, locale, items);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      {aggLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggLd) }} />}

      <section className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary">{t(locale, "city.breadcrumb.home")}</Link>
            {" / "}
            {locale === DEFAULT_LOCALE ? (
              <Link to="/stad/$city" params={{ city: citySlug }} className="hover:text-primary">{city}</Link>
            ) : (
              <Link to="/$lang/stad/$city" params={{ lang: locale, city: citySlug }} className="hover:text-primary">{city}</Link>
            )}
            {" / "}
            <span className="text-foreground">{label}</span>
          </nav>
          <h1 className="font-display text-4xl sm:text-5xl text-ink">{label} restaurants in {city}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            {copy.intro && !/\d/.test(copy.intro) ? copy.intro : `${label} restaurants in ${city}, sorted by visitor ratings.`}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((r: any) =>
            locale === DEFAULT_LOCALE ? (
              <Link
                key={r.id}
                to="/restaurant/$slug"
                params={{ slug: r.slug }}
                className="group block rounded-2xl bg-card border border-border p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <ComboCard r={r} city={city} locale={locale} />
              </Link>
            ) : (
              <Link
                key={r.id}
                to="/$lang/restaurant/$slug"
                params={{ lang: locale, slug: r.slug }}
                className="group block rounded-2xl bg-card border border-border p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <ComboCard r={r} city={city} locale={locale} />
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="font-display text-xl text-ink mb-4">{t(locale, "internal.exploreMore")}</h2>
        <div className="flex flex-wrap gap-2">
          {locale === DEFAULT_LOCALE ? (
            <>
              <Link
                to="/stad/$city"
                params={{ city: citySlug }}
                className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {t(locale, "internal.alsoIn", { city })}
              </Link>
              <Link
                to="/keuken/$cuisine"
                params={{ cuisine: cuisineKey }}
                className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {label} (alle steden)
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/$lang/stad/$city"
                params={{ lang: locale, city: citySlug }}
                className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {t(locale, "internal.alsoIn", { city })}
              </Link>
              <Link
                to="/$lang/keuken/$cuisine"
                params={{ lang: locale, cuisine: cuisineKey }}
                className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {label}
              </Link>
            </>
          )}
        </div>
      </section>

      <FaqSection locale={locale} items={faq} />

      <SiteFooter locale={locale} />
    </div>
  );
}

function ComboCard({ r, city, locale }: { r: any; city: string; locale: LocaleCode }) {
  return (
    <>
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
        {r.address || city}
      </p>
    </>
  );
}

function ComboPage() {
  const { city, cuisine } = Route.useParams();
  return <ComboPageBody citySlug={city} cuisineKey={cuisine} />;
}
