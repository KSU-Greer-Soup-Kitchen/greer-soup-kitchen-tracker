// Login cookie names and settings, shared by the login code and proxy.ts.

export const ACCESS_COOKIE = "gsk_access";
export const REFRESH_COOKIE = "gsk_refresh";

// Staff stay logged in for up to 12 hours, then log in again.
const TWELVE_HOURS = 12 * 60 * 60;

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TWELVE_HOURS,
  };
}

// Seconds until a login token runs out (0 if it can't be read).
// Only used to decide when to renew; Supabase still checks every token.
export function secondsLeft(token: string, now = Date.now()): number {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(part)) as { exp?: number };
    return typeof exp === "number" ? Math.max(0, exp - Math.floor(now / 1000)) : 0;
  } catch {
    return 0;
  }
}
