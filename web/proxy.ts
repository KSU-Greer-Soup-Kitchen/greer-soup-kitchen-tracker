// Runs before every staff page. Sends logged-out visitors to the login page,
// and quietly renews the login token before it runs out (they last one hour).
// The real check happens on each page with requireStaff().

import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions, secondsLeft } from "./lib/session";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/staff/login") {
    return NextResponse.next();
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }
  if (access && secondsLeft(access) > 120) {
    return NextResponse.next();
  }

  const renewed = await renewLogin(refresh);
  if (!renewed) {
    const response = NextResponse.redirect(new URL("/staff/login", request.url));
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  // Pass the new tokens to the page now, and save them in the browser for next time
  request.cookies.set(ACCESS_COOKIE, renewed.access_token);
  request.cookies.set(REFRESH_COOKIE, renewed.refresh_token);
  const response = NextResponse.next({ request });
  response.cookies.set(ACCESS_COOKIE, renewed.access_token, cookieOptions());
  response.cookies.set(REFRESH_COOKIE, renewed.refresh_token, cookieOptions());
  return response;
}

async function renewLogin(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { access_token: string; refresh_token: string };
  } catch {
    return null;
  }
}

export const config = {
  matcher: "/staff/:path*",
};
