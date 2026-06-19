import { createFileRoute, notFound, Link, useRouter } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { getRestaurantBySlug } from "@/lib/restaurants-public.functions";
import { RestaurantPageBody } from "./restaurant.$slug";
import { isLocale, LOCALES, DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/button";

const restaurantQuery = (slug: string) =>
  queryOptions({
    queryKey: ["restaurant", slug],
    queryFn: () => getRestaurantBySlug({ data: { slug } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/$lang/restaurant/$slug")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.lang)) throw notFound();
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(restaurantQuery(params.slug)),
  head: ({ params, loaderData }) => {
    const lang = params.lang as LocaleCode;
    const r = loaderData?.restaurant;
    const title = r?.name ? `${r.name} — PlaceResults` : "Restaurant — PlaceResults";
    const alternates = LOCALES.map((l) => ({
      rel: "alternate",
      hreflang: l.code,
      href:
        l.code === DEFAULT_LOCALE
          ? `/restaurant/${params.slug}`
          : `/${l.code}/restaurant/${params.slug}`,
    }));
    return {
      meta: [
        { title },
        { property: "og:locale", content: lang },
      ],
      links: [
        { rel: "canonical", href: `/${lang}/restaurant/${params.slug}` },
        ...alternates,
        { rel: "alternate", hreflang: "x-default", href: `/restaurant/${params.slug}` },
      ],
    };
  },
  component: LocalizedRestaurant,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={() => { reset(); router.invalidate(); }}>Retry</Button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Not found</h1>
      <Link to="/" className="text-primary hover:underline">← Home</Link>
    </div>
  ),
});

function LocalizedRestaurant() {
  const { lang, slug } = Route.useParams();
  return <RestaurantPageBody locale={lang as LocaleCode} slug={slug} />;
}
