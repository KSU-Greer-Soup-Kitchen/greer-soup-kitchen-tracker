// Server-only database access. The secret key skips row-level security,
// so this file must never be imported by a page that runs in the browser.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DonationToSave } from "./donations";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("Supabase settings missing: set SUPABASE_URL and SUPABASE_SECRET_KEY");
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

// Saves a PayPal donation and links it to the person with the same email (FR-5).
// Returns false when this PayPal transaction was already saved.
export async function savePayPalDonation(donation: DonationToSave): Promise<boolean> {
  const { data, error } = await getClient().rpc("record_paypal_donation", {
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
