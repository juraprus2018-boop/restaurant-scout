import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CookieSettingsButton } from "@/components/CookieBanner";
import { useLocale } from "@/lib/i18n/context";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookiebeleid, PlaceResults.com" },
      {
        name: "description",
        content:
          "Welke cookies PlaceResults.com gebruikt, waarom, en hoe je jouw voorkeuren wijzigt.",
      },
      { property: "og:title", content: "Cookiebeleid, PlaceResults.com" },
      { property: "og:description", content: "Cookies & tracking-overzicht van PlaceResults.com." },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  const locale = useLocale();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader locale={locale} />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <article className="prose prose-slate max-w-none">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink">Cookiebeleid</h1>
          <p className="text-sm text-foreground/60">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL")}</p>

          <h2>Wat zijn cookies?</h2>
          <p>
            Cookies zijn kleine tekstbestanden die in je browser worden opgeslagen. PlaceResults gebruikt
            ook vergelijkbare technieken zoals <em>localStorage</em>.
          </p>

          <h2>Welke cookies gebruiken wij?</h2>

          <h3>1. Noodzakelijk (altijd actief)</h3>
          <table>
            <thead>
              <tr><th>Naam</th><th>Doel</th><th>Bewaartijd</th></tr>
            </thead>
            <tbody>
              <tr><td>pr_cookie_consent_v1</td><td>Onthoudt je cookievoorkeuren</td><td>12 maanden</td></tr>
              <tr><td>sb-*-auth-token</td><td>Houdt je ingelogd (alleen bij accountgebruik)</td><td>Sessie</td></tr>
              <tr><td>pr_favorites</td><td>Slaat je favoriete restaurants lokaal op</td><td>Permanent (tot je het wist)</td></tr>
            </tbody>
          </table>

          <h3>2. Analytisch (alleen met toestemming)</h3>
          <p>
            Momenteel plaatsen we geen analytische cookies. Als we dat in de toekomst doen (bv. Plausible
            of een vergelijkbare privacyvriendelijke dienst), gebeurt dat alleen na jouw expliciete
            toestemming.
          </p>

          <h3>3. Marketing</h3>
          <p>We plaatsen <strong>geen</strong> marketing- of trackingcookies van derden.</p>

          <h2>Kaartdata (OpenStreetMap)</h2>
          <p>
            Wanneer je de kaart opent worden kaarttegels geladen vanaf servers van OpenStreetMap. Daarbij
            wordt je IP-adres tijdelijk verwerkt door OSM volgens hun{" "}
            <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener">
              privacybeleid
            </a>.
          </p>

          <h2>Je voorkeuren wijzigen</h2>
          <p>
            Je kunt je keuze op elk moment aanpassen:
          </p>
          <p>
            <CookieSettingsButton
              label="Cookievoorkeuren openen"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            />
          </p>
          <p>
            Je kunt cookies ook beheren of verwijderen via je browserinstellingen.
          </p>

          <h2>Meer informatie</h2>
          <p>
            Zie ons <Link to="/privacy" className="text-primary underline">privacybeleid</Link> voor
            algemene informatie over gegevensverwerking.
          </p>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
