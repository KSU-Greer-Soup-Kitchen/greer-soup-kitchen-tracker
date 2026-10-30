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

// Saves a PayPal donation and links it to the person with the same email (FR-5).
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

// The three public forms (FR-1, FR-2, FR-3). Each one links to the person by email (FR-5).

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
  });
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
