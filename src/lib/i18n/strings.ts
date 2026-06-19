// Static UI strings. Keys are stable identifiers. Untranslated locales fall back to English.
import type { LocaleCode } from "./locales";

export type StringKey =
  | "nav.restaurants"
  | "nav.map"
  | "nav.topRated"
  | "nav.login"
  | "footer.tagline"
  | "footer.explore"
  | "footer.about"
  | "footer.dataVia"
  | "city.breadcrumb.home"
  | "city.breadcrumb.city"
  | "city.heading"           // "Restaurants in {city}"
  | "city.subheading"        // "Discover N restaurants in {city}…"
  | "city.notFound"
  | "city.backHome"
  | "city.error"
  | "city.retry"
  | "city.reviewsLabel"
  | "city.addressUnknown"
  | "lang.switch";

type Dict = Partial<Record<StringKey, string>>;

const en: Required<Pick<Dict, StringKey>> = {
  "nav.restaurants": "Restaurants",
  "nav.map": "Map",
  "nav.topRated": "Top rated",
  "nav.login": "Sign in",
  "footer.tagline": "The honest guide to restaurants, cafés and bars — built on open data and real reviews.",
  "footer.explore": "Explore",
  "footer.about": "About",
  "footer.dataVia": "Data via",
  "city.breadcrumb.home": "Home",
  "city.breadcrumb.city": "City",
  "city.heading": "Restaurants in {city}",
  "city.subheading": "Discover {count} restaurants, cafés and bars in {city}. Sorted by rating — find what locals love.",
  "city.notFound": "City not found",
  "city.backHome": "Back to home",
  "city.error": "Something went wrong",
  "city.retry": "Try again",
  "city.reviewsLabel": "reviews",
  "city.addressUnknown": "Address unknown",
  "lang.switch": "Language",
};

const nl: Dict = {
  "nav.restaurants": "Restaurants", "nav.map": "Kaart", "nav.topRated": "Top beoordeeld", "nav.login": "Inloggen",
  "footer.tagline": "De eerlijke gids voor restaurants, cafés en bars — gebouwd op open data en echte reviews.",
  "footer.explore": "Verkennen", "footer.about": "Over", "footer.dataVia": "Data via",
  "city.breadcrumb.home": "Home", "city.breadcrumb.city": "Stad",
  "city.heading": "Restaurants in {city}",
  "city.subheading": "Ontdek {count} restaurants, cafés en bars in {city}. Gesorteerd op beoordeling — vind de favorieten van bezoekers.",
  "city.notFound": "Stad niet gevonden", "city.backHome": "Terug naar home",
  "city.error": "Er ging iets mis", "city.retry": "Opnieuw proberen",
  "city.reviewsLabel": "reviews", "city.addressUnknown": "Adres onbekend",
  "lang.switch": "Taal",
};

const de: Dict = {
  "nav.restaurants": "Restaurants", "nav.map": "Karte", "nav.topRated": "Top bewertet", "nav.login": "Anmelden",
  "footer.tagline": "Der ehrliche Guide für Restaurants, Cafés und Bars — auf offenen Daten und echten Bewertungen.",
  "footer.explore": "Entdecken", "footer.about": "Über uns", "footer.dataVia": "Daten via",
  "city.breadcrumb.home": "Start", "city.breadcrumb.city": "Stadt",
  "city.heading": "Restaurants in {city}",
  "city.subheading": "Entdecken Sie {count} Restaurants, Cafés und Bars in {city}. Sortiert nach Bewertung.",
  "city.notFound": "Stadt nicht gefunden", "city.backHome": "Zurück zur Startseite",
  "city.error": "Etwas ist schiefgelaufen", "city.retry": "Erneut versuchen",
  "city.reviewsLabel": "Bewertungen", "city.addressUnknown": "Adresse unbekannt",
  "lang.switch": "Sprache",
};

