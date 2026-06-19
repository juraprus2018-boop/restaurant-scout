import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listByCity } from "@/lib/seo-public.functions";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { MapPin, Star } from "lucide-react";
import { cuisineLabel } from "@/lib/osm-labels";

const cityQuery = (slug: string) =>
  queryOptions({
    queryKey: ["city", slug],
    queryFn: () => listByCity({ data: { citySlug: slug, limit: 48 } }),
    staleTime: 5 * 60_000,
  });

export const Route = createFileRoute("/stad/$city")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(cityQuery(params.city)),
  head: ({ loaderData, params }) => {
    const city = loaderData?.city ?? params.city;
    const total = loaderData?.total ?? 0;
    const title = `Restaurants in ${city} — Top ${total.toLocaleString("nl-NL")} eetgelegenheden | PlaceResults`;
    const desc = `Vind de beste restaurants, cafés en bars in ${city}. Bekijk ${total.toLocaleString("nl-NL")} eetgelegenheden met openingstijden, keuken en reviews.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/stad/${params.city}` }],
    };
  },
  component: CityPage,
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
        <h1 className="font-display text-3xl mb-2">Stad niet gevonden</h1>
        <Link to="/" className="text-primary underline">Terug naar home</Link>
      </div>
    </div>
  ),
});

function CityPage() {
  const { city: slug } = Route.useParams();
  const { data } = useSuspenseQuery(cityQuery(slug));
  const { city, total, items } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Restaurants in ${city}`,
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
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <nav className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary">Home</Link> / <span>Stad</span> / <span className="text-foreground">{city}</span>
          </nav>
          <h1 className="font-display text-4xl sm:text-5xl text-ink">Restaurants in {city}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Ontdek {total.toLocaleString("nl-NL")} restaurants, cafés en bars in {city}.
            Gesorteerd op beoordeling — vind de favoriete plekken van bezoekers.
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
                {r.address || city}
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

      <SiteFooter />
    </div>
  );
}
