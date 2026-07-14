import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listByCity } from "@/lib/seo-public.functions";
import { getLandingCopy } from "@/lib/seo-translations.functions";
import { getLandingFaq } from "@/lib/seo-faq.functions";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { FaqSection } from "@/components/seo/FaqSection";
import { breadcrumbListJsonLd, aggregateRatingJsonLd } from "@/lib/seo-jsonld";
import { MapPin, Star } from "lucide-react";
import { cuisineLabel } from "@/lib/osm-labels";
import { isLocale, LOCALES, DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";

const localizedCityQuery = (lang: LocaleCode, slug: string) =>
  queryOptions({
    queryKey: ["city-localized-faq", lang, slug],
    queryFn: async () => {
      const base = await listByCity({ data: { citySlug: slug, limit: 48 } });
      const [copy, faq] = await Promise.all([
        getLandingCopy({
          data: { scope: "city", key: slug, lang, displayName: base.city, total: base.total },
        }),
        getLandingFaq({
          data: {
            scope: "city",
            key: slug,
            lang,
            displayName: base.city,
            sampleNames: base.items.slice(0, 8).map((r: any) => r.name),
          },
        }).catch(() => ({ items: [] })),
      ]);
      return { ...base, copy, faq: faq.items };
    },
    staleTime: 60 * 60_000,
  });

export const Route = createFileRoute("/$lang/stad/$city")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.lang)) throw notFound();
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(localizedCityQuery(params.lang as LocaleCode, params.city)),
  head: ({ loaderData, params }) => {
    const lang = params.lang as LocaleCode;
    const city = loaderData?.city ?? params.city;
    const title = loaderData?.copy.title ?? `${city}, PlaceResults`;
    const desc = loaderData?.copy.description ?? "";
    const path = `https://placeresults.com/${lang}/stad/${params.city}`;

    const alternates = LOCALES.map((l) => ({
      rel: "alternate",
      hreflang: l.code,
      href: l.code === DEFAULT_LOCALE ? `/stad/${params.city}` : `/${l.code}/stad/${params.city}`,
    }));

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
        ...alternates,
        { rel: "alternate", hreflang: "x-default", href: `/stad/${params.city}` },
      ],
    };
  },
  component: LocalizedCityPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl mb-2">{t("en", "city.error")}</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button onClick={() => { reset(); router.invalidate(); }} className="text-primary underline">{t("en", "city.retry")}</button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-3xl mb-2">{t("en", "city.notFound")}</h1>
        <Link to="/" className="text-primary underline">{t("en", "city.backHome")}</Link>
      </div>
    </div>
  ),
});

function LocalizedCityPage() {
  const params = Route.useParams();
  const lang = params.lang as LocaleCode;
  const { data } = useSuspenseQuery(localizedCityQuery(lang, params.city));
  const { city, total, items, copy, faq } = data;

  const cuisineCounts = new Map<string, number>();
  for (const r of items) {
    for (const c of (r.cuisine ?? []) as string[]) {
      cuisineCounts.set(c, (cuisineCounts.get(c) ?? 0) + 1);
    }
  }
  const topCuisines = Array.from(cuisineCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([c]) => c);

  const langPrefix = lang === DEFAULT_LOCALE ? "" : `/${lang}`;
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.title,
    inLanguage: lang,
    numberOfItems: total,
    itemListElement: items.slice(0, 20).map((r: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${langPrefix}/restaurant/${r.slug}`,
      name: r.name,
    })),
  };
  const breadcrumbsLd = breadcrumbListJsonLd([
    { name: t(lang, "city.breadcrumb.home"), item: lang === DEFAULT_LOCALE ? "/" : `/${lang}` },
    { name: t(lang, "city.breadcrumb.cities"), item: `${langPrefix}/steden` },
    { name: city, item: `${langPrefix}/stad/${params.city}` },
  ]);
  const aggLd = aggregateRatingJsonLd(copy.title, lang, items);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader locale={lang} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }} />
      {aggLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggLd) }} />}

      <section className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary">{t(lang, "city.breadcrumb.home")}</Link>
            {" / "}
            {lang === DEFAULT_LOCALE ? (
              <Link to="/steden" className="hover:text-primary">{t(lang, "city.breadcrumb.cities")}</Link>
            ) : (
              <Link to="/$lang/steden" params={{ lang }} className="hover:text-primary">{t(lang, "city.breadcrumb.cities")}</Link>
            )}
            {" / "}
            <span className="text-foreground">{city}</span>
          </nav>
          <h1 className="font-display text-4xl sm:text-5xl text-ink">{t(lang, "city.heading", { city })}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            {copy.intro && !/\d/.test(copy.intro) ? copy.intro : t(lang, "city.subheading", { city })}
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
                  <span className="text-muted-foreground">· {r.review_count} {t(lang, "city.reviewsLabel")}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {r.address || city || t(lang, "city.addressUnknown")}
              </p>
              {r.cuisine?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {r.cuisine.slice(0, 3).map((c: string) => (
                    <span key={c} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                      {cuisineLabel(c)}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {topCuisines.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="font-display text-xl text-ink mb-4">
            {t(lang, "internal.cuisinesInCity", { city })}
          </h2>
          <div className="flex flex-wrap gap-2">
            {topCuisines.map((c) =>
              lang === DEFAULT_LOCALE ? (
                <Link
                  key={c}
                  to="/stad/$city/keuken/$cuisine"
                  params={{ city: params.city, cuisine: c }}
                  className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {cuisineLabel(c)}
                </Link>
              ) : (
                <Link
                  key={c}
                  to="/$lang/stad/$city/keuken/$cuisine"
                  params={{ lang, city: params.city, cuisine: c }}
                  className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {cuisineLabel(c)}
                </Link>
              ),
            )}
          </div>
        </section>
      )}

      <FaqSection locale={lang} items={faq} />

      <SiteFooter locale={lang} />
    </div>
  );
}
