import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLocale } from "@/lib/i18n/context";

/**
 * 100% eigen AVG/GDPR cookie banner.
 * - Geen externe scripts of third-party SDK's.
 * - Opt-in voor analytics/marketing (default: alleen functioneel).
 * - Keuze wordt 12 maanden bewaard in localStorage.
 * - Andere code kan `window.cookieConsent` lezen of luisteren naar
 *   het `cookieconsent` custom event om scripts pas te laden ná consent.
 */
const STORAGE_KEY = "pr_cookie_consent_v1";
const TTL_DAYS = 365;

export type ConsentChoice = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

declare global {
  interface Window {
    cookieConsent?: ConsentChoice;
  }
}

function readStored(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentChoice;
    const ageDays = (Date.now() - parsed.ts) / (1000 * 60 * 60 * 24);
    if (ageDays > TTL_DAYS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(choice: ConsentChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  } catch {}
  window.cookieConsent = choice;
  window.dispatchEvent(new CustomEvent("cookieconsent", { detail: choice }));
}

const COPY = {
  nl: {
    title: "Cookies & privacy",
    body:
      "We gebruiken alleen noodzakelijke cookies om de website te laten werken. Met jouw toestemming meten we anoniem gebruik om PlaceResults te verbeteren. Je kunt je keuze later altijd wijzigen.",
    accept: "Alles accepteren",
    reject: "Alleen noodzakelijk",
    settings: "Instellingen",
    save: "Voorkeuren opslaan",
    necessary: "Noodzakelijk",
    necessaryDesc: "Vereist voor de basisfuncties zoals taalkeuze en navigatie. Altijd actief.",
    analytics: "Analytisch",
    analyticsDesc: "Anonieme statistieken om de site te verbeteren (geen profilering).",
    marketing: "Marketing",
    marketingDesc: "Persoonlijke aanbevelingen of advertenties (momenteel niet gebruikt).",
    more: "Meer info",
  },
  en: {
    title: "Cookies & privacy",
    body:
      "We only use strictly necessary cookies to run the site. With your consent we measure anonymous usage to improve PlaceResults. You can change your choice at any time.",
    accept: "Accept all",
    reject: "Only necessary",
    settings: "Settings",
    save: "Save preferences",
    necessary: "Necessary",
    necessaryDesc: "Required for basic features like language and navigation. Always on.",
    analytics: "Analytics",
    analyticsDesc: "Anonymous statistics to improve the site (no profiling).",
    marketing: "Marketing",
    marketingDesc: "Personalised recommendations or ads (not currently used).",
    more: "Learn more",
  },
} as const;

export function CookieBanner() {
  const locale = useLocale();
  const lang = locale === "nl" ? "nl" : "en";
  const c = COPY[lang];

  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      window.cookieConsent = stored;
      setAnalytics(stored.analytics);
      setMarketing(stored.marketing);
    } else {
      // Small delay to avoid layout shift on first paint.
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setShowDetails(true);
      setOpen(true);
    };
    window.addEventListener("open-cookie-settings", handler);
    return () => window.removeEventListener("open-cookie-settings", handler);
  }, []);

  if (!open) return null;

  const decide = (a: boolean, m: boolean) => {
    persist({ necessary: true, analytics: a, marketing: m, ts: Date.now() });
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 backdrop-blur shadow-xl">
        <div className="p-5 sm:p-6">
          <h2 id="cookie-banner-title" className="font-display text-lg font-bold text-ink">
            {c.title}
          </h2>
          <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
            {c.body}{" "}
            <Link to="/cookies" className="underline hover:text-primary">
              {c.more}
            </Link>
          </p>

          {showDetails && (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <label className="flex items-start gap-3 opacity-70">
                <input type="checkbox" checked disabled className="mt-1" />
                <div>
                  <div className="font-semibold text-sm">{c.necessary}</div>
                  <div className="text-xs text-foreground/70">{c.necessaryDesc}</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-sm">{c.analytics}</div>
                  <div className="text-xs text-foreground/70">{c.analyticsDesc}</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-sm">{c.marketing}</div>
                  <div className="text-xs text-foreground/70">{c.marketingDesc}</div>
                </div>
              </label>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2 justify-end">
            {!showDetails && (
              <button
                onClick={() => setShowDetails(true)}
                className="text-sm font-semibold px-4 py-2 rounded-full hover:bg-muted"
              >
                {c.settings}
              </button>
            )}
            <button
              onClick={() => decide(false, false)}
              className="text-sm font-semibold px-4 py-2 rounded-full border border-border hover:bg-muted"
            >
              {c.reject}
            </button>
            {showDetails ? (
              <button
                onClick={() => decide(analytics, marketing)}
                className="text-sm font-semibold px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {c.save}
              </button>
            ) : (
              <button
                onClick={() => decide(true, true)}
                className="text-sm font-semibold px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {c.accept}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Helper button — use in footer to reopen settings later. */
export function CookieSettingsButton({ className, label }: { className?: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-settings"))}
      className={className}
    >
      {label}
    </button>
  );
}
