import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useLocale } from "@/lib/i18n/context";

export const Route = createFileRoute("/voorwaarden")({
  head: () => ({
    meta: [
      { title: "Algemene voorwaarden, PlaceResults.com" },
      {
        name: "description",
        content:
          "Algemene voorwaarden voor het gebruik van PlaceResults.com: gebruiksregels, reviews, aansprakelijkheid en intellectueel eigendom.",
      },
      { property: "og:title", content: "Algemene voorwaarden, PlaceResults.com" },
      { property: "og:description", content: "Lees de algemene voorwaarden van PlaceResults.com." },
    ],
    links: [{ rel: "canonical", href: "https://placeresults.com/voorwaarden" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  const locale = useLocale();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader locale={locale} />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <article className="prose prose-slate max-w-none">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink">Algemene voorwaarden</h1>
          <p className="text-sm text-foreground/60">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL")}</p>

          <h2>1. Definities</h2>
          <p>
            "PlaceResults" of "wij" verwijst naar PlaceResults.com. "Gebruiker" of "jij" verwijst naar
            iedereen die de website bezoekt of een account heeft.
          </p>

          <h2>2. Acceptatie</h2>
          <p>
            Door PlaceResults.com te gebruiken ga je akkoord met deze voorwaarden. Gebruik je de website
            niet als je het er niet mee eens bent.
          </p>

          <h2>3. Onze dienst</h2>
          <p>
            PlaceResults is een gratis restaurantgids gebaseerd op open data (OpenStreetMap) en
            bezoekerservaringen. We doen ons best gegevens correct te tonen, maar geven geen garantie
            op juistheid, volledigheid of openingstijden, controleer altijd bij het restaurant zelf.
          </p>

          <h2>4. Account en reviews</h2>
          <ul>
            <li>Je bent zelf verantwoordelijk voor de geheimhouding van je inloggegevens.</li>
            <li>Je plaatst alleen eerlijke, eigen ervaringen. Geen beledigingen, haatzaaiing, spam, valse reviews, of betaalde recensies.</li>
            <li>We mogen reviews verwijderen die in strijd zijn met deze regels of met de wet.</li>
            <li>Door een review te plaatsen geef je ons een wereldwijde, royaltyvrije licentie om deze te tonen op PlaceResults.</li>
          </ul>

          <h2>5. Restauranthouders</h2>
          <p>
            Restaurantinformatie komt uit openbare bronnen. Restauranthouders kunnen verzoeken indienen
            om gegevens te corrigeren via <a href="mailto:hello@placeresults.com">hello@placeresults.com</a>{" "}
            (of rechtstreeks via OpenStreetMap).
          </p>

          <h2>6. Intellectueel eigendom</h2>
          <p>
            Het logo, design en de software zijn eigendom van PlaceResults. Restaurantdata staat onder de{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">
              ODbL-licentie van OpenStreetMap
            </a>
            . Reviews blijven eigendom van de auteur.
          </p>

          <h2>7. Aansprakelijkheid</h2>
          <p>
            PlaceResults is niet aansprakelijk voor schade die voortvloeit uit het gebruik van de
            website, onjuiste gegevens, of het handelen van restaurants. Onze totale aansprakelijkheid
            is, voor zover wettelijk toegestaan, beperkt tot € 100.
          </p>

          <h2>8. Misbruik</h2>
          <p>
            Geautomatiseerd scrapen, overmatig gebruik van de API, of pogingen tot hacken zijn niet
            toegestaan. We mogen toegang blokkeren bij misbruik.
          </p>

          <h2>9. Wijzigingen</h2>
          <p>
            We kunnen deze voorwaarden aanpassen. De meest actuele versie staat altijd op deze pagina.
            Bij grote wijzigingen brengen we gebruikers op de hoogte.
          </p>

          <h2>10. Toepasselijk recht</h2>
          <p>
            Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan
            de bevoegde rechter in Nederland.
          </p>

          <h2>11. Contact</h2>
          <p>
            Vragen? Mail naar <a href="mailto:hello@placeresults.com">hello@placeresults.com</a>.
          </p>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
