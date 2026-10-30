// Everything the staff dashboard reads
// Every function checks for a logged-in staff member first, so private data
// can't be read from anywhere else by mistake

import "server-only";
import { requireStaff } from "./auth";
import { db } from "./supabase";
import { monthStart, today } from "./format";

export type Person = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  age_group: string | null;
  created_at: string;
};

export type Donation = {
  id: string;
  person_id: string | null;
  amount: number;
  currency: string;
  donated_at: string;
  source: "paypal" | "manual";
  payment_method: string | null;
  paypal_txn_id: string | null;
  tribute_type: string | null;
  tribute_name: string | null;
  notes: string | null;
  people?: Pick<Person, "id" | "first_name" | "last_name" | "email"> | null;
};

export type Volunteer = {
  person_id: string;
  // step, weekday, or weekend_group
  program: string | null;
  availability: string[];
  skills: string[];
  notes: string | null;
  active: boolean;
  created_at: string;
  people?: Person | null;
};

export type Shift = {
  id: string;
  person_id: string;
  shift_date: string;
  hours: number;
  task: string | null;
  people?: Pick<Person, "id" | "first_name" | "last_name"> | null;
};

export type DonorInfo = {
  person_id: string;
  giving_frequency: string | null;
  heard_from: string | null;
  contact_prefs: string[];
  newsletter: boolean | null;
  tribute_type: string | null;
  tribute_name: string | null;
  created_at: string;
};

export type HelpRequest = {
  id: string;
  person_id: string;
  need: string;
  details: string | null;
  best_time: string | null;
  status: "new" | "contacted" | "closed";
  staff_notes: string | null;
  created_at: string;
  people?: Pick<Person, "id" | "first_name" | "last_name" | "email" | "phone"> | null;
};

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

const PERSON_SHORT = "people(id, first_name, last_name, email)";

export async function getOverview() {
  await requireStaff();
  const thisMonth = monthStart();
  const [volunteers, shifts, donations, requests, recent] = await Promise.all([
    db().from("volunteers").select("person_id", { count: "exact", head: true }).eq("active", true),
    db().from("volunteer_shifts").select("hours").gte("shift_date", thisMonth),
    db().from("donations").select("amount").gte("donated_at", thisMonth),
    db()
      .from("assistance_requests")
      .select("*, people(id, first_name, last_name, email, phone)")
      .eq("status", "new")
      .order("created_at", { ascending: false }),
    db().from("donations").select(`*, ${PERSON_SHORT}`).order("donated_at", { ascending: false }).limit(6),
  ]);
  if (volunteers.error) throw new Error(volunteers.error.message);
  const hours = check(shifts) as { hours: number }[];
  const gifts = check(donations) as { amount: number }[];
  return {
    activeVolunteers: volunteers.count ?? 0,
    hoursThisMonth: hours.reduce((sum, s) => sum + Number(s.hours), 0),
    givenThisMonth: gifts.reduce((sum, g) => sum + Number(g.amount), 0),
    giftsThisMonth: gifts.length,
    newRequests: check(requests) as HelpRequest[],
    recentDonations: check(recent) as Donation[],
  };
}

export async function listDonations(): Promise<Donation[]> {
  await requireStaff();
  return check(await db().from("donations").select(`*, ${PERSON_SHORT}`).order("donated_at", { ascending: false }).limit(500)) as Donation[];
}

// Everyone we can pick from when typing in a gift or logging hours
export async function listPeople(): Promise<Person[]> {
  await requireStaff();
  return check(await db().from("people").select("*").order("last_name", { ascending: true, nullsFirst: false }).limit(2000)) as Person[];
}

export type DonorRow = Person & { donor: DonorInfo | null; total: number; giftCount: number; lastGift: string | null };

// Anyone who filled out the donor form or has given at least once
export async function listDonors(): Promise<DonorRow[]> {
  await requireStaff();
  const rows = check(
    await db().from("people").select("*, donors(*), donations(amount, donated_at)").order("last_name", { ascending: true, nullsFirst: false }),
  ) as (Person & { donors: DonorInfo | DonorInfo[] | null; donations: { amount: number; donated_at: string }[] })[];
  return rows
    .map((p) => {
      const donor = Array.isArray(p.donors) ? p.donors[0] ?? null : p.donors;
      const gifts = p.donations ?? [];
      const lastGift = gifts.map((g) => g.donated_at).sort().at(-1) ?? null;
      const { donors: _d, donations: _g, ...person } = p;
      return { ...person, donor, total: gifts.reduce((s, g) => s + Number(g.amount), 0), giftCount: gifts.length, lastGift };
    })
    .filter((p) => p.donor || p.giftCount > 0);
}

