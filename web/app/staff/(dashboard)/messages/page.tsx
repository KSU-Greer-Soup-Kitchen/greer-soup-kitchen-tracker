import Link from "next/link";
import { shortDate } from "../../../../lib/format";
import { CONTACT_TOPICS, labelFor, REQUEST_STATUS } from "../../../../lib/options";
import { listMessages } from "../../../../lib/staff-data";
import { PageHead, StatusPill } from "../bits";
import { RequestForm } from "../StaffForms";

export const metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = REQUEST_STATUS.some((s) => s.value === status) ? status : status === "all" ? undefined : "new";
  const messages = await listMessages(filter);

  const tabs = [...REQUEST_STATUS, { value: "all", label: "All" }];

  return (
    <>
      <PageHead title="Messages" intro="Messages sent from the Contact page on the website. Answer them, then mark them as contacted." />

      <nav className="filter-links" aria-label="Which messages">
        {tabs.map((t) => (
          <Link key={t.value} href={`/staff/messages?status=${t.value}`} aria-current={(filter ?? "all") === t.value ? "true" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>

      {messages.length === 0 ? (
        <section className="panel">
          <p className="empty">{filter === "new" ? "No new messages." : "No messages here."}</p>
        </section>
      ) : (
        messages.map((m) => (
          <section className="panel" key={m.id} aria-labelledby={`msg-${m.id}`}>
            <div className="panel-head">
              <h2 id={`msg-${m.id}`}>{m.name}</h2>
              <StatusPill status={m.status} />
            </div>
            <div className="grid-2">
              <dl className="details-list">
                <dt>Sent on</dt>
                <dd>{shortDate(m.created_at)}</dd>
                <dt>For</dt>
                <dd>{labelFor(CONTACT_TOPICS, m.topic)}</dd>
                <dt>Email</dt>
                <dd>{m.email ? <a href={`mailto:${m.email}`}>{m.email}</a> : <span className="muted">Not given</span>}</dd>
                <dt>Phone</dt>
                <dd>{m.phone ? <a href={`tel:${m.phone}`}>{m.phone}</a> : <span className="muted">Not given</span>}</dd>
                <dt>Message</dt>
                <dd style={{ whiteSpace: "pre-wrap" }}>{m.message}</dd>
              </dl>
              <RequestForm kind="message" id={m.id} status={m.status} notes={m.staff_notes} />
            </div>
          </section>
        ))
      )}
    </>
  );
}
