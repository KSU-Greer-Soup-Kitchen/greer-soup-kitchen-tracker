import { CONTACT_PREFS, GIVING_FREQUENCY, labelFor } from "../../../../lib/options";
import { money, shortDate } from "../../../../lib/format";
import { listDonors } from "../../../../lib/staff-data";
import { PageHead, PersonLink } from "../bits";

export const metadata = { title: "Donors" };

export default async function DonorsPage() {
  const donors = await listDonors();

  return (
    <>
      <PageHead title="Donors" intro="Everyone who filled out the donor form or has given. Click a name to see all of their gifts and details." />

      <section className="panel" aria-labelledby="donor-list">
        <div className="panel-head">
          <h2 id="donor-list">All donors</h2>
          <span className="muted">{donors.length} in all</span>
        </div>
        {donors.length === 0 ? (
          <p className="empty">No donors yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Age group</th>
                  <th scope="col">Prefers</th>
                  <th scope="col" className="num">
                    Total given
                  </th>
                  <th scope="col">Last gift</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <PersonLink person={d} />
                      {d.donor?.giving_frequency && <div className="muted small">{labelFor(GIVING_FREQUENCY, d.donor.giving_frequency)}</div>}
                    </td>
                    <td>
                      {d.email && <a href={`mailto:${d.email}`}>{d.email}</a>}
                      {d.phone && <div>{d.phone}</div>}
                      {d.city && <div className="muted small">{d.city}</div>}
                    </td>
                    <td>{d.age_group ?? <span className="muted">Not given</span>}</td>
                    <td>
                      {d.donor?.contact_prefs.length ? d.donor.contact_prefs.map((c) => labelFor(CONTACT_PREFS, c)).join(", ") : <span className="muted">Not given</span>}
                      {d.donor?.newsletter && <div className="muted small">Wants newsletter</div>}
                    </td>
                    <td className="num">
                      {money(d.total)}
                      <div className="muted small">
                        {d.giftCount} {d.giftCount === 1 ? "gift" : "gifts"}
                      </div>
                    </td>
                    <td>{d.lastGift ? shortDate(d.lastGift) : <span className="muted">None yet</span>}</td>
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
