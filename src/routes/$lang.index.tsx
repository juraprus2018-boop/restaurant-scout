import { createFileRoute, notFound } from "@tanstack/react-router";
import { Home } from "./index";
import { isLocale, LOCALES, DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/strings";

export const Route = createFileRoute("/$lang/")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.lang)) throw notFound();
  },
  head: ({ params }) => {
    const lang = (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE) as LocaleCode;
    const alternates = LOCALES.map((l) => ({
      rel: "alternate",
      hreflang: l.code,
      href: l.code === DEFAULT_LOCALE ? "/" : `/${l.code}`,
    }));
    return {
      meta: [
        { title: t(lang, "home.meta.title") },
        { name: "description", content: t(lang, "home.meta.desc") },
        { property: "og:title", content: t(lang, "home.meta.titleOg") },
        { property: "og:description", content: t(lang, "home.meta.descOg") },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/${lang}` },
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
