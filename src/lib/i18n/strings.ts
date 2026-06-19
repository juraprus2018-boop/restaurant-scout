// Static UI strings for the whole app.
// Keys are stable identifiers. Untranslated locales fall back to English.
// All 20 supported locales are present below — fill in real translations as we go.
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

const pt: Dict = {
  "nav.restaurants": "Restaurantes", "nav.map": "Mapa", "nav.topRated": "Mais bem avaliados", "nav.login": "Entrar",
  "footer.tagline": "O guia honesto de restaurantes, cafés e bares — baseado em dados abertos e avaliações reais.",
  "footer.explore": "Explorar", "footer.about": "Sobre", "footer.dataVia": "Dados via",
  "city.breadcrumb.home": "Início", "city.breadcrumb.city": "Cidade",
  "city.heading": "Restaurantes em {city}",
  "city.subheading": "Descubra {count} restaurantes, cafés e bares em {city}. Ordenados por avaliação.",
  "city.notFound": "Cidade não encontrada", "city.backHome": "Voltar ao início",
  "city.error": "Algo correu mal", "city.retry": "Tentar de novo",
  "city.reviewsLabel": "avaliações", "city.addressUnknown": "Endereço desconhecido",
  "lang.switch": "Idioma",
};

const pl: Dict = {
  "nav.restaurants": "Restauracje", "nav.map": "Mapa", "nav.topRated": "Najwyżej oceniane", "nav.login": "Zaloguj się",
  "footer.tagline": "Uczciwy przewodnik po restauracjach, kawiarniach i barach — oparty na otwartych danych i prawdziwych opiniach.",
  "footer.explore": "Odkrywaj", "footer.about": "O nas", "footer.dataVia": "Dane przez",
  "city.breadcrumb.home": "Strona główna", "city.breadcrumb.city": "Miasto",
  "city.heading": "Restauracje w {city}",
  "city.subheading": "Odkryj {count} restauracji, kawiarni i barów w {city}. Sortowane według ocen.",
  "city.notFound": "Nie znaleziono miasta", "city.backHome": "Powrót do strony głównej",
  "city.error": "Coś poszło nie tak", "city.retry": "Spróbuj ponownie",
  "city.reviewsLabel": "opinii", "city.addressUnknown": "Adres nieznany",
  "lang.switch": "Język",
};

const sv: Dict = {
  "nav.restaurants": "Restauranger", "nav.map": "Karta", "nav.topRated": "Högst betyg", "nav.login": "Logga in",
  "footer.tagline": "Den ärliga guiden till restauranger, kaféer och barer — byggd på öppna data och riktiga recensioner.",
  "footer.explore": "Utforska", "footer.about": "Om", "footer.dataVia": "Data via",
  "city.breadcrumb.home": "Hem", "city.breadcrumb.city": "Stad",
  "city.heading": "Restauranger i {city}",
  "city.subheading": "Upptäck {count} restauranger, kaféer och barer i {city}. Sorterat efter betyg.",
  "city.notFound": "Staden hittades inte", "city.backHome": "Tillbaka till start",
  "city.error": "Något gick fel", "city.retry": "Försök igen",
  "city.reviewsLabel": "recensioner", "city.addressUnknown": "Adress okänd",
  "lang.switch": "Språk",
};

const da: Dict = {
  "nav.restaurants": "Restauranter", "nav.map": "Kort", "nav.topRated": "Højest vurderet", "nav.login": "Log ind",
  "footer.tagline": "Den ærlige guide til restauranter, caféer og barer — bygget på åbne data og rigtige anmeldelser.",
  "footer.explore": "Udforsk", "footer.about": "Om", "footer.dataVia": "Data via",
  "city.breadcrumb.home": "Hjem", "city.breadcrumb.city": "By",
  "city.heading": "Restauranter i {city}",
  "city.subheading": "Opdag {count} restauranter, caféer og barer i {city}. Sorteret efter vurdering.",
  "city.notFound": "By ikke fundet", "city.backHome": "Tilbage til forsiden",
  "city.error": "Noget gik galt", "city.retry": "Prøv igen",
  "city.reviewsLabel": "anmeldelser", "city.addressUnknown": "Adresse ukendt",
  "lang.switch": "Sprog",
};

