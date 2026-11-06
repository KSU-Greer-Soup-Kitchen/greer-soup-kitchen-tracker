import Link from "next/link";
import { shortDate } from "../../../../lib/format";
import { REQUEST_STATUS } from "../../../../lib/options";
import { listStepApplications } from "../../../../lib/staff-data";
import { PageHead, StatusPill } from "../bits";

export const metadata = { title: "STEP Applications" };

export default async function StepApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = REQUEST_STATUS.some((s) => s.value === status) ? status : status === "all" ? undefined : "new";
  const applications = await listStepApplications(filter);

  const tabs = [...REQUEST_STATUS, { value: "all", label: "All" }];

  return (
    <>
      <PageHead title="STEP applications" intro="Family shelter applications sent from the website. Open one to read every answer.">
        <Link className="button button-secondary" href="/step-application">
          See the application form
        </Link>
      </PageHead>

      <nav className="filter-links" aria-label="Which applications">
        {tabs.map((t) => (
          <Link key={t.value} href={`/staff/step?status=${t.value}`} aria-current={(filter ?? "all") === t.value ? "true" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>

      <section className="panel" aria-labelledby="apps">
        <h2 id="apps" className="visually-hidden">
          Applications
        </h2>
        {applications.length === 0 ? (
          <p className="empty">{filter === "new" ? "No new applications." : "No applications here."}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Sent on</th>
                  <th scope="col">Name</th>
                  <th scope="col">Family</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>{shortDate(a.created_at)}</td>
                    <td>
                      <Link href={`/staff/step/${a.id}`}>{a.applicant_name}</Link>
                    </td>
                    <td>
                      {a.adult_count} {a.adult_count === 1 ? "adult" : "adults"}, {a.child_count} {a.child_count === 1 ? "child" : "children"}
                    </td>
                    <td>{a.phone ? <a href={`tel:${a.phone}`}>{a.phone}</a> : <span className="muted">Not given</span>}</td>
                    <td>
                      <StatusPill status={a.status} />
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
