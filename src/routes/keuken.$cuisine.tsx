import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listByCuisine } from "@/lib/seo-public.functions";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { MapPin, Star } from "lucide-react";
import { cuisineLabel } from "@/lib/osm-labels";
import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";

const cuisineQuery = (key: string) =>
  queryOptions({
    queryKey: ["cuisine", key],
    queryFn: () => listByCuisine({ data: { cuisine: key, limit: 48 } }),
    staleTime: 5 * 60_000,
  });

export const Route = createFileRoute("/keuken/$cuisine")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(cuisineQuery(params.cuisine)),
  head: ({ loaderData, params }) => {
    const label = loaderData ? cuisineLabel(loaderData.cuisine) : params.cuisine;
    const total = loaderData?.total ?? 0;
    const title = `${label} restaurants — Top ${total.toLocaleString("nl-NL")} adressen | PlaceResults`;
    const desc = `Vind de beste ${label.toLowerCase()} restaurants. ${total.toLocaleString("nl-NL")} adressen met reviews, openingstijden en locatie.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/keuken/${params.cuisine}` }],
    };
  },
  component: CuisinePage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl mb-2">Er ging iets mis</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button onClick={() => { reset(); router.invalidate(); }} className="text-primary underline">Opnieuw proberen</button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-3xl mb-2">Keuken niet gevonden</h1>
        <Link to="/" className="text-primary underline">Terug naar home</Link>
      </div>
    </div>
  ),
});

function CuisinePage() {
  return <CuisinePageBody />;
}

export function CuisinePageBody({ locale = DEFAULT_LOCALE, cuisineKey }: { locale?: LocaleCode; cuisineKey?: string } = {}) {
  const params = Route.useParams();
  const key = cuisineKey ?? params.cuisine;
  const { data } = useSuspenseQuery(cuisineQuery(key));
  const { cuisine, total, items } = data;
  const label = cuisineLabel(cuisine);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${label} restaurants`,
    numberOfItems: total,
    itemListElement: items.slice(0, 20).map((r: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `/restaurant/${r.slug}`,
      name: r.name,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary">Home</Link> / <span>Keuken</span> / <span className="text-foreground">{label}</span>
          </nav>
          <h1 className="font-display text-4xl sm:text-5xl text-ink">{label} restaurants</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            {total.toLocaleString("nl-NL")} {label.toLowerCase()} restaurants — gesorteerd op beoordeling.
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
                  <span className="text-muted-foreground">· {r.review_count} reviews</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {r.address || r.city || "Adres onbekend"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter locale={locale} />
    </div>
  );
}
