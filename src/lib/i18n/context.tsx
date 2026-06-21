import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Link, useLocation, type LinkComponentProps } from "@tanstack/react-router";
import { DEFAULT_LOCALE, isLocale, type LocaleCode } from "./locales";

/**
 * LocaleContext: derives the active locale from the current URL pathname.
 *
 * Every page automatically gets the right locale, no prop drilling needed.
 * Components call `useLocale()` to read it.
 */
const LocaleContext = createContext<LocaleCode>(DEFAULT_LOCALE);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const locale = useMemo<LocaleCode>(() => {
    const first = location.pathname.split("/").filter(Boolean)[0];
    return isLocale(first) ? first : DEFAULT_LOCALE;
  }, [location.pathname]);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleCode {
  return useContext(LocaleContext);
}

/**
 * LLink, locale-aware <Link>.
 *
 * Usage is identical to <Link to="/restaurant/$slug" params={{ slug }} />.
 * If the current locale is non-default, LLink rewrites the route to its
 * `/$lang/...` mirror automatically, preserving the language during
 * internal navigation.
 *
 * For new content routes, create both `xxx.tsx` and `$lang.xxx.tsx`
 * (see src/routes/README.md) and LLink handles the rest.
 */
type LLinkProps = Omit<LinkComponentProps, "to" | "params"> & {
  to: string;
  params?: Record<string, string>;
};

const LOCALIZED_PREFIXES = ["/", "/stad/$city", "/keuken/$cuisine", "/restaurant/$slug"];

export function LLink({ to, params, ...rest }: LLinkProps) {
  const locale = useLocale();

  if (locale === DEFAULT_LOCALE || !LOCALIZED_PREFIXES.includes(to)) {
    return <Link to={to as any} params={params as any} {...(rest as any)} />;
  }

  const localizedTo = to === "/" ? "/$lang" : `/$lang${to}`;
  return (
    <Link
      to={localizedTo as any}
      params={{ ...(params ?? {}), lang: locale } as any}
      {...(rest as any)}
    />
  );
}
