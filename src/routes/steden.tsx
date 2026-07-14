import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { CitiesPageBody, citiesQuery } from "@/components/CitiesPage";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";

export const Route = createFileRoute("/steden")({
  loader: ({ context }) => context.queryClient.ensureQueryData(citiesQuery()),
  head: () => {
    const title = t(DEFAULT_LOCALE, "cities.title");
    const desc = t(DEFAULT_LOCALE, "cities.intro");
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://placeresults.com/steden" },
        { property: "og:locale", content: DEFAULT_LOCALE },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "canonical", href: "https://placeresults.com/steden" },
        ...LOCALES.map((l) => ({
          rel: "alternate",
          hreflang: l.code,
          href: l.code === DEFAULT_LOCALE ? "https://placeresults.com/steden" : `https://placeresults.com/${l.code}/steden`,
        })),
        { rel: "alternate", hreflang: "x-default", href: "https://placeresults.com/steden" },
      ],
    };
  },
  component: () => <CitiesPageBody locale={DEFAULT_LOCALE} />,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl mb-2">{t(DEFAULT_LOCALE, "city.error")}</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button onClick={() => { reset(); router.invalidate(); }} className="text-primary underline">
            {t(DEFAULT_LOCALE, "city.retry")}
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <Link to="/" className="text-primary underline">{t(DEFAULT_LOCALE, "city.backHome")}</Link>
    </div>
  ),
});