const fi: Dict = {
  "nav.restaurants": "Ravintolat", "nav.map": "Kartta", "nav.topRated": "Parhaiten arvioidut", "nav.login": "Kirjaudu",
  "footer.tagline": "Rehellinen opas ravintoloihin, kahviloihin ja baareihin — avoimeen dataan ja aitoihin arvosteluihin perustuva.",
  "footer.explore": "Tutki", "footer.about": "Tietoja", "footer.dataVia": "Tiedot",
  "city.breadcrumb.home": "Etusivu", "city.breadcrumb.city": "Kaupunki",
  "city.heading": "Ravintolat kaupungissa {city}",
  "city.subheading": "Löydä {count} ravintolaa, kahvilaa ja baaria kaupungista {city}. Lajiteltu arvostelun mukaan.",
  "city.notFound": "Kaupunkia ei löytynyt", "city.backHome": "Takaisin etusivulle",
  "city.error": "Jokin meni pieleen", "city.retry": "Yritä uudelleen",
  "city.reviewsLabel": "arvostelua", "city.addressUnknown": "Osoite tuntematon",
  "lang.switch": "Kieli",
};

const el: Dict = {
  "nav.restaurants": "Εστιατόρια", "nav.map": "Χάρτης", "nav.topRated": "Κορυφαία", "nav.login": "Σύνδεση",
  "footer.tagline": "Ο ειλικρινής οδηγός για εστιατόρια, καφέ και μπαρ — βασισμένος σε ανοιχτά δεδομένα και πραγματικές κριτικές.",
  "footer.explore": "Εξερεύνηση", "footer.about": "Σχετικά", "footer.dataVia": "Δεδομένα μέσω",
  "city.breadcrumb.home": "Αρχική", "city.breadcrumb.city": "Πόλη",
  "city.heading": "Εστιατόρια στην {city}",
  "city.subheading": "Ανακαλύψτε {count} εστιατόρια, καφέ και μπαρ στην {city}. Ταξινομημένα κατά αξιολόγηση.",
  "city.notFound": "Η πόλη δεν βρέθηκε", "city.backHome": "Επιστροφή στην αρχική",
  "city.error": "Κάτι πήγε στραβά", "city.retry": "Δοκιμάστε ξανά",
  "city.reviewsLabel": "κριτικές", "city.addressUnknown": "Άγνωστη διεύθυνση",
  "lang.switch": "Γλώσσα",
};

const cs: Dict = {
  "nav.restaurants": "Restaurace", "nav.map": "Mapa", "nav.topRated": "Nejlépe hodnocené", "nav.login": "Přihlásit",
  "footer.tagline": "Poctivý průvodce po restauracích, kavárnách a barech — postavený na otevřených datech a skutečných recenzích.",
  "footer.explore": "Prozkoumat", "footer.about": "O nás", "footer.dataVia": "Data přes",
  "city.breadcrumb.home": "Domů", "city.breadcrumb.city": "Město",
  "city.heading": "Restaurace v {city}",
  "city.subheading": "Objevte {count} restaurací, kaváren a barů v {city}. Seřazeno podle hodnocení.",
  "city.notFound": "Město nenalezeno", "city.backHome": "Zpět domů",
  "city.error": "Něco se pokazilo", "city.retry": "Zkusit znovu",
  "city.reviewsLabel": "recenzí", "city.addressUnknown": "Adresa neznámá",
  "lang.switch": "Jazyk",
};

const hu: Dict = {
  "nav.restaurants": "Éttermek", "nav.map": "Térkép", "nav.topRated": "Legjobbra értékelt", "nav.login": "Bejelentkezés",
  "footer.tagline": "Az őszinte útmutató éttermekhez, kávézókhoz és bárokhoz — nyílt adatokra és valódi értékelésekre építve.",
  "footer.explore": "Felfedezés", "footer.about": "Rólunk", "footer.dataVia": "Adatok",
  "city.breadcrumb.home": "Főoldal", "city.breadcrumb.city": "Város",
  "city.heading": "Éttermek itt: {city}",
  "city.subheading": "Fedezzen fel {count} éttermet, kávézót és bárt itt: {city}. Értékelés szerint rendezve.",
  "city.notFound": "A város nem található", "city.backHome": "Vissza a főoldalra",
  "city.error": "Valami elromlott", "city.retry": "Próbálja újra",
  "city.reviewsLabel": "értékelés", "city.addressUnknown": "Cím ismeretlen",
  "lang.switch": "Nyelv",
};

const ro: Dict = {
  "nav.restaurants": "Restaurante", "nav.map": "Hartă", "nav.topRated": "Cele mai bine notate", "nav.login": "Conectare",
  "footer.tagline": "Ghidul onest pentru restaurante, cafenele și baruri — construit pe date deschise și recenzii reale.",
  "footer.explore": "Explorează", "footer.about": "Despre", "footer.dataVia": "Date via",
  "city.breadcrumb.home": "Acasă", "city.breadcrumb.city": "Oraș",
  "city.heading": "Restaurante în {city}",
  "city.subheading": "Descoperă {count} restaurante, cafenele și baruri în {city}. Sortate după evaluare.",
  "city.notFound": "Oraș negăsit", "city.backHome": "Înapoi acasă",
  "city.error": "Ceva nu a mers bine", "city.retry": "Încercați din nou",
  "city.reviewsLabel": "recenzii", "city.addressUnknown": "Adresă necunoscută",
  "lang.switch": "Limbă",
};

