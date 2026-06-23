import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getLocale, isLocale, type LocaleCode } from "@/lib/i18n/locales";

export interface FaqItem {
  q: string;
  a: string;
}

const FAQ_SCOPE_CITY = "faq_city";
const FAQ_SCOPE_CUISINE = "faq_cuisine";
const FAQ_SCOPE_CITY_CUISINE = "faq_city_cuisine";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function sanitize(s: string): string {
  return s
    .replace(/\s—\s/g, ", ")
    .replace(/—/g, ",")
    .replace(/\s–\s/g, ", ")
    .replace(/–/g, "-")
    .trim();
}

function fallbackCityFaq(displayName: string): FaqItem[] {
  return [
    {
      q: `What are the best restaurants in ${displayName}?`,
      a: `Browse top rated restaurants, cafés and bars in ${displayName} on this page. Results are sorted by visitor ratings.`,
    },
    {
      q: `How many restaurants are listed in ${displayName}?`,
      a: `This page lists restaurants, cafés and bars in ${displayName} based on open data and visitor reviews.`,
    },
    {
      q: `Can I find restaurants open now in ${displayName}?`,
      a: `Yes, use the filter on the homepage to see venues that are currently open. Opening hours come from OpenStreetMap.`,
    },
    {
      q: `Are reviews on PlaceResults real?`,
      a: `Reviews are written by site visitors. You can also leave one yourself on any restaurant detail page.`,
    },
  ];
}

function fallbackCuisineFaq(displayName: string): FaqItem[] {
  return [
    {
      q: `What is ${displayName} cuisine?`,
      a: `${displayName} cuisine groups restaurants serving dishes from this culinary tradition. Pick a venue to see the menu, hours and reviews.`,
    },
    {
      q: `Where can I find good ${displayName} restaurants?`,
      a: `This page lists ${displayName} restaurants across the directory, sorted by visitor ratings. Filter by city for a closer match.`,
    },
    {
      q: `Do ${displayName} restaurants offer takeaway?`,
      a: `Many do. Each restaurant detail page lists takeaway and delivery options when available.`,
    },
    {
      q: `Are these reviews independent?`,
      a: `Reviews are submitted by site visitors, not paid placements. You can also add your own review on any restaurant page.`,
    },
  ];
}

async function generateFaqWithAI(args: {
  scope: "city" | "cuisine" | "city_cuisine";
  lang: LocaleCode;
  displayName: string;
  sampleNames: string[];
}): Promise<FaqItem[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    if (args.scope === "city") return fallbackCityFaq(args.displayName);
    if (args.scope === "cuisine") return fallbackCuisineFaq(args.displayName);
    return fallbackCityFaq(args.displayName);
  }
  const locale = getLocale(args.lang);
  const subject =
    args.scope === "city"
      ? `the city of ${args.displayName}`
      : args.scope === "cuisine"
        ? `${args.displayName} cuisine restaurants`
        : `${args.displayName}`; // city_cuisine: displayName is the full phrase
  const samples = args.sampleNames.slice(0, 8).join(", ");
  const prompt = `You write SEO FAQ content for a restaurant directory page.
Write in ${locale.englishName} (locale code "${args.lang}"). Use natural, native phrasing.
Topic: restaurants, cafés and bars in ${subject}.${samples ? ` Example venues: ${samples}.` : ""}

STYLE RULES (strict):
- NEVER use em-dashes (—) or en-dashes (–). Use commas, periods, or colons.
- Write like a human local, not an AI. Short sentences. No filler like "discover", "unleash", "elevate", "delve into".
- No emojis, no marketing fluff.
- Don't invent specific restaurant names, prices, or ratings.

Return STRICT JSON in this exact shape (and NOTHING else, no markdown or code fences):
{
  "items": [
    { "q": "<60-90 char question, the kind real people type into Google>", "a": "<140-220 char answer, factual, friendly>" },
    ... 4 to 6 items total
  ]
}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text);
  const raw: unknown = parsed?.items;
  if (!Array.isArray(raw)) throw new Error("Invalid FAQ shape");
  const items: FaqItem[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const q = sanitize(String((it as Record<string, unknown>).q ?? ""));
    const a = sanitize(String((it as Record<string, unknown>).a ?? ""));
    if (q.length >= 8 && a.length >= 10) {
      items.push({ q: q.slice(0, 200), a: a.slice(0, 400) });
    }
  }
  if (items.length < 3) throw new Error("Not enough FAQ items returned");
  return items.slice(0, 6);
}

export const getLandingFaq = createServerFn({ method: "GET" })
  .inputValidator((d: {
    scope: "city" | "cuisine" | "city_cuisine";
    key: string;
    lang: string;
    displayName: string;
    sampleNames?: string[];
  }) => d)
  .handler(async ({ data }): Promise<{ items: FaqItem[] }> => {
    const lang = isLocale(data.lang) ? data.lang : "en";
    const scopeName =
      data.scope === "city"
        ? FAQ_SCOPE_CITY
        : data.scope === "cuisine"
          ? FAQ_SCOPE_CUISINE
          : FAQ_SCOPE_CITY_CUISINE;
    const sb = publicClient();

    // 1. Cache lookup (we store the JSON array in `intro`)
    const { data: cached } = await sb
      .from("seo_translations")
      .select("intro")
      .eq("scope", scopeName)
      .eq("key", data.key)
      .eq("lang", lang)
      .maybeSingle();
    if (cached?.intro) {
      try {
        const arr = JSON.parse(cached.intro) as FaqItem[];
        if (Array.isArray(arr) && arr.length >= 3 && !/[—–]/.test(JSON.stringify(arr))) {
          return { items: arr };
        }
      } catch {
        // fall through and regenerate
      }
    }

    // 2. Generate
    let items: FaqItem[];
    try {
      items = await generateFaqWithAI({
        scope: data.scope,
        lang,
        displayName: data.displayName,
        sampleNames: data.sampleNames ?? [],
      });
    } catch {
      items = data.scope === "city" ? fallbackCityFaq(data.displayName) : fallbackCuisineFaq(data.displayName);
      return { items };
    }

    // 3. Cache
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("seo_translations").upsert(
        {
          scope: scopeName,
          key: data.key,
          lang,
          title: "faq",
          description: `${items.length} items`,
          intro: JSON.stringify(items),
        },
        { onConflict: "scope,key,lang", ignoreDuplicates: false },
      );
    } catch {
      // non-fatal
    }

    return { items };
  });