// A weekend date a volunteer group booked
export type WeekendBooking = { day: string; group_name: string | null; group_size: number | null; booked_person_id: string };

export type VolunteerRow = Volunteer & {
  hoursThisMonth: number;
  hoursTotal: number;
  lastShift: string | null;
  bookings: WeekendBooking[];
};

export async function listVolunteers(): Promise<VolunteerRow[]> {
  await requireStaff();
  const thisMonth = monthStart();
  const [vols, shifts, booked] = await Promise.all([
    db().from("volunteers").select("*, people(*)").order("created_at", { ascending: false }),
    db().from("volunteer_shifts").select("person_id, hours, shift_date"),
    db().from("weekend_dates").select("day, group_name, group_size, booked_person_id").not("booked_person_id", "is", null).gte("day", today()).order("day"),
  ]);
  const allShifts = check(shifts) as Pick<Shift, "person_id" | "hours" | "shift_date">[];
  const bookings = check(booked) as WeekendBooking[];
  return (check(vols) as Volunteer[])
    .map((v) => {
      const mine = allShifts.filter((s) => s.person_id === v.person_id);
      return {
        ...v,
        hoursThisMonth: mine.filter((s) => s.shift_date >= thisMonth).reduce((sum, s) => sum + Number(s.hours), 0),
        hoursTotal: mine.reduce((sum, s) => sum + Number(s.hours), 0),
        lastShift: mine.map((s) => s.shift_date).sort().at(-1) ?? null,
        bookings: bookings.filter((b) => b.booked_person_id === v.person_id),
      };
    })
    .sort((a, b) => Number(b.active) - Number(a.active) || fullName(a.people).localeCompare(fullName(b.people)));
}

export async function listRecentShifts(limit = 25): Promise<Shift[]> {
  await requireStaff();
  return check(
    await db()
      .from("volunteer_shifts")
      .select("*, people(id, first_name, last_name)")
      .order("shift_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit),
  ) as Shift[];
}

export async function listRequests(status?: string): Promise<HelpRequest[]> {
  await requireStaff();
  let query = db().from("assistance_requests").select("*, people(id, first_name, last_name, email, phone)").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  return check(await query) as HelpRequest[];
}

export async function getPerson(id: string) {
  await requireStaff();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const person = check(await db().from("people").select("*").eq("id", id).maybeSingle()) as Person | null;
  if (!person) return null;
  const [volunteer, donor, donations, shifts, requests, booked] = await Promise.all([
    db().from("volunteers").select("*").eq("person_id", id).maybeSingle(),
    db().from("donors").select("*").eq("person_id", id).maybeSingle(),
    db().from("donations").select("*").eq("person_id", id).order("donated_at", { ascending: false }),
    db().from("volunteer_shifts").select("*").eq("person_id", id).order("shift_date", { ascending: false }),
    db().from("assistance_requests").select("*").eq("person_id", id).order("created_at", { ascending: false }),
    db().from("weekend_dates").select("day, group_name, group_size, booked_person_id").eq("booked_person_id", id).order("day", { ascending: false }),
  ]);
  return {
    person,
    volunteer: check(volunteer) as Volunteer | null,
    donor: check(donor) as DonorInfo | null,
    donations: check(donations) as Donation[],
    shifts: check(shifts) as Shift[],
    requests: check(requests) as HelpRequest[],
    bookings: check(booked) as WeekendBooking[],
  };
}

// Numbers for the reports page: the last 12 months
export async function getReportData() {
  await requireStaff();
  const since = monthStart(11);
  const [donations, shifts, donors] = await Promise.all([
    db().from("donations").select("amount, donated_at, payment_method, source").gte("donated_at", since),
    db().from("volunteer_shifts").select("hours, shift_date, person_id").gte("shift_date", since),
    listDonors(),
  ]);
  return {
    since,
    donations: check(donations) as Pick<Donation, "amount" | "donated_at" | "payment_method" | "source">[],
    shifts: check(shifts) as Pick<Shift, "hours" | "shift_date" | "person_id">[],
    donors,
  };
}

// Email addresses of active volunteers, for volunteer notices
export async function listVolunteerContacts() {
  await requireStaff();
  type Row = Pick<Volunteer, "availability" | "skills"> & { people: Pick<Person, "id" | "first_name" | "last_name" | "email"> | null };
  const vols = check(
    await db().from("volunteers").select("availability, skills, people(id, first_name, last_name, email)").eq("active", true),
  ) as unknown as Row[];
  return vols
    .filter((v) => v.people?.email)
    .map((v) => ({
      id: v.people!.id,
      name: fullName(v.people),
      email: v.people!.email!,
      availability: v.availability,
      skills: v.skills,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function fullName(p: { first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined): string {
  if (!p) return "Unknown";
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
  return name || p.email || "No name given";
}
