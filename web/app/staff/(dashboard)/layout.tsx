import Link from "next/link";
import type { ReactNode } from "react";
import { requireStaff } from "../../../lib/auth";
import { logOut } from "../actions";
import { StaffNav } from "./StaffNav";

export const metadata = { robots: { index: false } };

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  return (
    <div className="staff-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className="staff-side">
        <Link className="staff-brand" href="/staff">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Staff dashboard home" width={250} height={132} />
        </Link>
        <StaffNav />
        <div className="staff-user">
          <span>
            Logged in as
            <br />
            <strong>{staff.email}</strong>
          </span>
          <form action={logOut}>
            <button type="submit" className="button button-small">
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="staff-main" id="main">
        {children}
      </main>
    </div>
  );
}
