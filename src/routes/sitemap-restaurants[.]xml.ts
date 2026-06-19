import { createFileRoute } from "@tanstack/react-router";
import { getRestaurantSitemapPage } from "@/lib/seo-public.functions";

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

export const Route = createFileRoute("/sitemap-restaurants.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;
        const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
        const rows = await getRestaurantSitemapPage({ data: { page, pageSize: 50000 } });
        const urls = rows
          .map(
            (r) =>
              `<url><loc>${base}/restaurant/${escapeXml(r.slug)}</loc><lastmod>${new Date(r.updated_at).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
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
