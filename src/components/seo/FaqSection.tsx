import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/seo-faq.functions";
import { t } from "@/lib/i18n/strings";
import type { LocaleCode } from "@/lib/i18n/locales";

export function FaqSection({
  locale,
  items,
}: {
  locale: LocaleCode;
  items: FaqItem[];
}) {
  if (!items || items.length === 0) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="font-display text-2xl sm:text-3xl text-ink mb-6">
        {t(locale, "faqLanding.title")}
      </h2>
      <div className="divide-y border border-border rounded-2xl bg-card">
        {items.map((f, i) => (
          <details key={i} className="group p-5">
            <summary className="cursor-pointer font-semibold text-foreground flex items-center justify-between gap-4 list-none">
              <span>{f.q}</span>
              <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
