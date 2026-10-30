"use client";

// Write one message to many volunteers about an upcoming need or event (FR-9).
// It opens in staff's own email program with every volunteer on BCC,
// so volunteers never see each other's addresses.

import { useMemo, useState } from "react";
import { AVAILABILITY } from "../../../../lib/options";

type Contact = { id: string; name: string; email: string; availability: string[] };

export function EmailVolunteers({ contacts, staffEmail }: { contacts: Contact[]; staffEmail: string }) {
  const [groups, setGroups] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  // No group picked means everyone
  const recipients = useMemo(
    () => (groups.length ? contacts.filter((c) => c.availability.some((a) => groups.includes(a))) : contacts),
    [contacts, groups],
  );
  const addresses = recipients.map((c) => c.email).join(", ");
  const mailto = `mailto:${encodeURIComponent(staffEmail)}?bcc=${encodeURIComponent(recipients.map((c) => c.email).join(","))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  // Some email programs can't open very long links. Past this, copy and paste instead.
  const tooLong = mailto.length > 1900;

  async function copy() {
    await navigator.clipboard.writeText(addresses);
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);
  }

  function toggle(value: string) {
    setGroups((g) => (g.includes(value) ? g.filter((x) => x !== value) : [...g, value]));
  }

  return (
    <div className="grid-2">
      <section className="panel" aria-labelledby="write">
        <h2 id="write" style={{ fontSize: "1.3rem" }}>
          1. Write your message
        </h2>
        <div className="field">
          <fieldset>
            <legend>Who should get it?</legend>
            <span className="hint">Leave all unchecked to send to every active volunteer.</span>
            <div className="choices">
              {AVAILABILITY.map((a) => (
                <label className="choice" key={a.value} htmlFor={`g-${a.value}`}>
                  <input type="checkbox" id={`g-${a.value}`} checked={groups.includes(a.value)} onChange={() => toggle(a.value)} />
                  {a.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Example: Help needed this Saturday" />
        </div>
        <div className="field">
          <label htmlFor="body">Message</label>
          <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 220 }} />
        </div>
      </section>

      <section className="panel" aria-labelledby="send">
        <h2 id="send" style={{ fontSize: "1.3rem" }}>
          2. Send it
        </h2>
        <p>
          <strong>
            {recipients.length} {recipients.length === 1 ? "volunteer" : "volunteers"}
          </strong>{" "}
          will get this message.
        </p>
        {recipients.length === 0 ? (
          <p className="alert alert-error">No active volunteers with an email address match. Uncheck a group to reach more people.</p>
        ) : (
          <>
            <div className="button-row" style={{ marginBottom: "1rem" }}>
              {!tooLong && (
                <a className="button" href={mailto}>
                  Open in my email
                </a>
              )}
              <button type="button" className={`button${tooLong ? "" : " button-secondary"}`} onClick={copy}>
                {copied ? "Copied!" : "Copy email addresses"}
              </button>
            </div>
            <p className="muted small" aria-live="polite">
              {tooLong
                ? "This list is long, so copy the addresses and paste them into the BCC box of a new email. Then copy your subject and message."
                : "Your email program opens with everyone on BCC, so volunteers do not see each other's addresses. Check it, then press Send."}
            </p>
            <details className="chart-table">
              <summary>See who will get it</summary>
              <ul>
                {recipients.map((c) => (
                  <li key={c.id}>
                    {c.name} ({c.email})
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
