# Routing & i18n conventions

## Multilingual by default

This app is fully multilingual: every public content page must work in all 20 supported locales (see `src/lib/i18n/locales.ts`). Dutch is the default and lives at the root; the other 19 are served from a `/{lang}` prefix.

## Pattern: one route, two files

For every public content route, create **two** files:

| Locale          | File                              | Path                          |
| --------------- | --------------------------------- | ----------------------------- |
| Dutch (default) | `src/routes/foo.bar.tsx`          | `/foo/bar`                    |
| All others      | `src/routes/$lang.foo.bar.tsx`    | `/{lang}/foo/bar`             |

The `$lang.*.tsx` file is a thin wrapper:

```tsx
// $lang.foo.bar.tsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import { isLocale, type LocaleCode } from "@/lib/i18n/locales";
import { FooBarBody } from "./foo.bar";

export const Route = createFileRoute("/$lang/foo/bar")({
  beforeLoad: ({ params }) => { if (!isLocale(params.lang)) throw notFound(); },
  loader: /* same as NL route */,
  head:   /* same + add hreflang alternates + og:locale */,
  component: () => {
    const { lang } = Route.useParams();
    return <FooBarBody locale={lang as LocaleCode} />;
  },
});
```

The NL file exports a `*Body` component that accepts `{ locale }`. Both routes render the same body — only the locale differs.

## Inside the body

- Use `useLocale()` (from `@/lib/i18n/context`) to read the active locale anywhere in the tree, **or** accept `locale` as a prop on the body component.
- All UI text comes from `t(locale, "key", { vars })` in `@/lib/i18n/strings`.
- **Never** hardcode user-visible Dutch strings — add the key to `strings.ts` first.
- For internal navigation, use `<LLink to="/restaurant/$slug" params={{ slug }} />` instead of `<Link>`. LLink preserves the language prefix automatically.

## Head tags

Every localized route must declare:

- `og:locale` matching the lang
- `hreflang` alternate links for every locale + `x-default`
- A self-referencing `canonical`

See `src/routes/$lang.stad.$city.tsx` for the canonical example.

## SEO landing copy (AI)

For high-traffic landing routes (cities, cuisines), call `getLandingCopy()` from `src/lib/seo-translations.functions.ts`. It returns `{ title, description, intro }` in the target language, cached in the `seo_translations` table so the AI call only happens once per (scope, key, lang).
