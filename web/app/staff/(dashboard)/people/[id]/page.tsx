import Link from "next/link";
import { notFound } from "next/navigation";
import { hours, money, shortDate } from "../../../../../lib/format";
import { AVAILABILITY, CONTACT_PREFS, GIVING_FREQUENCY, labelFor, SKILLS } from "../../../../../lib/options";
import { fullName, getPerson } from "../../../../../lib/staff-data";
import { needLabel, PaidWith, StatusPill, Tribute } from "../../bits";
import { PersonForm } from "../../StaffForms";

export const metadata = { title: "Person" };

// One person's whole record: every form and gift linked by their email (FR-5)
export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getPerson(id);
  if (!record) notFound();
  const { person, volunteer, donor, donations, shifts, requests } = record;
  const given = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const worked = shifts.reduce((sum, s) => sum + Number(s.hours), 0);
  const roles = [volunteer && "Volunteer", (donor || donations.length > 0) && "Donor", requests.length > 0 && "Asked for help"].filter(Boolean);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{fullName(person)}</h1>
          <p className="muted">
            {roles.join(" · ") || "No forms yet"} · In our records since {shortDate(person.created_at)}
          </p>
        </div>
      </div>

      <section className="stat-row" aria-label="Summary">
        <div className="stat">
          <span className="stat-number">{money(given)}</span>
          <span className="stat-label">
            Given ({donations.length} {donations.length === 1 ? "gift" : "gifts"})
          </span>
        </div>
        <div className="stat">
          <span className="stat-number">{Number(worked.toFixed(2))}</span>
          <span className="stat-label">Volunteer hours</span>
        </div>
        <div className="stat">
          <span className="stat-number">{requests.length}</span>
          <span className="stat-label">Help requests</span>
        </div>
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="contact">
          <h2 id="contact" style={{ fontSize: "1.3rem" }}>
            Contact details
          </h2>
          <PersonForm
            person={{
              id: person.id,
              first_name: person.first_name,
              last_name: person.last_name,
              email: person.email,
              phone: person.phone,
              address: person.address,
              city: person.city,
              age_group: person.age_group,
            }}
          />
        </section>

        <div style={{ display: "grid", gap: "1.75rem" }}>
          {volunteer && (
            <section className="panel" aria-labelledby="vol">
              <div className="panel-head">
                <h2 id="vol">Volunteer</h2>
                <span className={`pill pill-${volunteer.active ? "active" : "inactive"}`}>{volunteer.active ? "Active" : "Not active"}</span>
              </div>
              <dl className="details-list">
                <dt>Signed up</dt>
                <dd>{shortDate(volunteer.created_at)}</dd>
                <dt>Can help</dt>
                <dd>{volunteer.availability.map((a) => labelFor(AVAILABILITY, a)).join("; ") || "Not given"}</dd>
                <dt>Interests</dt>
                <dd>{volunteer.skills.map((s) => labelFor(SKILLS, s)).join(", ") || "Not given"}</dd>
                {volunteer.notes && (
                  <>
                    <dt>They wrote</dt>
                    <dd style={{ whiteSpace: "pre-wrap" }}>{volunteer.notes}</dd>
                  </>
                )}
              </dl>
            </section>
          )}

          {donor && (
            <section className="panel" aria-labelledby="donor">
              <h2 id="donor" style={{ fontSize: "1.3rem" }}>
                Donor form answers
              </h2>
              <dl className="details-list">
                <dt>Gives</dt>
                <dd>{labelFor(GIVING_FREQUENCY, donor.giving_frequency) || "Not given"}</dd>
                <dt>Contact by</dt>
                <dd>{donor.contact_prefs.map((c) => labelFor(CONTACT_PREFS, c)).join(", ") || "Not given"}</dd>
                <dt>Newsletter</dt>
                <dd>{donor.newsletter === null ? "Not given" : donor.newsletter ? "Yes" : "No"}</dd>
                <dt>Heard about us</dt>
                <dd>{donor.heard_from ?? "Not given"}</dd>
                {donor.tribute_type && (
                  <>
                    <dt>Gift tribute</dt>
                    <dd>
                      <Tribute type={donor.tribute_type} name={donor.tribute_name} />
                    </dd>
                  </>
                )}
              </dl>
            </section>
          )}
        </div>
      </div>

      <section className="panel" style={{ marginTop: "1.75rem" }} aria-labelledby="gifts">
        <h2 id="gifts" style={{ fontSize: "1.3rem" }}>
          Gifts
        </h2>
        {donations.length === 0 ? (
          <p className="empty">No gifts yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col" className="num">
                    Amount
                  </th>
                  <th scope="col">How paid</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td>{shortDate(d.donated_at)}</td>
                    <td className="num">{money(Number(d.amount))}</td>
                    <td>
                      <PaidWith method={d.payment_method} source={d.source} />
                    </td>
                    <td>
                      <Tribute type={d.tribute_type} name={d.tribute_name} /> {d.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(volunteer || shifts.length > 0) && (
        <section className="panel" aria-labelledby="hours">
          <div className="panel-head">
            <h2 id="hours">Volunteer hours</h2>
            <Link href="/staff/volunteers?log=1">Log hours</Link>
          </div>
          {shifts.length === 0 ? (
            <p className="empty">No hours logged yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col" className="num">
                      Hours
                    </th>
                    <th scope="col">What they did</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s) => (
                    <tr key={s.id}>
                      <td>{shortDate(s.shift_date)}</td>
                      <td className="num">{hours(Number(s.hours))}</td>
                      <td>{s.task}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {requests.length > 0 && (
        <section className="panel" aria-labelledby="reqs">
          <div className="panel-head">
            <h2 id="reqs">Help requests</h2>
            <Link href="/staff/help?status=all">Go to help requests</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Needs</th>
                  <th scope="col">Status</th>
                  <th scope="col">Staff notes</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{shortDate(r.created_at)}</td>
                    <td>{needLabel(r.need)}</td>
                    <td>
                      <StatusPill status={r.status} />
                    </td>
                    <td>{r.staff_notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
