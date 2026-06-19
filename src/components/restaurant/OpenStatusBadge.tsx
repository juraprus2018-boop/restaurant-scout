import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getOpenStatus } from "@/lib/opening-hours-status";
import { weekdayLabel, t } from "@/lib/i18n/strings";
import type { LocaleCode } from "@/lib/i18n/locales";

export function OpenStatusBadge({ locale, openingHours }: { locale: LocaleCode; openingHours: string | null | undefined }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!openingHours) return null;
  const status = getOpenStatus(openingHours, new Date());
  if (status.state === "unknown") return null;

  if (status.state === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
        {t(locale, "status.openNow")} · {t(locale, "status.closesAt", { time: status.closesAt })}
      </span>
    );
  }
  const dayPart = status.opensDay ? ` ${weekdayLabel(locale, status.opensDay)}` : "";
  void tick;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
      <Clock className="w-3 h-3" />
      {t(locale, "status.closed")}{status.opensAt ? ` · ${t(locale, "status.opensAt", { time: status.opensAt + dayPart })}` : ""}
    </span>
  );
}
