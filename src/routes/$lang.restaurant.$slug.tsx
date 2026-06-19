import { createFileRoute, notFound, Link, useRouter } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { getRestaurantBySlug } from "@/lib/restaurants-public.functions";
import { RestaurantPageBody, buildRestaurantHead } from "./restaurant.$slug";
import { isLocale, type LocaleCode } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";
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
  head: ({ params, loaderData }) =>
    buildRestaurantHead(params.lang as LocaleCode, params.slug, loaderData?.restaurant, true),
  component: LocalizedRestaurant,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={() => { reset(); router.invalidate(); }}>{t("en", "city.retry")}</Button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">{t("en", "restaurant.notFound")}</h1>
      <Link to="/" className="text-primary hover:underline">← {t("en", "city.backHome")}</Link>
    </div>
  ),
});

function LocalizedRestaurant() {
  const { lang, slug } = Route.useParams();
  return <RestaurantPageBody locale={lang as LocaleCode} slug={slug} />;
}
