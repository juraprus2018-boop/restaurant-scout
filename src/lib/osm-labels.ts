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
