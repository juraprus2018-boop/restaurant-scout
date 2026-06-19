# RestaurantGuru kloon — MVP plan

Een publieke restaurantgids met kaart + zoeken, detailpagina's, en een admin dashboard waar je met 1 klik restaurants importeert uit OpenStreetMap. Volledig gratis data via OSM Overpass API. Geen externe betaalde diensten.

Start-regio: **Nederland** (aanpasbaar — je kunt overal ter wereld klikken om te importeren, NL is alleen de standaard kaartweergave). Laat me weten als je liever ergens anders begint.

## Wat je krijgt

### 1. Publieke site
- **Home (`/`)** — grote interactieve kaart (Leaflet + OSM tiles, gratis) met restaurant-pins, zoekbalk (naam/stad), filters (keuken, prijsklasse, sterren), en lijst-weergave naast de kaart.
- **Restaurant detail (`/restaurant/$slug`)** — naam, adres, mini-kaart, keuken, openingstijden, telefoon/website (uit OSM tags), gemiddelde sterren, alle reviews, "claim listing" knop (later).
- **Stad / keuken pagina's** later mogelijk via dezelfde route-structuur.

### 2. Admin dashboard (`/_authenticated/admin`)
- Alleen toegankelijk voor users met `admin` rol.
- Volledig scherm Leaflet kaart. Klik ergens → er verschijnt een cirkel (instelbare straal: 500m / 1km / 2km / 5km).
- Knop **"Preview restaurants in dit gebied"** → roept Overpass API aan, toont gevonden restaurants als pins (oranje = nog niet geïmporteerd, groen = al in DB).
- Knop **"Importeer alles (X nieuwe)"** → 1 klik, slaat alle nieuwe op in DB met OSM ID als unieke key (duplicaten worden overgeslagen).
- Lijst van recent geïmporteerde restaurants met snelle edit/delete.

### 3. Auth
- Alleen admin login (email + wachtwoord via Lovable Cloud).
- Eerste user die zich registreert via `/auth` krijgt automatisch `admin` rol (seed-trigger), daarna handmatig toekennen.
- Geen publieke registratie nodig nu — reviews komen later (je hebt "alleen admin login" gekozen, dus reviews park ik voor v2).

### 4. Reviews — uitgesteld
Je koos "alleen admin login", maar bij scope wel "Reviews & sterren". Die zijn tegenstrijdig: reviews vereisen user accounts. **Voorstel**: v1 zonder publieke reviews (alleen admin kan reviews/ratings toevoegen via dashboard om de site te seeden). V2 = publieke registratie + user reviews. Laat me weten als je dit anders wilt.

## Technische details

**Stack**: TanStack Start (al aanwezig) + Lovable Cloud (Supabase) voor DB/auth + Leaflet voor de kaart + Overpass API voor OSM data.

**Database (Lovable Cloud)**:
- `restaurants` — id, osm_id (unique), name, slug, lat, lng, address, city, country, cuisine[], phone, website, opening_hours, price_range, avg_rating, review_count, raw_osm_tags (jsonb), imported_at
- `reviews` — id, restaurant_id, user_id, rating (1-5), comment, created_at
- `profiles` — id (= auth.users.id), display_name
- `user_roles` — id, user_id, role (enum: admin, user) — aparte tabel, security-definer `has_role()` functie (verplicht patroon, geen rol op profile)

**OSM import (server function)**:
```
[out:json];
node["amenity"~"restaurant|cafe|fast_food|bar|pub|ice_cream|food_court"]
  (around:RADIUS,LAT,LNG);
out body;
```
Server fn `previewArea({lat,lng,radius})` → fetch Overpass → return lijst. `importArea(...)` → upsert in DB met `on conflict (osm_id) do nothing`. Rate limiting respecteren (max 1 req/s naar overpass-api.de, retry op 429).

**Kaart-tiles**: standaard OSM tile server (`tile.openstreetmap.org`) — gratis, met verplichte attributie "© OpenStreetMap contributors" in de hoek.

**Routes**:
```
src/routes/
  __root.tsx              (bestaand)
  index.tsx               (homepage met kaart + lijst)
  restaurant.$slug.tsx    (detailpagina)
  auth.tsx                (login)
  _authenticated/
    route.tsx             (auth gate — managed)
    admin.tsx             (admin dashboard met import-kaart)
```

**Packages**: `leaflet`, `react-leaflet`, `@types/leaflet`.

## Wat ik NIET doe in v1
- Foto upload (OSM heeft geen foto's; later via storage)
- Publieke user registratie & reviews (je koos admin-only)
- Geavanceerde filters zoals "open nu" op basis van opening_hours parsing (complex; v2)
- Meertaligheid
- Mobile app

## Volgorde van implementatie
1. Lovable Cloud aanzetten + schema + RLS + has_role functie
2. Auth pagina + admin rol seed
3. Leaflet installeren + homepage met kaart
4. Overpass server functions (preview + import)
5. Admin dashboard met klik-op-kaart import flow
6. Restaurant detailpagina
7. Filters & zoek op homepage

Klaar om te starten? Of wil je eerst iets aanpassen (regio, reviews wel/niet, andere POI-types dan restaurants/cafés)?