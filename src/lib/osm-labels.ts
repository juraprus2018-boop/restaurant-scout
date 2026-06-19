// Dutch labels & translations for OSM tag values

export const AMENITY_NL: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  fast_food: "Fastfood",
  bar: "Bar",
  pub: "Pub",
  ice_cream: "IJssalon",
  food_court: "Food court",
  bistro: "Bistro",
};

export const CUISINE_NL: Record<string, string> = {
  burger: "Hamburgers",
  pizza: "Pizza",
  italian: "Italiaans",
  chinese: "Chinees",
  japanese: "Japans",
  sushi: "Sushi",
  thai: "Thais",
  indian: "Indiaas",
  french: "Frans",
  spanish: "Spaans",
  greek: "Grieks",
  turkish: "Turks",
  mexican: "Mexicaans",
  american: "Amerikaans",
  vietnamese: "Vietnamees",
  korean: "Koreaans",
  mediterranean: "Mediterraan",
  vegetarian: "Vegetarisch",
  vegan: "Veganistisch",
  seafood: "Visgerechten",
  steak_house: "Steakhouse",
  bbq: "BBQ",
  sandwich: "Broodjes",
  coffee_shop: "Koffiebar",
  ice_cream: "IJs",
  regional: "Regionaal",
  dutch: "Nederlands",
  international: "Internationaal",
  asian: "Aziatisch",
  kebab: "Kebab",
  noodle: "Noedels",
  ramen: "Ramen",
  tapas: "Tapas",
  breakfast: "Ontbijt",
  brunch: "Brunch",
};

export const YESNO_NL = (v?: string) => {
  if (!v) return null;
  switch (v) {
    case "yes": return "Ja";
    case "no": return "Nee";
    case "limited": return "Beperkt";
    case "designated": return "Speciaal voorzien";
    case "only": return "Uitsluitend";
    case "wlan": return "Wifi";
    case "terminal": return "Pinautomaat";
    default: return v;
  }
};

export const cuisineLabel = (c: string) =>
  CUISINE_NL[c] ?? c.replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase());

export const amenityLabel = (a: string) =>
  AMENITY_NL[a] ?? a.replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase());

export const WEEKDAYS_NL: Record<string, string> = {
  Mo: "Maandag", Tu: "Dinsdag", We: "Woensdag", Th: "Donderdag",
  Fr: "Vrijdag", Sa: "Zaterdag", Su: "Zondag",
  PH: "Feestdagen",
};

// Parse "Mo-Th 09:00-03:00; Fr-Su 09:00-04:00" → readable rows
export function parseOpeningHours(raw: string): Array<{ days: string; hours: string }> {
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^([A-Za-z,\-]+)\s+(.+)$/);
      if (!m) return { days: "", hours: part };
      const daysPart = m[1].split(",").map((seg) => {
        const range = seg.split("-");
        if (range.length === 2) {
          return `${WEEKDAYS_NL[range[0]] ?? range[0]} t/m ${WEEKDAYS_NL[range[1]] ?? range[1]}`;
        }
        return WEEKDAYS_NL[seg] ?? seg;
      }).join(", ");
      return { days: daysPart, hours: m[2] };
    });
}

// Day order matches JS getDay() shifted so Mo=0
const DAY_CODES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function expandDays(token: string): number[] {
  // Supports "Mo", "Mo-Fr", "Mo,We,Fr"
  const result = new Set<number>();
  token.split(",").forEach((seg) => {
    const range = seg.split("-");
    if (range.length === 2) {
      const a = DAY_CODES.indexOf(range[0]);
      const b = DAY_CODES.indexOf(range[1]);
      if (a >= 0 && b >= 0) {
        for (let i = a; i !== (b + 1) % 7; i = (i + 1) % 7) {
          result.add(i);
          if (result.size > 7) break;
        }
      }
    } else {
      const i = DAY_CODES.indexOf(seg);
      if (i >= 0) result.add(i);
    }
  });
  return [...result];
}

function minutesOf(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + (mm || 0);
}

// Returns true/false if parseable, null if format unknown (e.g. "24/7" we handle).
export function isOpenNow(raw: string | null | undefined, now: Date = new Date()): boolean | null {
  if (!raw) return null;
  const txt = raw.trim();
  if (!txt) return null;
  if (/^24\s*\/\s*7$/i.test(txt)) return true;

  // current weekday: JS 0=Sun..6=Sat → our 0=Mo..6=Su
  const jsDay = now.getDay();
  const today = (jsDay + 6) % 7;
  const yesterday = (today + 6) % 7;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  try {
    const parts = txt.split(";").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const m = part.match(/^([A-Za-z,\-]+)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
      if (!m) continue;
      const days = expandDays(m[1]);
      const start = minutesOf(m[2]);
      const end = minutesOf(m[3]);
      if (end > start) {
        if (days.includes(today) && nowMin >= start && nowMin < end) return true;
      } else {
        // overnight (e.g. 22:00-03:00)
        if (days.includes(today) && nowMin >= start) return true;
        if (days.includes(yesterday) && nowMin < end) return true;
      }
    }
    return false;
  } catch {
    return null;
  }
}

