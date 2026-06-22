import type { LocaleCode } from "@/lib/i18n/locales";

export interface BreadcrumbStep {
  name: string;
  item: string;
}

export function breadcrumbListJsonLd(steps: BreadcrumbStep[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      item: s.item,
    })),
  };
}

interface RatedItem {
  avg_rating?: number | null;
  review_count?: number | null;
}

/**
 * Aggregate rating across a list of restaurants on a landing page.
 * Weighted by review_count. Returns null if there is no rated venue.
 */
export function aggregateRatingJsonLd(
  itemName: string,
  lang: LocaleCode,
  items: RatedItem[],
): Record<string, unknown> | null {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const it of items) {
    const r = Number(it.avg_rating ?? 0);
    const n = Number(it.review_count ?? 0);
    if (r > 0 && n > 0) {
      weightedSum += r * n;
      totalWeight += n;
    }
  }
  if (totalWeight === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    inLanguage: lang,
    itemReviewed: {
      "@type": "LocalBusiness",
      name: itemName,
    },
    ratingValue: (weightedSum / totalWeight).toFixed(2),
    reviewCount: totalWeight,
    bestRating: 5,
    worstRating: 1,
  };
}