const bg: Dict = {
  "nav.restaurants": "Ресторанти", "nav.map": "Карта", "nav.topRated": "Най-високо оценени", "nav.login": "Вход",
  "footer.tagline": "Честният справочник за ресторанти, кафенета и барове — изграден върху отворени данни и реални отзиви.",
  "footer.explore": "Разгледай", "footer.about": "За нас", "footer.dataVia": "Данни чрез",
  "city.breadcrumb.home": "Начало", "city.breadcrumb.city": "Град",
  "city.heading": "Ресторанти в {city}",
  "city.subheading": "Открийте {count} ресторанта, кафенета и барове в {city}. Подредени по оценка.",
  "city.notFound": "Градът не е намерен", "city.backHome": "Обратно към началото",
  "city.error": "Нещо се обърка", "city.retry": "Опитайте отново",
  "city.reviewsLabel": "отзива", "city.addressUnknown": "Адресът е неизвестен",
  "lang.switch": "Език",
};

const sk: Dict = {
  "nav.restaurants": "Reštaurácie", "nav.map": "Mapa", "nav.topRated": "Najlepšie hodnotené", "nav.login": "Prihlásiť sa",
  "footer.tagline": "Úprimný sprievodca po reštauráciách, kaviarňach a baroch — postavený na otvorených dátach a skutočných recenziách.",
  "footer.explore": "Objavovať", "footer.about": "O nás", "footer.dataVia": "Dáta cez",
  "city.breadcrumb.home": "Domov", "city.breadcrumb.city": "Mesto",
  "city.heading": "Reštaurácie v {city}",
  "city.subheading": "Objavte {count} reštaurácií, kaviarní a barov v {city}. Zoradené podľa hodnotenia.",
  "city.notFound": "Mesto nenájdené", "city.backHome": "Späť domov",
  "city.error": "Niečo sa pokazilo", "city.retry": "Skúsiť znova",
  "city.reviewsLabel": "recenzií", "city.addressUnknown": "Adresa neznáma",
  "lang.switch": "Jazyk",
};

const sl: Dict = {
  "nav.restaurants": "Restavracije", "nav.map": "Zemljevid", "nav.topRated": "Najbolje ocenjene", "nav.login": "Prijava",
  "footer.tagline": "Iskreni vodnik po restavracijah, kavarnah in barih — zgrajen na odprtih podatkih in pravih ocenah.",
  "footer.explore": "Raziskuj", "footer.about": "O nas", "footer.dataVia": "Podatki prek",
  "city.breadcrumb.home": "Domov", "city.breadcrumb.city": "Mesto",
  "city.heading": "Restavracije v {city}",
  "city.subheading": "Odkrijte {count} restavracij, kavarn in barov v {city}. Razvrščeno po oceni.",
  "city.notFound": "Mesto ni najdeno", "city.backHome": "Nazaj domov",
  "city.error": "Nekaj je šlo narobe", "city.retry": "Poskusite znova",
  "city.reviewsLabel": "ocen", "city.addressUnknown": "Naslov ni znan",
  "lang.switch": "Jezik",
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

const sr: Dict = {
  "nav.restaurants": "Ресторани", "nav.map": "Мапа", "nav.topRated": "Најбоље оцењени", "nav.login": "Пријава",
  "footer.tagline": "Поштен водич кроз ресторане, кафиће и барове — заснован на отвореним подацима и правим рецензијама.",
  "footer.explore": "Истражи", "footer.about": "О нама", "footer.dataVia": "Подаци преко",
  "city.breadcrumb.home": "Почетна", "city.breadcrumb.city": "Град",
  "city.heading": "Ресторани у {city}",
  "city.subheading": "Откријте {count} ресторана, кафића и барова у {city}. Сортирано по оцени.",
  "city.notFound": "Град није пронађен", "city.backHome": "Назад на почетну",
  "city.error": "Нешто је пошло по злу", "city.retry": "Покушај поново",
  "city.reviewsLabel": "рецензија", "city.addressUnknown": "Адреса непозната",
  "lang.switch": "Језик",
};

const DICTS: Record<LocaleCode, Dict> = {
  en, nl, de, fr, es, it, pt, pl, sv, da, fi, el, cs, hu, ro, bg, sk, sl, hr, sr,
};

export function t(lang: LocaleCode, key: StringKey, vars?: Record<string, string | number>): string {
  const raw = DICTS[lang]?.[key] ?? DICTS["en"][key] ?? en[key];
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
