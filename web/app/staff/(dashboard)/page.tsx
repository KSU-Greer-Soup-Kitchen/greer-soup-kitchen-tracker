import Link from "next/link";
import { money, shortDate } from "../../../lib/format";
import { getOverview } from "../../../lib/staff-data";
import { needLabel, PageHead, PaidWith, PersonLink } from "./bits";

export const metadata = { title: "Staff Dashboard" };

export default async function OverviewPage() {
  const o = await getOverview();
  const monthName = new Date().toLocaleDateString("en-US", { month: "long", timeZone: "America/New_York" });

  return (
    <>
      <PageHead title="Welcome back" intro={`Here is what is happening at the Soup Kitchen and STEP in ${monthName}.`} />

      <section className="stat-row" aria-label="This month at a glance">
        <Link className={`stat${o.newRequests.length ? " stat-attention" : ""}`} href="/staff/help">
          <span className="stat-number">{o.newRequests.length}</span>
          <span className="stat-label">New help requests</span>
        </Link>
        <Link className="stat" href="/staff/donations">
          <span className="stat-number">{money(o.givenThisMonth, true)}</span>
          <span className="stat-label">
            Given in {monthName} ({o.giftsThisMonth} {o.giftsThisMonth === 1 ? "gift" : "gifts"})
          </span>
        </Link>
        <Link className="stat" href="/staff/volunteers">
          <span className="stat-number">{Number(o.hoursThisMonth.toFixed(1))}</span>
          <span className="stat-label">Volunteer hours in {monthName}</span>
        </Link>
        <Link className="stat" href="/staff/volunteers">
          <span className="stat-number">{o.activeVolunteers}</span>
          <span className="stat-label">Active volunteers</span>
        </Link>
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="new-help">
          <div className="panel-head">
            <h2 id="new-help">New help requests</h2>
            <Link href="/staff/help">See all</Link>
          </div>
          {o.newRequests.length === 0 ? (
            <p className="empty">No new requests. Everyone has been contacted.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Needs</th>
                    <th scope="col">Reach them</th>
                  </tr>
                </thead>
                <tbody>
                  {o.newRequests.slice(0, 6).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <PersonLink person={r.people} />
                        <br />
                        <span className="muted small">{shortDate(r.created_at)}</span>
                      </td>
                      <td>{needLabel(r.need)}</td>
                      <td>
                        {r.people?.phone && <a href={`tel:${r.people.phone}`}>{r.people.phone}</a>}
                        {r.people?.phone && r.people?.email && <br />}
                        {r.people?.email && <a href={`mailto:${r.people.email}`}>{r.people.email}</a>}
                        {r.best_time && <div className="muted small">Best time: {r.best_time}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="recent-gifts">
          <div className="panel-head">
            <h2 id="recent-gifts">Latest gifts</h2>
            <Link href="/staff/donations">See all</Link>
          </div>
          {o.recentDonations.length === 0 ? (
            <p className="empty">No gifts yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Donor</th>
                    <th scope="col" className="num">
                      Amount
                    </th>
                    <th scope="col">How</th>
                  </tr>
                </thead>
                <tbody>
                  {o.recentDonations.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <PersonLink person={d.people} />
                        <br />
                        <span className="muted small">{shortDate(d.donated_at)}</span>
                      </td>
                      <td className="num">{money(Number(d.amount))}</td>
                      <td>
                        <PaidWith method={d.payment_method} source={d.source} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: "1.75rem" }} aria-labelledby="quick">
        <h2 id="quick" style={{ fontSize: "1.3rem" }}>
          Quick tasks
        </h2>
        <div className="button-row">
          <Link className="button" href="/staff/donations?add=1">
            Record a cash or check gift
          </Link>
          <Link className="button" href="/staff/volunteers?log=1">
            Log volunteer hours
          </Link>
          <Link className="button button-secondary" href="/staff/email">
            Email volunteers
          </Link>
          <Link className="button button-secondary" href="/staff/reports">
            See reports
          </Link>
        </div>
      </section>
    </>
  );
}
