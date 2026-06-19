import { createFileRoute, notFound, Link, useRouter } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { listByCuisine } from "@/lib/seo-public.functions";
import { CuisinePageBody, buildCuisineHead } from "./keuken.$cuisine";
import { isLocale, type LocaleCode } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";

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
  head: ({ params, loaderData }) =>
    buildCuisineHead(params.lang as LocaleCode, params.cuisine, loaderData),
  component: LocalizedCuisine,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 text-center">
        <p>{error.message}</p>
        <button onClick={() => { reset(); router.invalidate(); }} className="text-primary underline">{t("en", "city.retry")}</button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <Link to="/" className="text-primary underline">← {t("en", "city.backHome")}</Link>
    </div>
  ),
});

function LocalizedCuisine() {
  const { lang, cuisine } = Route.useParams();
  return <CuisinePageBody locale={lang as LocaleCode} cuisineKey={cuisine} />;
}
