import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { CitiesPageBody, citiesQuery } from "@/components/CitiesPage";
import { LOCALES, DEFAULT_LOCALE, isLocale, type LocaleCode } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";

export const Route = createFileRoute("/$lang/steden")({
  beforeLoad: ({ params }) => { if (!isLocale(params.lang)) throw notFound(); },
  loader: ({ context }) => context.queryClient.ensureQueryData(citiesQuery()),
  head: ({ params }) => {
    const lang = params.lang as LocaleCode;
    const title = t(lang, "cities.title");
    const desc = t(lang, "cities.intro");
    const path = `https://placeresults.com/${lang}/steden`;
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
          href: l.code === DEFAULT_LOCALE ? "/steden" : `/${l.code}/steden`,
        })),
        { rel: "alternate", hreflang: "x-default", href: "/steden" },
      ],
    };
  },
  component: LocalizedCitiesPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl mb-2">{t("en", "city.error")}</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button onClick={() => { reset(); router.invalidate(); }} className="text-primary underline">
            {t("en", "city.retry")}
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <Link to="/" className="text-primary underline">{t("en", "city.backHome")}</Link>
    </div>
  ),
});

function LocalizedCitiesPage() {
  const { lang } = Route.useParams();
  return <CitiesPageBody locale={lang as LocaleCode} />;
}
