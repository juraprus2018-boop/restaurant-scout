// Lightweight OSM opening_hours parser. Handles common patterns:
//   "Mo-Fr 09:00-17:00; Sa 10:00-14:00; Su off"
//   "Mo-Su 11:00-23:00"
//   "24/7"
// Returns the current open/closed status for the user's local time.

const DAY_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
type Day = typeof DAY_ORDER[number];

type Interval = { day: Day; open: number; close: number }; // minutes from week start, close can exceed 7*1440

function expandDays(spec: string): Day[] {
  const out: Day[] = [];
  for (const part of spec.split(",")) {
    const range = part.trim().split("-");
    if (range.length === 1) {
      if (DAY_ORDER.includes(range[0] as Day)) out.push(range[0] as Day);
    } else {
      const a = DAY_ORDER.indexOf(range[0] as Day);
      const b = DAY_ORDER.indexOf(range[1] as Day);
      if (a >= 0 && b >= 0) {
        for (let i = a; i <= b; i++) out.push(DAY_ORDER[i]);
      }
    }
  }
  return out;
}

function parseTime(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]); const mm = Number(m[2]);
  if (h > 48 || mm > 59) return null;
  return h * 60 + mm;
}

export function parseOpeningHours(raw: string): Interval[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed === "24/7") {
    return DAY_ORDER.map((day) => ({ day, open: 0, close: 24 * 60 }));
  }
  const intervals: Interval[] = [];
  for (const rule of trimmed.split(";").map((s) => s.trim()).filter(Boolean)) {
    const m = rule.match(/^([A-Za-z,\-]+)\s+(.+)$/);
    if (!m) continue;
    const days = expandDays(m[1]);
    const rest = m[2].trim();
    if (/^(off|closed)$/i.test(rest)) continue;
    for (const timePart of rest.split(",").map((s) => s.trim())) {
      const tm = timePart.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
      if (!tm) continue;
      const open = parseTime(tm[1]);
      let close = parseTime(tm[2]);
      if (open === null || close === null) continue;
      // crosses midnight
      if (close <= open) close += 24 * 60;
      for (const day of days) intervals.push({ day, open, close });
    }
  }
  return intervals;
}

export type OpenStatus =
  | { state: "open"; closesAt: string }
  | { state: "closed"; opensAt: string; opensDay?: string }
  | { state: "unknown" };

function fmt(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getOpenStatus(raw: string | null | undefined, now: Date = new Date()): OpenStatus {
  if (!raw) return { state: "unknown" };
  const intervals = parseOpeningHours(raw);
  if (intervals.length === 0) return { state: "unknown" };

  // JS getDay(): 0=Sun..6=Sat. Map to our Mo..Su (0..6).
  const jsDay = now.getDay();
  const todayIdx = (jsDay + 6) % 7; // 0=Mo
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  // Check open today (or yesterday's interval that crosses midnight)
  for (const it of intervals) {
    const dIdx = DAY_ORDER.indexOf(it.day);
    if (dIdx === todayIdx && minutesNow >= it.open && minutesNow < it.close) {
      return { state: "open", closesAt: fmt(it.close) };
    }
    // yesterday's interval crossing midnight into today
    const yIdx = (todayIdx + 6) % 7;
    if (dIdx === yIdx && it.close > 24 * 60) {
      const wrapEnd = it.close - 24 * 60;
      if (minutesNow < wrapEnd) {
        return { state: "open", closesAt: fmt(it.close) };
      }
    }
  }

  // Find next opening within 7 days
  for (let offset = 0; offset < 8; offset++) {
    const dIdx = (todayIdx + offset) % 7;
    const dayCode = DAY_ORDER[dIdx];
    const sameDay = offset === 0;
    const candidates = intervals
      .filter((it) => it.day === dayCode && (!sameDay || it.open > minutesNow))
      .sort((a, b) => a.open - b.open);
    if (candidates.length > 0) {
      return {
        state: "closed",
        opensAt: fmt(candidates[0].open),
        opensDay: offset === 0 ? undefined : dayCode,
      };
    }
  }
  return { state: "closed", opensAt: "" };
}
