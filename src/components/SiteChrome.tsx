import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, MapPin, Building2, Star, Home } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CookieSettingsButton } from "./CookieBanner";
import { t } from "@/lib/i18n/strings";
import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import logoHeader from "@/assets/logo-placeresults.png.asset.json";
import logoFooter from "@/assets/logo-footer.png.asset.json";

interface ChromeProps {
  locale?: LocaleCode;
}

export function SiteHeader({ locale = DEFAULT_LOCALE }: ChromeProps = {}) {
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: "/" as const, label: t(locale, "nav.restaurants"), icon: Home, hash: undefined },
    { to: "/steden" as const, label: t(locale, "cities.title"), icon: Building2, hash: undefined },
    { to: "/" as const, label: t(locale, "nav.map"), icon: MapPin, hash: "kaart" },
    { to: "/" as const, label: t(locale, "nav.topRated"), icon: Star, hash: "top" },
  ];

  return (
    <header className="sticky top-0 z-[1000] bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-extrabold text-lg">●</span>
          <span className="font-display text-xl text-ink">PlaceResults.com</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-foreground/80">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              hash={item.hash}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher current={locale} />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col">
            {navItems.map((item, i) => (
              <Link
                key={i}
                to={item.to}
                hash={item.hash}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-2 py-3 rounded-lg text-sm font-semibold text-foreground hover:bg-muted"
              >
                <item.icon className="w-4 h-4 text-primary" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
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
            <span className="font-display text-xl">PlaceResults.com</span>
          </div>
          <p className="mt-3 max-w-sm leading-relaxed">{t(locale, "footer.tagline")}</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-3">{t(locale, "footer.explore")}</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-accent">{t(locale, "nav.restaurants")}</Link></li>
            <li><Link to="/steden" className="hover:text-accent">{t(locale, "cities.title")}</Link></li>
            <li><Link to="/" hash="kaart" className="hover:text-accent">{t(locale, "nav.map")}</Link></li>
            <li><Link to="/" hash="top" className="hover:text-accent">{t(locale, "nav.topRated")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-3">Legal</h4>
          <ul className="space-y-2">
            <li><Link to="/privacy" className="hover:text-accent">Privacybeleid</Link></li>
            <li><Link to="/voorwaarden" className="hover:text-accent">Algemene voorwaarden</Link></li>
            <li><Link to="/cookies" className="hover:text-accent">Cookiebeleid</Link></li>
            <li>
              <CookieSettingsButton
                label="Cookievoorkeuren"
                className="hover:text-accent text-left"
              />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} PlaceResults · {t(locale, "footer.dataVia")} <a href="https://www.openstreetmap.org" className="underline hover:text-accent">OpenStreetMap</a>
      </div>
    </footer>
  );
}
