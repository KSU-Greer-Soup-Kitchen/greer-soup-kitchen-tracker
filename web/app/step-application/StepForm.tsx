"use client";

// The STEP family shelter application. Every question comes from lib/step.ts.
// Adding an adult or child adds their questions to every part that asks about them.

import { useActionState, useState } from "react";
import { YES_NO } from "../../lib/options";
import { MAX_ADULTS, MAX_CHILDREN, personTitle, STEP_SECTIONS, stepFieldName, type StepField } from "../../lib/step";
import { initialFormState, type FormState } from "../../lib/validate";
import { submitStepApplication } from "../form-actions";
import { ChoiceField, ErrorSummary, RobotTrap, SubmitButton, SuccessPanel, TextField } from "../components/fields";

type Shared = { errors: FormState["errors"]; values: FormState["values"] };

function Question({ field, name, f }: { field: StepField; name: string; f: Shared }) {
  const common = { name, label: field.label, hint: field.hint, optional: field.optional, ...f };
  switch (field.kind) {
    case "yesno":
      return <ChoiceField {...common} options={YES_NO} />;
    case "agree":
      return <ChoiceField {...common} label="Your promise" hint={undefined} options={[{ value: "yes", label: field.label }]} many />;
    case "long":
      return <TextField {...common} multiline />;
    case "date":
      return <TextField {...common} type="date" />;
    case "tel":
      return <TextField {...common} type="tel" />;
    case "email":
      return <TextField {...common} type="email" />;
    case "ssn":
      return <TextField {...common} inputMode="numeric" autoComplete="off" hint={field.hint ?? "9 digits, like 123-45-6789"} />;
    case "money":
      return <TextField {...common} inputMode="decimal" />;
    default:
      return <TextField {...common} />;
  }
}

// Puts side-by-side questions in pairs; the rest take the full width
function Questions({ fields, each, n, f }: { fields: StepField[]; each?: "adult" | "child"; n?: number; f: Shared }) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const next = fields[i + 1];
    if (field.half && next?.half) {
      out.push(
        <div className="field-pair" key={field.name}>
          <Question field={field} name={stepFieldName(field, each, n)} f={f} />
          <Question field={next} name={stepFieldName(next, each, n)} f={f} />
        </div>,
      );
      i++;
    } else {
      out.push(<Question key={field.name} field={field} name={stepFieldName(field, each, n)} f={f} />);
    }
  }
  return <>{out}</>;
}

export function StepForm() {
  const [state, action, pending] = useActionState(submitStepApplication, initialFormState);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  if (state.status === "success") {
    return (
      <SuccessPanel title="Thank you. We got your application.">
        <p>
          Someone from Greer STEP will call you. If you have questions, call STEP at <a href="tel:+18643345265">864-334-5265</a>.
        </p>
      </SuccessPanel>
    );
  }

  const f = { errors: state.errors, values: state.values };
  const total = STEP_SECTIONS.length;

  return (
    <form className="form-card" action={action} noValidate key={state.attempt}>
      <ErrorSummary state={state} />
      <RobotTrap />
      <input type="hidden" name="adult_count" value={adults} />
      <input type="hidden" name="child_count" value={children} />

      {STEP_SECTIONS.map((section, index) => {
        const people = section.each === "adult" ? adults : section.each === "child" ? children : 0;
        return (
          <section key={section.id} aria-labelledby={`part-${section.id}`} className="step-part">
            <h2 className="form-section-title" id={`part-${section.id}`}>
              <span className="muted small">
                Part {index + 1} of {total}
              </span>
              <br />
              {section.title}
            </h2>
            {section.intro && <p className="hint">{section.intro}</p>}
            {section.fields && <Questions fields={section.fields} f={f} />}

            {section.each &&
              Array.from({ length: people }, (_, i) => (
                <div className="step-person" key={i}>
                  <h3>{personTitle(section.each!, i + 1)}</h3>
                  <Questions fields={section.eachFields ?? []} each={section.each} n={i + 1} f={f} />
                </div>
              ))}

            {section.id === "who" && (
              <div className="button-row step-add">
                {adults < MAX_ADULTS && (
                  <button type="button" className="button button-secondary" onClick={() => setAdults(adults + 1)}>
                    Add another adult
                  </button>
                )}
                {adults > 1 && (
                  <button type="button" className="button button-secondary" onClick={() => setAdults(adults - 1)}>
                    Remove Adult {adults}
                  </button>
                )}
              </div>
            )}
            {section.id === "children" && (
              <>
                {children === 0 && <p className="muted">No children added. If no children live with you, skip this part.</p>}
                <div className="button-row step-add">
                  {children < MAX_CHILDREN && (
                    <button type="button" className="button button-secondary" onClick={() => setChildren(children + 1)}>
                      {children === 0 ? "Add a child" : "Add another child"}
                    </button>
                  )}
                  {children > 0 && (
                    <button type="button" className="button button-secondary" onClick={() => setChildren(children - 1)}>
                      Remove Child {children}
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        );
      })}

      <SubmitButton pending={pending}>Send my application</SubmitButton>
    </form>
  );
}
