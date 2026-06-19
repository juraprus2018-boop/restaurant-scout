import { Link } from "@tanstack/react-router";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { t } from "@/lib/i18n/strings";
import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";

interface ChromeProps {
  locale?: LocaleCode;
}

export function SiteHeader({ locale = DEFAULT_LOCALE }: ChromeProps = {}) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-extrabold text-lg">●</span>
          <span className="font-display text-xl text-ink">PlaceResults</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-foreground/80">
          <Link to="/" hash="ontdek" className="hover:text-primary">{t(locale, "nav.restaurants")}</Link>
          <Link to="/" hash="kaart" className="hover:text-primary">{t(locale, "nav.map")}</Link>
          <Link to="/" hash="top" className="hover:text-primary">{t(locale, "nav.topRated")}</Link>
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitcher current={locale} />
          <Link to="/auth" className="text-sm font-semibold px-4 py-2 rounded-full hover:bg-muted">{t(locale, "nav.login")}</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ locale = DEFAULT_LOCALE }: ChromeProps = {}) {
  return (
    <footer className="bg-ink text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-4 gap-8 text-sm">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2 text-white">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-accent text-ink font-extrabold">●</span>
            <span className="font-display text-xl">PlaceResults</span>
          </div>
          <p className="mt-3 max-w-sm leading-relaxed">{t(locale, "footer.tagline")}</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-3">{t(locale, "footer.explore")}</h4>
          <ul className="space-y-2">
            <li><Link to="/" hash="ontdek" className="hover:text-accent">{t(locale, "nav.restaurants")}</Link></li>
            <li><Link to="/" hash="kaart" className="hover:text-accent">{t(locale, "nav.map")}</Link></li>
            <li><Link to="/" hash="top" className="hover:text-accent">{t(locale, "nav.topRated")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-3">{t(locale, "footer.about")}</h4>
          <p>{t(locale, "footer.dataVia")} <a href="https://www.openstreetmap.org" className="underline hover:text-accent">OpenStreetMap</a>.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} PlaceResults
      </div>
    </footer>
  );
}
