import { createFileRoute } from "@tanstack/react-router";
import { listCitiesPublic, listCuisinesPublic } from "@/lib/seo-public.functions";

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

export const Route = createFileRoute("/sitemap-landing[.]xml")({
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
        for (const c of cities) {
          urls.push(
            `<url><loc>${base}/stad/${escapeXml(c.slug)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
          );
        }
        for (const c of cuisines) {
          urls.push(
            `<url><loc>${base}/keuken/${escapeXml(c.cuisine)}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
          );
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
