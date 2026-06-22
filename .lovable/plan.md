# SEO Uitbreiding Plan

Groot plan, ik splits het in 3 fases zodat je per fase kan reviewen. Laat me weten welke fase(s) je nu wil, of "alles" voor de hele lijst.

## Fase 1 — Quick wins op bestaande pagina's (1 ronde werk)

**1.1 FAQ-secties op stad- en keuken-pagina's**
- Nieuwe component `src/components/seo/FaqSection.tsx` met accordion (shadcn) + FAQPage JSON-LD.
- 4-6 vragen per pagina, AI-gegenereerd via bestaande `seo-translations.functions.ts` (uitbreiden met `getLandingFaq()`), gecached in `seo_translations` tabel (nieuwe scope `faq`).
- Toegevoegd aan `stad.$city.tsx`, `$lang.stad.$city.tsx`, `keuken.$cuisine.tsx`, `$lang.keuken.$cuisine.tsx`.

**1.2 Schema uitbreiding**
- `BreadcrumbList` JSON-LD op stad-, keuken-, restaurant- en buurt-pagina's (helper in `src/lib/seo/jsonld.ts`).
- `AggregateRating` op stad-/keuken-pagina's (gemiddeld van getoonde restaurants).
- `FAQPage` (komt mee met 1.1).

**1.3 Internal linking op restaurant-detail**
- In `restaurant.$slug.tsx`: linkblokje naar stad-pagina, keuken-pagina('s), en 3-5 nearby restaurants (component bestaat al: `NearbyRestaurants`, alleen tekst-links toevoegen).

**1.4 Image alt-teksten**
- Alle `<img>` in restaurant-kaarten/detail: alt = `{naam} — {keuken} restaurant in {stad}`.

**1.5 Lazy-load Leaflet**
- `MapView` via `React.lazy` + Suspense fallback, alleen mount bij scroll-in-view (IntersectionObserver) op homepage en stad-pagina.

## Fase 2 — Nieuwe pagina-types (longtail content)

**2.1 Stad × Keuken combo-pagina's**
- Nieuwe route `src/routes/stad.$city.keuken.$cuisine.tsx` + `$lang.stad.$city.keuken.$cuisine.tsx`.
- Loader: restaurants gefilterd op stad + keuken. Custom title/description/intro via AI gateway (nieuwe scope `city_cuisine`).
- Toegevoegd aan sitemap: top 50 steden × top 20 keukens (alleen combo's met ≥1 restaurant) = ~1000 URLs.

**2.2 Buurt-pagina's**
- Extra kolom `neighborhood` op restaurants (afleiden uit `raw_osm_tags->>'addr:suburb'` of `addr:neighbourhood`); migration + backfill query.
- Route `src/routes/stad.$city.buurt.$neighborhood.tsx`. Sitemap aanvulling.

**2.3 "Open op zondag/maandagavond" filter-pagina's**
- Routes `src/routes/stad.$city.open.$day.tsx` (zondag, maandag, ...). Parsed uit `opening_hours` met bestaande `opening-hours-status.ts`.
- Server-side gerenderd zodat Google ze indexeert.

## Fase 3 — Editorial content & growth

**3.1 "Beste restaurants in [stad]" lijstartikelen**
- Nieuwe tabel `articles` (slug, title, lang, body_md, city, cuisine, published_at). RLS public read.
- Admin-knop: "Genereer artikel" → AI gateway met top-10 restaurants als context. Markdown body.
- Route `src/routes/gids.$slug.tsx` met Article JSON-LD + author + datePublished.

**3.2 Review-stimulering**
- Na bezoek aan restaurant-detail: dismissable toast/CTA "Ben je hier geweest? Schrijf een review".
- (E-mailreminder = aparte beslissing, vereist auth+opt-in; nu skippen tenzij je wil.)

**3.3 Google Search Console**
- Geen code, alleen instructie: ik kan via de GSC connector je site verifiëren (META tag in `__root.tsx`) en je sitemaps indienen. Zeg het woord.

## Wat ik nu wil weten

1. Welke fase(s) doorvoeren? (Aanrader: **Fase 1 + 2.1** nu, rest later.)
2. Fase 2.1 genereert ~1000 AI-teksten — eenmalig ~€ aan Lovable AI credits. Akkoord?
3. GSC site-verificatie + sitemap-indiening nu meedoen?
