import Link from "next/link";
import { shortDate } from "../../../../lib/format";
import { REQUEST_STATUS } from "../../../../lib/options";
import { listRequests } from "../../../../lib/staff-data";
import { needLabel, PageHead, PersonLink, StatusPill } from "../bits";
import { RequestForm } from "../StaffForms";

export const metadata = { title: "Help Requests" };

export default async function HelpRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = REQUEST_STATUS.some((s) => s.value === status) ? status : status === "all" ? undefined : "new";
  const requests = await listRequests(filter);

  const tabs = [...REQUEST_STATUS, { value: "all", label: "All" }];

  return (
    <>
      <PageHead title="Help requests" intro="People who asked for help on the website. Call or email them, then mark the request as contacted." />

      <nav className="filter-links" aria-label="Which requests">
        {tabs.map((t) => (
          <Link key={t.value} href={`/staff/help?status=${t.value}`} aria-current={(filter ?? "all") === t.value ? "true" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <section className="panel">
          <p className="empty">{filter === "new" ? "No new requests. Everyone has been contacted." : "No requests here."}</p>
        </section>
      ) : (
        requests.map((r) => (
          <section className="panel" key={r.id} aria-labelledby={`req-${r.id}`}>
            <div className="panel-head">
              <h2 id={`req-${r.id}`}>
                <PersonLink person={r.people} />
              </h2>
              <StatusPill status={r.status} />
            </div>
            <div className="grid-2">
              <dl className="details-list">
                <dt>Asked on</dt>
                <dd>{shortDate(r.created_at)}</dd>
                <dt>Needs</dt>
                <dd>{needLabel(r.need)}</dd>
                <dt>Phone</dt>
                <dd>{r.people?.phone ? <a href={`tel:${r.people.phone}`}>{r.people.phone}</a> : <span className="muted">Not given</span>}</dd>
                <dt>Email</dt>
                <dd>{r.people?.email ? <a href={`mailto:${r.people.email}`}>{r.people.email}</a> : <span className="muted">Not given</span>}</dd>
                <dt>Best time</dt>
                <dd>{r.best_time ?? "Any time"}</dd>
                {r.details && (
                  <>
                    <dt>They wrote</dt>
                    <dd style={{ whiteSpace: "pre-wrap" }}>{r.details}</dd>
                  </>
                )}
              </dl>
              <RequestForm id={r.id} status={r.status} notes={r.staff_notes} />
            </div>
          </section>
        ))
      )}
    </>
  );
}
