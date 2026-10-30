import { money, shortDate, today } from "../../../../lib/format";
import { fullName, listDonations, listPeople } from "../../../../lib/staff-data";
import { deleteGift } from "../../actions";
import { PageHead, PaidWith, PersonLink, Tribute } from "../bits";
import { AddGiftForm, ConfirmButton } from "../StaffForms";

export const metadata = { title: "Gifts" };

export default async function DonationsPage({ searchParams }: { searchParams: Promise<{ add?: string }> }) {
  const { add } = await searchParams;
  const [donations, people] = await Promise.all([listDonations(), listPeople()]);
  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const choices = people.map((p) => ({ id: p.id, label: p.email ? `${fullName(p)} (${p.email})` : fullName(p) }));

  return (
    <>
      <PageHead title="Gifts" intro="Every gift, newest first. PayPal gifts are added on their own. Type in cash and check gifts below." />

      <details className="drawer" id="add" open={add === "1"}>
        <summary>Record a cash, check, or Venmo gift</summary>
        <div className="drawer-body">
          <AddGiftForm people={choices} today={today()} />
        </div>
      </details>

      <section className="panel" aria-labelledby="all-gifts">
        <div className="panel-head">
          <h2 id="all-gifts">All gifts</h2>
          <span className="muted">
            {donations.length} {donations.length === 1 ? "gift" : "gifts"}, {money(total)} in all
          </span>
        </div>
        {donations.length === 0 ? (
          <p className="empty">No gifts yet. PayPal gifts will show here on their own.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Donor</th>
                  <th scope="col" className="num">
                    Amount
                  </th>
                  <th scope="col">How paid</th>
                  <th scope="col">Note</th>
                  <th scope="col">
                    <span className="visually-hidden">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td>{shortDate(d.donated_at)}</td>
                    <td>
                      <PersonLink person={d.people} />
                    </td>
                    <td className="num">{money(Number(d.amount))}</td>
                    <td>
                      <PaidWith method={d.payment_method} source={d.source} />
                      <div className="muted small">{d.source === "paypal" ? "Added by PayPal" : "Typed in by staff"}</div>
                    </td>
                    <td>
                      <Tribute type={d.tribute_type} name={d.tribute_name} />
                      {d.tribute_type && d.notes && <br />}
                      {d.notes}
                    </td>
                    <td>
                      {d.source === "manual" && (
                        <ConfirmButton action={deleteGift} fields={{ id: d.id }} question={`Remove this ${money(Number(d.amount))} gift? This cannot be undone.`}>
                          Remove
                        </ConfirmButton>
                      )}
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
