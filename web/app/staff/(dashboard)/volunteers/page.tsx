import Link from "next/link";
import { hours, shortDate, today } from "../../../../lib/format";
import { AVAILABILITY, labelFor, SKILLS } from "../../../../lib/options";
import { fullName, listRecentShifts, listVolunteers } from "../../../../lib/staff-data";
import { deleteShift, setVolunteerActive } from "../../actions";
import { PageHead, PersonLink } from "../bits";
import { ConfirmButton, LogHoursForm } from "../StaffForms";

export const metadata = { title: "Volunteers" };

export default async function VolunteersPage({ searchParams }: { searchParams: Promise<{ log?: string; show?: string }> }) {
  const { log, show } = await searchParams;
  const [volunteers, shifts] = await Promise.all([listVolunteers(), listRecentShifts()]);
  const activeCount = volunteers.filter((v) => v.active).length;
  const shown = show === "all" ? volunteers : volunteers.filter((v) => v.active);
  const choices = volunteers.filter((v) => v.active).map((v) => ({ id: v.person_id, label: fullName(v.people) }));

  return (
    <>
      <PageHead title="Volunteers" intro="Everyone who signed up on the volunteer form. Log their hours here so they count in the reports." />

      <details className="drawer" id="log" open={log === "1"}>
        <summary>Log volunteer hours</summary>
        <div className="drawer-body">
          {choices.length ? <LogHoursForm volunteers={choices} today={today()} /> : <p className="muted">No active volunteers yet.</p>}
        </div>
      </details>

      <nav className="filter-links" aria-label="Which volunteers">
        <Link href="/staff/volunteers" aria-current={show !== "all" ? "true" : undefined}>
          Active ({activeCount})
        </Link>
        <Link href="/staff/volunteers?show=all" aria-current={show === "all" ? "true" : undefined}>
          Everyone ({volunteers.length})
        </Link>
      </nav>

      <section className="panel" aria-labelledby="vol-list">
        <h2 id="vol-list" className="visually-hidden">
          Volunteer list
        </h2>
        {shown.length === 0 ? (
          <p className="empty">No volunteers yet. Sign-ups from the volunteer form will show here.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Can help</th>
                  <th scope="col" className="num">
                    This month
                  </th>
                  <th scope="col" className="num">
                    All time
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((v) => (
                  <tr key={v.person_id}>
                    <td>
                      <PersonLink person={v.people} />
                      <div className="muted small">Signed up {shortDate(v.created_at)}</div>
                    </td>
                    <td>
                      {v.people?.phone && <a href={`tel:${v.people.phone}`}>{v.people.phone}</a>}
                      {v.people?.email && (
                        <div>
                          <a href={`mailto:${v.people.email}`}>{v.people.email}</a>
                        </div>
                      )}
                    </td>
                    <td>
                      {v.availability.map((a) => (
                        <span className="tag" key={a}>
                          {labelFor(AVAILABILITY, a).replace(/ \(.*\)$/, "")}
                        </span>
                      ))}
                      {v.skills.length > 0 && <div className="muted small">{v.skills.map((s) => labelFor(SKILLS, s)).join(", ")}</div>}
                    </td>
                    <td className="num">{hours(v.hoursThisMonth)}</td>
                    <td className="num">{hours(v.hoursTotal)}</td>
                    <td>
                      <span className={`pill pill-${v.active ? "active" : "inactive"}`}>{v.active ? "Active" : "Not active"}</span>
                      <div style={{ marginTop: "0.5rem" }}>
                        <ConfirmButton
                          action={setVolunteerActive}
                          fields={{ person_id: v.person_id, active: String(!v.active) }}
                          question={v.active ? `Mark ${fullName(v.people)} as not active? They will stop getting volunteer emails.` : `Mark ${fullName(v.people)} as active again?`}
                          className="button button-small button-secondary"
                        >
                          {v.active ? "Mark not active" : "Mark active"}
                        </ConfirmButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="recent-shifts">
        <div className="panel-head">
          <h2 id="recent-shifts">Recently logged hours</h2>
        </div>
        {shifts.length === 0 ? (
          <p className="empty">No hours logged yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Volunteer</th>
                  <th scope="col" className="num">
                    Hours
                  </th>
                  <th scope="col">What they did</th>
                  <th scope="col">
                    <span className="visually-hidden">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td>{shortDate(s.shift_date)}</td>
                    <td>
                      <PersonLink person={s.people} />
                    </td>
                    <td className="num">{Number(s.hours)}</td>
                    <td>{s.task}</td>
                    <td>
                      <ConfirmButton action={deleteShift} fields={{ id: s.id }} question="Remove these hours? This cannot be undone.">
                        Remove
                      </ConfirmButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
