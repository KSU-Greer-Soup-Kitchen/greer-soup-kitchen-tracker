// Shows money and dates the same way on every page. Dates use Greer's time zone.

const ZONE = "America/New_York";

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const wholeDollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function money(amount: number, whole = false): string {
  return (whole ? wholeDollars : dollars).format(amount);
}

export function hours(n: number): string {
  return `${Number(n.toFixed(2))} ${n === 1 ? "hour" : "hours"}`;
}

// "2026-10-26" (a plain date) or a full timestamp -> "Oct 26, 2026"
export function shortDate(value: string | null | undefined): string {
  if (!value) return "";
  const plain = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = plain ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: plain ? "UTC" : ZONE });
}

// Year and month (1-12) in Greer right now
function greerYearMonth(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, year: "numeric", month: "numeric" }).formatToParts(now);
  return {
    year: Number(parts.find((p) => p.type === "year")!.value),
    month: Number(parts.find((p) => p.type === "month")!.value),
  };
}

// The first day of this month, or of the month `back` months ago, as YYYY-MM-DD
export function monthStart(back = 0, now = new Date()): string {
  const { year, month } = greerYearMonth(now);
  const d = new Date(Date.UTC(year, month - 1 - back, 1));
  return d.toISOString().slice(0, 7) + "-01";
}

// "YYYY-MM" for a plain date or a timestamp, in Greer's time zone
export function monthKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  const { year, month } = greerYearMonth(new Date(value));
  return `${year}-${String(month).padStart(2, "0")}`;
}

// The last `count` months, oldest first, as { key: "2026-10", label: "Oct" }
export function lastMonths(count: number, now = new Date()): { key: string; label: string; long: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const start = monthStart(count - 1 - i, now);
    const d = new Date(`${start}T12:00:00Z`);
    return {
      key: start.slice(0, 7),
      label: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      long: d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
    };
  });
}

// Today's date in Greer as YYYY-MM-DD, for date boxes
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
