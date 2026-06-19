import { createFileRoute } from "@tanstack/react-router";
import { countRestaurants } from "@/lib/seo-public.functions";

const PAGE_SIZE = 50000;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;
        const total = await countRestaurants();
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const now = new Date().toISOString();

        const entries: string[] = [];
        entries.push(`<sitemap><loc>${base}/sitemap-landing.xml</loc><lastmod>${now}</lastmod></sitemap>`);
        for (let i = 1; i <= pages; i++) {
          entries.push(`<sitemap><loc>${base}/sitemap-restaurants.xml?page=${i}</loc><lastmod>${now}</lastmod></sitemap>`);
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>`;
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
