// Server-only database access. The secret key skips row-level security,
// so this file must never be imported by a page that runs in the browser.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DonationToSave } from "./donations";
import type { DonorInput, HelpInput, VolunteerInput } from "./validate";

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("Supabase settings missing: set SUPABASE_URL and SUPABASE_SECRET_KEY");
    }
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

// Saves a PayPal donation and links it to the person with the same email.
// Returns false when this PayPal transaction was already saved.
export async function savePayPalDonation(donation: DonationToSave): Promise<boolean> {
  const { data, error } = await db().rpc("record_paypal_donation", {
    p_email: donation.payer.email,
    p_first_name: donation.payer.firstName,
    p_last_name: donation.payer.lastName,
    p_amount: donation.amount,
    p_currency: donation.currency,
    p_donated_at: donation.donatedAt,
    p_txn_id: donation.txnId,
    p_event_id: donation.eventId,
    p_payment_method: donation.paymentMethod,
  });
  if (error) {
    throw new Error(`Could not save donation: ${error.message}`);
  }
  return data === true;
}

// The three public forms. Each one links to the person by email.
// A weekend group picked a date another group just booked
export class DateTakenError extends Error {
  constructor() {
    super("That weekend date was just taken");
  }
}

export async function saveVolunteer(v: VolunteerInput): Promise<void> {
  const { error } = await db().rpc("submit_volunteer", {
    p_email: v.email,
    p_first_name: v.firstName,
    p_last_name: v.lastName,
    p_phone: v.phone,
    p_address: v.address,
    p_age_group: v.ageGroup,
    p_availability: v.availability,
    p_skills: v.skills,
    p_notes: v.notes,
    p_program: v.program,
    p_weekend_date: v.weekendDate || null,
    p_group_name: v.groupName || null,
    p_group_size: v.groupSize,
  });
  if (error?.message.includes("date_taken")) throw new DateTakenError();
  if (error) throw new Error(`Could not save volunteer: ${error.message}`);
}

export async function saveDonor(d: DonorInput): Promise<void> {
  const { error } = await db().rpc("submit_donor", {
    p_email: d.email,
    p_first_name: d.firstName,
    p_last_name: d.lastName,
    p_phone: d.phone,
    p_address: d.address,
    p_city: d.city,
    p_age_group: d.ageGroup,
    p_giving_frequency: d.givingFrequency || null,
    p_heard_from: d.heardFrom,
    p_contact_prefs: d.contactPrefs,
    p_newsletter: d.newsletter,
    p_tribute_type: d.tributeType || null,
    p_tribute_name: d.tributeName,
  });
  if (error) throw new Error(`Could not save donor: ${error.message}`);
}

export async function saveHelpRequest(h: HelpInput): Promise<void> {
  const { error } = await db().rpc("submit_assistance_request", {
    p_email: h.email,
    p_first_name: h.firstName,
    p_last_name: h.lastName,
    p_phone: h.phone,
    p_need: h.need,
    p_details: h.details,
    p_best_time: h.bestTime,
  });
  if (error) throw new Error(`Could not save help request: ${error.message}`);
}

// Weekend dates a volunteer group can still book, as YYYY-MM-DD, soonest first
export async function listOpenWeekendDates(): Promise<string[]> {
  const { data, error } = await db().rpc("list_open_weekend_dates");
  if (error) throw new Error(`Could not load weekend dates: ${error.message}`);
  return ((data as string[] | null) ?? []).map((d) => String(d).slice(0, 10));
}

// Who a form should be emailed to (see form_recipients in migration 0004), or null if nobody yet
export async function findRecipient(route: string): Promise<string | null> {
  const { data, error } = await db().from("form_recipients").select("email").eq("route", route).maybeSingle();
  if (error) throw new Error(`Could not look up who gets this form: ${error.message}`);
  const email = (data as { email: string | null } | null)?.email?.trim();
  return email || null;
}
