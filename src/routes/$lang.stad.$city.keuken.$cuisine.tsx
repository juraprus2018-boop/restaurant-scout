import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ComboPageBody, comboQuery, buildComboHead } from "./stad.$city.keuken.$cuisine";
import { isLocale, type LocaleCode } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";

export const Route = createFileRoute("/$lang/stad/$city/keuken/$cuisine")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.lang)) throw notFound();
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      comboQuery(params.lang as LocaleCode, params.city, params.cuisine),
    ),
  head: ({ params, loaderData }) =>
    buildComboHead(params.lang as LocaleCode, params.city, params.cuisine, loaderData),
  component: LocalizedComboPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-destructive">{error.message}</p>
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

function LocalizedComboPage() {
  const { lang, city, cuisine } = Route.useParams();
  return <ComboPageBody locale={lang as LocaleCode} citySlug={city} cuisineKey={cuisine} />;
}
