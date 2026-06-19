import { createFileRoute, notFound } from "@tanstack/react-router";
import { Home } from "./index";
import { isLocale, LOCALES, DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$lang/")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.lang)) throw notFound();
  },
  head: ({ params }) => {
    const lang = params.lang as LocaleCode;
    const alternates = LOCALES.map((l) => ({
      rel: "alternate",
      hreflang: l.code,
      href: l.code === DEFAULT_LOCALE ? "/" : `/${l.code}`,
    }));
    return {
      meta: [
        { title: "PlaceResults — Discover the best restaurants" },
        { name: "description", content: "Find restaurants, cafés and bars with real reviews and ratings." },
        { property: "og:locale", content: lang },
      ],
      links: [
        { rel: "canonical", href: `/${lang}` },
        ...alternates,
        { rel: "alternate", hreflang: "x-default", href: "/" },
      ],
    };
  },
  component: LocalizedHome,
});

function LocalizedHome() {
  const { lang } = Route.useParams();
  return <Home locale={lang as LocaleCode} />;
}
