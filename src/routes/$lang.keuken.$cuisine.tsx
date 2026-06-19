import { createFileRoute, notFound, Link, useRouter } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { listByCuisine } from "@/lib/seo-public.functions";
import { CuisinePageBody } from "./keuken.$cuisine";
import { isLocale, LOCALES, DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import { cuisineLabel } from "@/lib/osm-labels";

const cuisineQuery = (key: string) =>
  queryOptions({
    queryKey: ["cuisine", key],
    queryFn: () => listByCuisine({ data: { cuisine: key, limit: 48 } }),
    staleTime: 5 * 60_000,
  });

export const Route = createFileRoute("/$lang/keuken/$cuisine")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.lang)) throw notFound();
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(cuisineQuery(params.cuisine)),
  head: ({ params, loaderData }) => {
    const lang = params.lang as LocaleCode;
    const label = loaderData ? cuisineLabel(loaderData.cuisine) : params.cuisine;
    const alternates = LOCALES.map((l) => ({
      rel: "alternate",
      hreflang: l.code,
      href:
        l.code === DEFAULT_LOCALE
          ? `/keuken/${params.cuisine}`
          : `/${l.code}/keuken/${params.cuisine}`,
    }));
    return {
      meta: [
        { title: `${label} restaurants — PlaceResults` },
        { property: "og:locale", content: lang },
      ],
      links: [
        { rel: "canonical", href: `/${lang}/keuken/${params.cuisine}` },
        ...alternates,
        { rel: "alternate", hreflang: "x-default", href: `/keuken/${params.cuisine}` },
      ],
    };
  },
  component: LocalizedCuisine,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 text-center">
        <p>{error.message}</p>
        <button onClick={() => { reset(); router.invalidate(); }} className="text-primary underline">Retry</button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <Link to="/" className="text-primary underline">← Home</Link>
    </div>
  ),
});

function LocalizedCuisine() {
  const { lang, cuisine } = Route.useParams();
  return <CuisinePageBody locale={lang as LocaleCode} cuisineKey={cuisine} />;
}
