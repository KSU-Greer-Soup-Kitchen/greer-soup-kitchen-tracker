// Adds up the numbers for the reports page (FR-8). Kept separate so it can be tested.

import { lastMonths, monthKey } from "./format";
import { AGE_GROUPS, labelFor, PAYMENT_METHODS } from "./options";

type Gift = { amount: number; donated_at: string; payment_method: string | null };
type ShiftRow = { hours: number; shift_date: string; person_id: string };
type DonorRow = { age_group: string | null };
type Point = { label: string; long?: string; value: number };

export function buildReports(gifts: Gift[], shifts: ShiftRow[], donors: DonorRow[], names: Map<string, string>, now = new Date()) {
  const months = lastMonths(12, now);

  const givenByMonth: Point[] = months.map((m) => ({
    label: m.label,
    long: m.long,
    value: gifts.filter((g) => monthKey(g.donated_at) === m.key).reduce((s, g) => s + Number(g.amount), 0),
  }));
  const hoursByMonth: Point[] = months.map((m) => ({
    label: m.label,
    long: m.long,
    value: shifts.filter((s) => monthKey(s.shift_date) === m.key).reduce((sum, s) => sum + Number(s.hours), 0),
  }));

  // How gifts were paid, biggest first. Old gifts saved before we tracked this show as "Not recorded".
  const byMethod = new Map<string, number>();
  for (const g of gifts) {
    const key = g.payment_method ?? "";
    byMethod.set(key, (byMethod.get(key) ?? 0) + Number(g.amount));
  }
  const givenByMethod: Point[] = [...byMethod.entries()]
    .map(([method, value]) => ({ label: labelFor(PAYMENT_METHODS, method) || "Not recorded", value }))
    .sort((a, b) => b.value - a.value);

  // Donor age groups, in age order, plus anyone who did not say
  const donorAges: Point[] = AGE_GROUPS.map((a) => ({ label: a.label, value: donors.filter((d) => d.age_group === a.value).length }));
  const unknownAge = donors.filter((d) => !d.age_group).length;
  if (unknownAge) donorAges.push({ label: "Not given", value: unknownAge });

  const hoursByPerson = new Map<string, number>();
  for (const s of shifts) hoursByPerson.set(s.person_id, (hoursByPerson.get(s.person_id) ?? 0) + Number(s.hours));
  const topVolunteers: Point[] = [...hoursByPerson.entries()]
    .map(([id, value]) => ({ label: names.get(id) ?? "Unknown", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const totalGiven = gifts.reduce((s, g) => s + Number(g.amount), 0);
  return {
    givenByMonth,
    hoursByMonth,
    givenByMethod,
    donorAges,
    topVolunteers,
    totalGiven,
    giftCount: gifts.length,
    averageGift: gifts.length ? totalGiven / gifts.length : 0,
    totalHours: shifts.reduce((s, x) => s + Number(x.hours), 0),
    volunteersWhoServed: hoursByPerson.size,
  };
}
