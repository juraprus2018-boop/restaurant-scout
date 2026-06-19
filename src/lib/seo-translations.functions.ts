import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getLocale, isLocale, type LocaleCode } from "@/lib/i18n/locales";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

interface LandingCopy {
  title: string;
  description: string;
  intro: string;
}

async function generateWithAI(args: {
  scope: "city" | "cuisine";
  key: string;
  lang: LocaleCode;
  context: { displayName: string; total: number };
}): Promise<LandingCopy> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    // Fallback so the page still works if AI is unavailable
    const { displayName, total } = args.context;
    return {
      title: `${displayName} — PlaceResults`,
      description: `Find restaurants, cafés and bars in ${displayName}. ${total} venues with reviews.`,
      intro: `Discover the best places to eat in ${displayName}. ${total} restaurants ranked by visitor ratings.`,
    };
  }

  const locale = getLocale(args.lang);
  const subject = args.scope === "city"
    ? `the city of ${args.context.displayName}`
    : `${args.context.displayName} cuisine`;

  const prompt = `You write SEO landing-page copy for a restaurant directory.
Write in ${locale.englishName} (locale code "${args.lang}"). Use natural, native phrasing — not a translation of English.
Subject: restaurants, cafés and bars in ${subject}. We have ${args.context.total} venues listed.

Return STRICT JSON with three fields and NOTHING else:
{
  "title": "<55-60 char SEO title incl. the place name and "PlaceResults">",
  "description": "<150-160 char meta description, action-oriented>",
  "intro": "<2-3 sentence on-page intro (max 280 chars), friendly, mentions count and that it's sorted by rating>"
}
Do NOT include markdown, code fences, or any extra text.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`AI gateway error: ${res.status}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text);
  return {
    title: String(parsed.title ?? "").slice(0, 70),
    description: String(parsed.description ?? "").slice(0, 200),
    intro: String(parsed.intro ?? "").slice(0, 400),
  };
}

export const getLandingCopy = createServerFn({ method: "GET" })
  .inputValidator((d: {
    scope: "city" | "cuisine";
    key: string;
    lang: string;
    displayName: string;
    total: number;
  }) => d)
  .handler(async ({ data }): Promise<LandingCopy> => {
    const lang = isLocale(data.lang) ? data.lang : "en";
    const sb = publicClient();

    // 1. Try cache
    const { data: cached } = await sb
      .from("seo_translations")
      .select("title,description,intro")
      .eq("scope", data.scope)
      .eq("key", data.key)
      .eq("lang", lang)
      .maybeSingle();
    if (cached) return cached as LandingCopy;

    // 2. Generate
    let copy: LandingCopy;
    try {
      copy = await generateWithAI({
        scope: data.scope, key: data.key, lang,
        context: { displayName: data.displayName, total: data.total },
      });
    } catch (e) {
      // Don't break the page on AI failure — return a sensible fallback
      copy = {
        title: `${data.displayName} — PlaceResults`,
        description: `Restaurants, cafés and bars in ${data.displayName}.`,
        intro: `${data.total} venues in ${data.displayName}.`,
      };
      return copy;
    }

    // 3. Cache via service role (insert ignoring conflicts in case of race)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("seo_translations")
        .upsert(
          { scope: data.scope, key: data.key, lang, ...copy },
          { onConflict: "scope,key,lang", ignoreDuplicates: true },
        );
    } catch {
      // Cache write failure is non-fatal
    }

    return copy;
  });
