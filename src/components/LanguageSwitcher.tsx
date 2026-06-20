import { useRouter, useLocation } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { LOCALES, isLocale, DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";

interface Props {
  /** Current page's locale; default is used at root. */
  current?: LocaleCode;
}

/**
 * Rewrites the current path to the chosen locale.
 * Supports all localized routes:
 *   /                      ⇄ /{lang}
 *   /stad/$city            ⇄ /{lang}/stad/$city
 *   /keuken/$cuisine       ⇄ /{lang}/keuken/$cuisine
 *   /restaurant/$slug      ⇄ /{lang}/restaurant/$slug
 * Other paths (e.g. /auth) fall back to the localized home.
 */
function rewritePath(pathname: string, target: LocaleCode): string {
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length && isLocale(segs[0])) segs.shift();

  const LOCALIZABLE = new Set(["stad", "keuken", "restaurant"]);
  const isLocalizable = segs.length === 0 || (segs[0] && LOCALIZABLE.has(segs[0]));
  if (!isLocalizable) {
    // Unknown / non-localized path — go to localized home.
    return target === DEFAULT_LOCALE ? "/" : `/${target}`;
  }
  if (segs.length === 0) {
    return target === DEFAULT_LOCALE ? "/" : `/${target}`;
  }
  if (target === DEFAULT_LOCALE) return "/" + segs.join("/");
  return "/" + target + "/" + segs.join("/");
}

export function LanguageSwitcher({ current }: Props) {
  const router = useRouter();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active: LocaleCode = current ?? DEFAULT_LOCALE;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const activeLocale = LOCALES.find((l) => l.code === active) ?? LOCALES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full hover:bg-muted"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{activeLocale.flag} {activeLocale.code.toUpperCase()}</span>
        <span className="sm:hidden">{activeLocale.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 max-h-96 overflow-auto rounded-xl border border-border bg-popover shadow-xl z-50 py-2">
          {LOCALES.map((l) => {
            const isActive = l.code === active;
            const href = rewritePath(location.pathname, l.code);
            return (
              <a
                key={l.code}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  try { window.localStorage.setItem("pr_lang", l.code); } catch { /* ignore */ }
                  setOpen(false);
                  router.navigate({ to: href });
                }}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted ${isActive ? "font-semibold" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{l.flag}</span>
                  <span>{l.name}</span>
                </span>
                {isActive && <Check className="w-4 h-4 text-primary" />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
