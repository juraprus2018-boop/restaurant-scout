import { createFileRoute } from "@tanstack/react-router";
import { listCitiesPublic, listCuisinesPublic } from "@/lib/seo-public.functions";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/locales";

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

function cityPath(lang: string, slug: string) {
  return lang === DEFAULT_LOCALE ? `/stad/${slug}` : `/${lang}/stad/${slug}`;
}

export const Route = createFileRoute("/sitemap-landing.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;
        const [cities, cuisines] = await Promise.all([
          listCitiesPublic({ data: { minCount: 1, limit: 5000 } }),
          listCuisinesPublic({ data: { minCount: 1, limit: 500 } }),
        ]);
        const now = new Date().toISOString();
        const urls: string[] = [
          `<url><loc>${base}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
        ];

        // Cities overview page: one <url> per locale with hreflang alternates.
        for (const l of LOCALES) {
          const stedenPath = (code: string) => (code === DEFAULT_LOCALE ? "/steden" : `/${code}/steden`);
          const alts = LOCALES.map(
            (a) => `<xhtml:link rel="alternate" hreflang="${a.code}" href="${base}${stedenPath(a.code)}"/>`,
          ).join("");
          const xdefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${base}${stedenPath(DEFAULT_LOCALE)}"/>`;
          urls.push(
            `<url><loc>${base}${stedenPath(l.code)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority>${alts}${xdefault}</url>`,
          );
        }

        // City pages: one <url> per locale, with hreflang alternates to every other locale.
        for (const c of cities) {
          for (const l of LOCALES) {
            const alts = LOCALES.map(
              (a) =>
                `<xhtml:link rel="alternate" hreflang="${a.code}" href="${base}${cityPath(a.code, c.slug)}"/>`,
            ).join("");
            const xdefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${base}${cityPath(DEFAULT_LOCALE, c.slug)}"/>`;
            urls.push(
              `<url><loc>${base}${cityPath(l.code, escapeXml(c.slug))}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority>${alts}${xdefault}</url>`,
            );
          }
        }

        // Cuisines stay NL-only for now (Fase 2)
        for (const c of cuisines) {
          urls.push(
            `<url><loc>${base}/keuken/${escapeXml(c.cuisine)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
