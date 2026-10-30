// Small pieces used on several staff pages.

import Link from "next/link";
import { labelFor, NEEDS, PAYMENT_METHODS, REQUEST_STATUS } from "../../../lib/options";
import { fullName } from "../../../lib/staff-data";

type PersonLike = { id: string; first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined;

export function PersonLink({ person }: { person: PersonLike }) {
  if (!person) return <span className="muted">No name (PayPal did not share it)</span>;
  return <Link href={`/staff/people/${person.id}`}>{fullName(person)}</Link>;
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill-${status}`}>{labelFor(REQUEST_STATUS, status)}</span>;
}

export function PaidWith({ method, source }: { method: string | null; source: string }) {
  const how = labelFor(PAYMENT_METHODS, method) || "Not recorded";
  return (
    <>
      {how}
      {source === "paypal" && method !== "paypal" && <span className="muted small"> (through PayPal)</span>}
    </>
  );
}

export function needLabel(need: string): string {
  return labelFor(NEEDS, need);
}

export function Tribute({ type, name }: { type: string | null; name: string | null }) {
  if (!type || !name) return null;
  return (
    <>
      In {type} of {name}
    </>
  );
}

export function PageHead({ title, intro, children }: { title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {intro && <p className="muted">{intro}</p>}
      </div>
      {children && <div className="button-row">{children}</div>}
    </div>
  );
}
