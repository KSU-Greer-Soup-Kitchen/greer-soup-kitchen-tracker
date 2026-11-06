import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { shortDate } from "../../../../../lib/format";
import { personTitle, STEP_SECTIONS, stepFieldName, type StepField } from "../../../../../lib/step";
import { getStepApplication } from "../../../../../lib/staff-data";
import { deleteStepApplication } from "../../../actions";
import { PageHead, StatusPill } from "../../bits";
import { ConfirmButton, PrintButton, RequestForm } from "../../StaffForms";

export const metadata = { title: "STEP Application" };

function longDate(value: string): string {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function Answer({ field, value }: { field: StepField; value: string | undefined }) {
  if (!value) return <span className="muted">Not answered</span>;
  switch (field.kind) {
    case "yesno":
      return <>{value === "yes" ? "Yes" : "No"}</>;
    case "agree":
      return <>Yes</>;
    case "date":
      return <>{longDate(value)}</>;
    case "money":
      return <>${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}</>;
    case "ssn":
      // Hidden until a staff member asks to see it
      return (
        <details>
          <summary>Ends in {value.slice(-4)} (show)</summary>
          {value}
        </details>
      );
    default:
      return <span style={{ whiteSpace: "pre-wrap" }}>{value}</span>;
  }
}

function Answers({ fields, answers, each, n }: { fields: StepField[]; answers: Record<string, string>; each?: "adult" | "child"; n?: number }) {
  return (
    <dl className="details-list">
      {fields.map((field) => {
        const value = answers[stepFieldName(field, each, n)];
        // Leave out blank optional rows (like unused income or debt lines)
        if (!value && field.optional) return null;
        return (
          <Fragment key={field.name}>
            <dt>{field.staffLabel ?? field.label}</dt>
            <dd>
              <Answer field={field} value={value} />
            </dd>
          </Fragment>
        );
      })}
    </dl>
  );
}

export default async function StepApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getStepApplication(id);
  if (!found) notFound();
  const { row, answers } = found;

  return (
    <>
      <p>
        <Link href="/staff/step">Back to all STEP applications</Link>
      </p>
      <PageHead
        title={row.applicant_name}
        intro={`Sent on ${shortDate(row.created_at)}. ${row.adult_count} ${row.adult_count === 1 ? "adult" : "adults"}, ${row.child_count} ${row.child_count === 1 ? "child" : "children"}.`}
      >
        <StatusPill status={row.status} />
        <PrintButton />
      </PageHead>

      <section className="panel" aria-labelledby="status-heading">
        <h2 id="status-heading" style={{ fontSize: "1.3rem" }}>
          Status and notes
        </h2>
        <RequestForm kind="step" id={row.id} status={row.status} notes={row.staff_notes} />
      </section>

      {!answers ? (
        <p className="alert alert-error">
          The answers on this application can&apos;t be opened. The STEP_APPLICATION_KEY setting may have changed. Please contact the tech team.
        </p>
      ) : (
        STEP_SECTIONS.map((section) => {
          const people = section.each === "adult" ? answers.adultCount : section.each === "child" ? answers.childCount : 0;
          const empty = !section.fields && people === 0;
          const nothing = section.fields && !section.each && section.fields.every((f) => !answers.answers[f.name]);
          return (
            <section className="panel" key={section.id} aria-labelledby={`sec-${section.id}`}>
              <h2 id={`sec-${section.id}`} style={{ fontSize: "1.3rem" }}>
                {section.title}
              </h2>
              {empty || nothing ? (
                <p className="muted">None listed.</p>
              ) : (
                <>
                  {section.fields && <Answers fields={section.fields} answers={answers.answers} />}
                  {section.each &&
                    Array.from({ length: people }, (_, i) => (
                      <div className="step-person" key={i}>
                        <h3>{personTitle(section.each!, i + 1).replace(" (you)", "")}</h3>
                        <Answers fields={section.eachFields ?? []} answers={answers.answers} each={section.each} n={i + 1} />
                      </div>
                    ))}
                  {section.id === "sign" && <p className="muted">Signed on {longDate(answers.signedOn)}.</p>}
                </>
              )}
            </section>
          );
        })
      )}

      <section className="panel" aria-labelledby="delete-heading">
        <h2 id="delete-heading" style={{ fontSize: "1.3rem" }}>
          Delete this application
        </h2>
        <p className="muted">When you no longer need it, delete it so these private details are not kept longer than needed.</p>
        <ConfirmButton
          action={deleteStepApplication}
          fields={{ id: row.id }}
          question={`Delete the application from ${row.applicant_name}? Every answer will be gone for good.`}
        >
          Delete application
        </ConfirmButton>
      </section>
    </>
  );
}
