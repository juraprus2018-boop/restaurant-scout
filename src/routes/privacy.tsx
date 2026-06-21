import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useLocale } from "@/lib/i18n/context";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacybeleid, PlaceResults.com" },
      {
        name: "description",
        content:
          "Hoe PlaceResults.com persoonsgegevens verwerkt: doelen, grondslagen, bewaartermijnen en jouw AVG-rechten.",
      },
      { property: "og:title", content: "Privacybeleid, PlaceResults.com" },
      { property: "og:description", content: "AVG-conform privacybeleid van PlaceResults.com." },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const locale = useLocale();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader locale={locale} />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <article className="prose prose-slate max-w-none">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink">Privacybeleid</h1>
          <p className="text-sm text-foreground/60">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL")}</p>

          <h2>1. Wie zijn wij?</h2>
          <p>
            PlaceResults.com ("wij", "ons") is een onafhankelijke restaurantgids gebouwd op open data
            (OpenStreetMap). Voor vragen over privacy kun je contact opnemen via{" "}
            <a href="mailto:privacy@placeresults.com">privacy@placeresults.com</a>.
          </p>

          <h2>2. Welke gegevens verwerken wij?</h2>
          <ul>
            <li><strong>Accountgegevens</strong> (optioneel): e-mailadres en wachtwoord (gehasht) wanneer je een account aanmaakt om reviews te plaatsen.</li>
            <li><strong>Reviews</strong>: tekst en sterren die je vrijwillig achterlaat.</li>
            <li><strong>Favorieten</strong>: lokaal opgeslagen in je browser (localStorage), niet op onze servers.</li>
            <li><strong>Technische gegevens</strong>: IP-adres en user-agent, alleen voor beveiliging en foutopsporing.</li>
            <li><strong>Statistieken</strong> (alleen met toestemming): geanonimiseerde paginabezoeken om de site te verbeteren.</li>
          </ul>

          <h2>3. Grondslagen (AVG art. 6)</h2>
          <ul>
            <li><em>Toestemming</em>, voor analytics en optionele cookies.</li>
            <li><em>Uitvoering overeenkomst</em>, voor accountbeheer en het tonen van jouw reviews.</li>
            <li><em>Gerechtvaardigd belang</em>, voor beveiliging en het tegengaan van misbruik.</li>
          </ul>

          <h2>4. Bewaartermijnen</h2>
          <p>
            Accountgegevens bewaren we zolang je account actief is. Reviews blijven gekoppeld aan je account
            tot je ze (of je account) verwijdert. Technische logs worden binnen 30 dagen geanonimiseerd.
          </p>

          <h2>5. Delen met derden</h2>
          <p>
            We verkopen <strong>geen</strong> gegevens. We werken met de volgende verwerkers:
          </p>
          <ul>
            <li><strong>Lovable Cloud / Supabase</strong>, database en authenticatie (EU-regio).</li>
            <li><strong>Cloudflare</strong>, hosting en DDoS-bescherming.</li>
            <li><strong>OpenStreetMap</strong>, kaartdata (tegels worden geladen vanaf OSM-servers).</li>
          </ul>

          <h2>6. Cookies</h2>
          <p>
            Wij gebruiken alleen noodzakelijke cookies om de site te laten werken. Analytische cookies
            worden alleen geplaatst na jouw toestemming via de cookiebanner. Zie ons{" "}
            <Link to="/cookies" className="text-primary underline">cookiebeleid</Link> voor details.
          </p>

          <h2>7. Jouw rechten</h2>
          <p>Op grond van de AVG heb je het recht om:</p>
          <ul>
            <li>je gegevens in te zien, te corrigeren of te verwijderen;</li>
            <li>verwerking te beperken of bezwaar te maken;</li>
            <li>je gegevens over te dragen (dataportabiliteit);</li>
            <li>je toestemming te allen tijde in te trekken;</li>
            <li>een klacht in te dienen bij de Autoriteit Persoonsgegevens.</li>
          </ul>
          <p>
            Stuur een verzoek naar <a href="mailto:privacy@placeresults.com">privacy@placeresults.com</a>.
            Wij reageren binnen 30 dagen.
          </p>

          <h2>8. Beveiliging</h2>
          <p>
            Verbindingen verlopen via HTTPS, wachtwoorden worden gehasht opgeslagen en de database is
            beveiligd met Row-Level Security.
          </p>

          <h2>9. Wijzigingen</h2>
          <p>
            We kunnen dit beleid aanpassen. Bij grote wijzigingen melden we dat op de homepage of via
            e-mail (als je een account hebt).
          </p>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
