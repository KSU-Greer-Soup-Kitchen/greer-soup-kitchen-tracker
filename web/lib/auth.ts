// Staff login (FR-6). Staff accounts are made in Supabase (Authentication -> Users -> Add user).
// Public sign-up is turned off there, so only people staff add can log in.
// The login is kept in two cookies the browser can't read with scripts.

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "./session";

export type Staff = { id: string; email: string };

// A fresh client for each login check. Logging in on the shared database client
// would make its later queries run as the staff member instead of the server.
function authClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Supabase settings missing: set SUPABASE_URL and SUPABASE_SECRET_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function signIn(email: string, password: string): Promise<boolean> {
  const { data, error } = await authClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return false;
  }
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, data.session.access_token, cookieOptions());
  jar.set(REFRESH_COOKIE, data.session.refresh_token, cookieOptions());
  return true;
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

// Returns the logged-in staff member, or null. Asks Supabase every time,
// so a deleted account or a faked cookie never gets in.
export async function getStaff(): Promise<Staff | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const { data, error } = await authClient().auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return { id: data.user.id, email: data.user.email ?? "" };
}

// Call this at the top of every staff page and staff action (NFR-2).
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) {
    redirect("/staff/login");
  }
  return staff;
}
