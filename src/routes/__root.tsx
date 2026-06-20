import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LocaleProvider } from "../lib/i18n/context";
import { DEFAULT_LOCALE, isLocale } from "../lib/i18n/locales";
import { CookieBanner } from "../components/CookieBanner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PlaceResults — Ontdek de beste restaurants" },
      { name: "description", content: "Een eerlijke gids voor restaurants, cafés en bistro's. Ontdek nieuwe plekken op de kaart, lees reviews en deel je favoriete adressen." },
      { name: "author", content: "PlaceResults" },
      { name: "theme-color", content: "#2D6A4F" },
      { property: "og:title", content: "PlaceResults — Restaurantgids op de kaart" },
      { property: "og:description", content: "Ontdek restaurants, cafés en bistro's bij jou in de buurt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" },
      // Favicon set for all devices and browsers
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "mask-icon", href: "/favicon.svg", color: "#2D6A4F" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Derive `<html lang>` from the URL so search engines and assistive
  // tech see the correct language on every localized page.
  const location = useLocation();
  const htmlLang = useMemo(() => {
    const first = location.pathname.split("/").filter(Boolean)[0];
    return isLocale(first) ? first : DEFAULT_LOCALE;
  }, [location.pathname]);

  return (
    <html lang={htmlLang}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AutoLocaleRedirect() {
  // Detects browser language on first visit and redirects to the matching
  // localized URL. Respects an explicit choice stored in localStorage so
  // a user who switches language manually is never overridden.
  useEffect(() => {
    try {
      const path = window.location.pathname;
      const segs = path.split("/").filter(Boolean);
      // Only auto-redirect from the root URL ("/"). Any deeper page is left as-is.
      if (segs.length !== 0) return;

      const stored = window.localStorage.getItem("pr_lang");
      const candidates: string[] = [];
      if (stored) candidates.push(stored);
      else {
        const langs = (navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language || ""]) as string[];
        for (const l of langs) {
          const code = (l || "").toLowerCase().split("-")[0];
          if (code) candidates.push(code);
        }
      }

      for (const c of candidates) {
        if (isLocale(c) && c !== DEFAULT_LOCALE) {
          window.location.replace(`/${c}${window.location.search}${window.location.hash}`);
          return;
        }
        if (isLocale(c)) return; // matched default — stay
      }
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AutoLocaleRedirect />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <CookieBanner />
      </LocaleProvider>
    </QueryClientProvider>
  );
}
