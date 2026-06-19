// Supported locales: EU + Balkan (20 languages)
// `code` is the URL prefix (also html lang). `name` is what we show in the switcher.

export type LocaleCode =
  | "nl" | "en" | "de" | "fr" | "es" | "it" | "pt" | "pl" | "sv" | "da"
  | "fi" | "el" | "cs" | "hu" | "ro" | "bg" | "sk" | "sl" | "hr" | "sr";

export const DEFAULT_LOCALE: LocaleCode = "nl";

export interface Locale {
  code: LocaleCode;
  name: string;          // native name
  englishName: string;
  flag: string;          // emoji for the switcher
  country: string;       // primary ISO country for hreflang region hint
}

export const LOCALES: Locale[] = [
  { code: "nl", name: "Nederlands", englishName: "Dutch",      flag: "🇳🇱", country: "NL" },
  { code: "en", name: "English",    englishName: "English",    flag: "🇬🇧", country: "GB" },
  { code: "de", name: "Deutsch",    englishName: "German",     flag: "🇩🇪", country: "DE" },
  { code: "fr", name: "Français",   englishName: "French",     flag: "🇫🇷", country: "FR" },
  { code: "es", name: "Español",    englishName: "Spanish",    flag: "🇪🇸", country: "ES" },
  { code: "it", name: "Italiano",   englishName: "Italian",    flag: "🇮🇹", country: "IT" },
  { code: "pt", name: "Português",  englishName: "Portuguese", flag: "🇵🇹", country: "PT" },
  { code: "pl", name: "Polski",     englishName: "Polish",     flag: "🇵🇱", country: "PL" },
  { code: "sv", name: "Svenska",    englishName: "Swedish",    flag: "🇸🇪", country: "SE" },
  { code: "da", name: "Dansk",      englishName: "Danish",     flag: "🇩🇰", country: "DK" },
  { code: "fi", name: "Suomi",      englishName: "Finnish",    flag: "🇫🇮", country: "FI" },
  { code: "el", name: "Ελληνικά",   englishName: "Greek",      flag: "🇬🇷", country: "GR" },
  { code: "cs", name: "Čeština",    englishName: "Czech",      flag: "🇨🇿", country: "CZ" },
  { code: "hu", name: "Magyar",     englishName: "Hungarian",  flag: "🇭🇺", country: "HU" },
  { code: "ro", name: "Română",     englishName: "Romanian",   flag: "🇷🇴", country: "RO" },
  { code: "bg", name: "Български",  englishName: "Bulgarian",  flag: "🇧🇬", country: "BG" },
  { code: "sk", name: "Slovenčina", englishName: "Slovak",     flag: "🇸🇰", country: "SK" },
  { code: "sl", name: "Slovenščina",englishName: "Slovenian",  flag: "🇸🇮", country: "SI" },
  { code: "hr", name: "Hrvatski",   englishName: "Croatian",   flag: "🇭🇷", country: "HR" },
  { code: "sr", name: "Srpski",     englishName: "Serbian",    flag: "🇷🇸", country: "RS" },
];

export const LOCALE_CODES = LOCALES.map((l) => l.code);

export function isLocale(s: string | undefined): s is LocaleCode {
  return !!s && (LOCALE_CODES as readonly string[]).includes(s);
}

export function getLocale(code: string): Locale {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}