const fr: Dict = {
  "nav.restaurants": "Restaurants", "nav.map": "Carte", "nav.topRated": "Mieux notés", "nav.login": "Connexion",
  "footer.tagline": "Le guide honnête des restaurants, cafés et bars — basé sur des données ouvertes et de vrais avis.",
  "footer.explore": "Explorer", "footer.about": "À propos", "footer.dataVia": "Données via",
  "city.breadcrumb.home": "Accueil", "city.breadcrumb.city": "Ville",
  "city.heading": "Restaurants à {city}",
  "city.subheading": "Découvrez {count} restaurants, cafés et bars à {city}. Triés par note.",
  "city.notFound": "Ville introuvable", "city.backHome": "Retour à l'accueil",
  "city.error": "Une erreur est survenue", "city.retry": "Réessayer",
  "city.reviewsLabel": "avis", "city.addressUnknown": "Adresse inconnue",
  "lang.switch": "Langue",
};

const es: Dict = {
  "nav.restaurants": "Restaurantes", "nav.map": "Mapa", "nav.topRated": "Mejor valorados", "nav.login": "Iniciar sesión",
  "footer.tagline": "La guía honesta de restaurantes, cafés y bares — basada en datos abiertos y reseñas reales.",
  "footer.explore": "Explorar", "footer.about": "Acerca de", "footer.dataVia": "Datos vía",
  "city.breadcrumb.home": "Inicio", "city.breadcrumb.city": "Ciudad",
  "city.heading": "Restaurantes en {city}",
  "city.subheading": "Descubre {count} restaurantes, cafés y bares en {city}. Ordenados por valoración.",
  "city.notFound": "Ciudad no encontrada", "city.backHome": "Volver al inicio",
  "city.error": "Algo salió mal", "city.retry": "Intentar de nuevo",
  "city.reviewsLabel": "reseñas", "city.addressUnknown": "Dirección desconocida",
  "lang.switch": "Idioma",
};

const it: Dict = {
  "nav.restaurants": "Ristoranti", "nav.map": "Mappa", "nav.topRated": "Più votati", "nav.login": "Accedi",
  "footer.tagline": "La guida onesta a ristoranti, caffè e bar — basata su dati aperti e recensioni reali.",
  "footer.explore": "Esplora", "footer.about": "Chi siamo", "footer.dataVia": "Dati via",
  "city.breadcrumb.home": "Home", "city.breadcrumb.city": "Città",
  "city.heading": "Ristoranti a {city}",
  "city.subheading": "Scopri {count} ristoranti, caffè e bar a {city}. Ordinati per valutazione.",
  "city.notFound": "Città non trovata", "city.backHome": "Torna alla home",
  "city.error": "Qualcosa è andato storto", "city.retry": "Riprova",
  "city.reviewsLabel": "recensioni", "city.addressUnknown": "Indirizzo sconosciuto",
  "lang.switch": "Lingua",
};

const hr: Dict = {
  "nav.restaurants": "Restorani", "nav.map": "Karta", "nav.topRated": "Najbolje ocijenjeni", "nav.login": "Prijava",
  "footer.tagline": "Pošten vodič kroz restorane, kafiće i barove — temeljen na otvorenim podacima i pravim recenzijama.",
  "footer.explore": "Istraži", "footer.about": "O nama", "footer.dataVia": "Podaci preko",
  "city.breadcrumb.home": "Početna", "city.breadcrumb.city": "Grad",
  "city.heading": "Restorani u {city}",
  "city.subheading": "Otkrijte {count} restorana, kafića i barova u {city}. Sortirano po ocjeni.",
  "city.notFound": "Grad nije pronađen", "city.backHome": "Natrag na početnu",
  "city.error": "Nešto je pošlo po krivu", "city.retry": "Pokušaj ponovno",
  "city.reviewsLabel": "recenzija", "city.addressUnknown": "Adresa nepoznata",
  "lang.switch": "Jezik",
};

const DICTS: Record<string, Dict> = { en, nl, de, fr, es, it, hr };

export function t(lang: LocaleCode, key: StringKey, vars?: Record<string, string | number>): string {
  const raw = DICTS[lang]?.[key] ?? DICTS["en"][key] ?? en[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
