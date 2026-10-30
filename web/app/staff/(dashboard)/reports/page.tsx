import { money, shortDate } from "../../../../lib/format";
import { buildReports } from "../../../../lib/reports";
import { fullName, getReportData, listPeople } from "../../../../lib/staff-data";
import { PageHead } from "../bits";
import { Bars, MonthColumns } from "./Charts";

export const metadata = { title: "Reports" };

const asMoney = (n: number) => money(n, true);
const asHours = (n: number) => String(Number(n.toFixed(1)));
const asCount = (n: number) => String(n);

export default async function ReportsPage() {
  const [data, people] = await Promise.all([getReportData(), listPeople()]);
  const names = new Map(people.map((p) => [p.id, fullName(p)]));
  const r = buildReports(data.donations, data.shifts, data.donors, names);

  return (
    <>
      <PageHead title="Reports" intro={`Gifts, donors, and volunteer hours from ${shortDate(data.since)} to today.`}>
        <a className="button button-secondary" href="/staff/reports/gifts.csv">
          Download gifts (spreadsheet)
        </a>
      </PageHead>

      <section className="stat-row" aria-label="Last 12 months">
        <div className="stat">
          <span className="stat-number">{money(r.totalGiven, true)}</span>
          <span className="stat-label">Given in the last 12 months</span>
        </div>
        <div className="stat">
          <span className="stat-number">{money(r.averageGift)}</span>
          <span className="stat-label">Average gift ({r.giftCount} {r.giftCount === 1 ? "gift" : "gifts"})</span>
        </div>
        <div className="stat">
          <span className="stat-number">{asHours(r.totalHours)}</span>
          <span className="stat-label">Volunteer hours</span>
        </div>
        <div className="stat">
          <span className="stat-number">{data.donors.length}</span>
          <span className="stat-label">Donors on file</span>
        </div>
      </section>

      <section className="panel" aria-labelledby="trend">
        <div className="panel-head">
          <h2 id="trend">Gifts by month</h2>
          <span className="muted small">Point at a bar to see its amount</span>
        </div>
        <MonthColumns points={r.givenByMonth} unit="Given" format={asMoney} />
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="ages">
          <h2 id="ages" style={{ fontSize: "1.3rem" }}>
            Donor age groups
          </h2>
          <Bars points={r.donorAges} unit="Donors" format={asCount} empty="No donors yet." />
        </section>
        <section className="panel" aria-labelledby="methods">
          <h2 id="methods" style={{ fontSize: "1.3rem" }}>
            How gifts were paid
          </h2>
          <Bars points={r.givenByMethod} unit="Given" format={asMoney} empty="No gifts in the last 12 months." />
        </section>
      </div>

      <section className="panel" style={{ marginTop: "1.75rem" }} aria-labelledby="vol-hours">
        <div className="panel-head">
          <h2 id="vol-hours">Volunteer hours by month</h2>
          <span className="muted small">{r.volunteersWhoServed} {r.volunteersWhoServed === 1 ? "volunteer" : "volunteers"} served</span>
        </div>
        <MonthColumns points={r.hoursByMonth} unit="Hours" format={asHours} />
      </section>

      <section className="panel" aria-labelledby="top-vols">
        <h2 id="top-vols" style={{ fontSize: "1.3rem" }}>
          Most volunteer hours
        </h2>
        <Bars points={r.topVolunteers} unit="Hours" format={asHours} empty="No hours logged yet." />
      </section>
    </>
  );
}
