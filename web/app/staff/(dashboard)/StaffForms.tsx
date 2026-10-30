"use client";

// Staff forms: record a gift, log hours, update a help request, edit contact details.

import { useActionState, useEffect, useState } from "react";
import { AGE_GROUPS, MANUAL_PAYMENT_METHODS, REQUEST_STATUS, type Option } from "../../../lib/options";
import { initialFormState, type FormState } from "../../../lib/validate";
import { addGift, logHours, updatePerson, updateRequest } from "../actions";
import { ErrorSummary, SelectField, SubmitButton, TextField } from "../../components/fields";

type PersonChoice = { id: string; label: string };

function Saved({ state, text }: { state: FormState; text: string }) {
  if (state.status !== "success") return null;
  return (
    <p className="alert alert-success" role="status">
      {text}
    </p>
  );
}

function DateField({ name, label, errors, values, fallback }: { name: string; label: string; errors: Record<string, string>; values: FormState["values"]; fallback: string }) {
  const id = `f-${name}`;
  const value = typeof values[name] === "string" ? (values[name] as string) : fallback;
  return (
    <div className={`field${errors[name] ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} type="date" defaultValue={value} aria-invalid={!!errors[name]} />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );
}

export function AddGiftForm({ people, today }: { people: PersonChoice[]; today: string }) {
  const [state, action, pending] = useActionState(addGift, initialFormState);
  const [who, setWho] = useState("");
  const [tribute, setTribute] = useState("");
  // Start fresh after a gift is saved
  useEffect(() => {
    if (state.status === "success") {
      setWho("");
      setTribute("");
    }
  }, [state.status, state.attempt]);
  const f = { errors: state.errors, values: state.values };
  const chosenWho = who || (typeof state.values.person_id === "string" ? state.values.person_id : "");
  const chosenTribute = tribute || (typeof state.values.tribute_type === "string" ? state.values.tribute_type : "");
  const options: Option[] = [{ value: "new", label: "Someone new (type their name below)" }, ...people.map((p) => ({ value: p.id, label: p.label }))];

  return (
    <form action={action} noValidate key={state.attempt}>
      <Saved state={state} text="Gift saved. It now shows in the list below and in the reports." />
      <ErrorSummary state={state} />
      <div className="field">
        <label htmlFor="f-person_id">Who gave it?</label>
        <span className="hint">Pick them from the list. If they are not there, choose &quot;Someone new&quot;.</span>
        <select id="f-person_id" name="person_id" defaultValue={chosenWho} onChange={(e) => setWho(e.target.value)} aria-invalid={!!state.errors.person_id}>
          <option value="">Choose one</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {state.errors.person_id && <p className="field-error">{state.errors.person_id}</p>}
      </div>
      {chosenWho === "new" && (
        <>
          <div className="field-pair">
            <TextField name="first_name" label="First name" {...f} />
            <TextField name="last_name" label="Last name" {...f} />
          </div>
          <TextField name="email" label="Email address" type="email" optional hint="Adding it links this gift to their other records." {...f} />
        </>
      )}
      <div className="field-pair">
        <TextField name="amount" label="Amount ($)" inputMode="decimal" {...f} />
        <DateField name="donated_on" label="Date of gift" fallback={today} {...f} />
      </div>
      <SelectField name="payment_method" label="How was it paid?" options={MANUAL_PAYMENT_METHODS} {...f} />
      <div className="field">
        <label htmlFor="f-tribute_type">
          In honor or memory of someone? <span className="optional">(optional)</span>
        </label>
        <select id="f-tribute_type" name="tribute_type" defaultValue={chosenTribute} onChange={(e) => setTribute(e.target.value)}>
          <option value="">No</option>
          <option value="honor">In honor of</option>
          <option value="memory">In memory of</option>
        </select>
      </div>
      {chosenTribute && <TextField name="tribute_name" label="Their name" {...f} />}
      <TextField name="notes" label="Note" hint="For example, a check number." optional {...f} />
      <SubmitButton pending={pending} pendingText="Saving...">
        Save gift
      </SubmitButton>
    </form>
  );
}

export function LogHoursForm({ volunteers, today }: { volunteers: PersonChoice[]; today: string }) {
  const [state, action, pending] = useActionState(logHours, initialFormState);
  const f = { errors: state.errors, values: state.values };
  return (
    <form action={action} noValidate key={state.attempt}>
      <Saved state={state} text="Hours saved." />
      <ErrorSummary state={state} />
      <SelectField name="person_id" label="Volunteer" options={volunteers.map((v) => ({ value: v.id, label: v.label }))} {...f} />
      <div className="field-pair">
        <DateField name="shift_date" label="Date they helped" fallback={today} {...f} />
        <TextField name="hours" label="Hours" inputMode="decimal" hint="Like 3 or 2.5" {...f} />
      </div>
      <TextField name="task" label="What they did" hint="For example, served lunch." optional {...f} />
      <SubmitButton pending={pending} pendingText="Saving...">
        Save hours
      </SubmitButton>
    </form>
  );
}

export function RequestForm({ id, status, notes }: { id: string; status: string; notes: string | null }) {
  const [state, action, pending] = useActionState(updateRequest, initialFormState);
  const values = state.status === "error" ? state.values : { status, staff_notes: notes ?? "" };
  return (
    <form action={action} noValidate key={state.attempt}>
      <input type="hidden" name="id" value={id} />
      <Saved state={state} text="Saved." />
      <ErrorSummary state={state} />
      <SelectField name="status" label="Status" options={REQUEST_STATUS} errors={state.errors} values={values} placeholder="Choose one" idSuffix={`-${id}`} />
      <TextField name="staff_notes" label="Staff notes" hint="Only staff can see these." multiline optional errors={state.errors} values={values} idSuffix={`-${id}`} />
      <button type="submit" className="button" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

export function PersonForm({ person }: { person: Record<string, string | null> & { id: string } }) {
  const [state, action, pending] = useActionState(updatePerson, initialFormState);
  const base: FormState["values"] = {};
  for (const [k, v] of Object.entries(person)) base[k] = v ?? "";
  const values = state.status === "error" ? state.values : base;
  const f = { errors: state.errors, values };
  return (
    <form action={action} noValidate key={state.attempt}>
      <input type="hidden" name="id" value={person.id} />
      <Saved state={state} text="Contact details saved." />
      <ErrorSummary state={state} />
      <div className="field-pair">
        <TextField name="first_name" label="First name" {...f} />
        <TextField name="last_name" label="Last name" {...f} />
      </div>
      <TextField name="email" label="Email address" type="email" {...f} />
      <TextField name="phone" label="Phone number" type="tel" {...f} />
      <TextField name="address" label="Mailing address" {...f} />
      <div className="field-pair">
        <TextField name="city" label="Town or city" {...f} />
        <SelectField name="age_group" label="Age group" options={AGE_GROUPS} placeholder="Not given" {...f} />
      </div>
      <SubmitButton pending={pending} pendingText="Saving...">
        Save contact details
      </SubmitButton>
    </form>
  );
}

// A button that asks "Are you sure?" before it runs
export function ConfirmButton({
  action,
  fields,
  question,
  children,
  className = "button button-small button-danger",
}: {
  action: (form: FormData) => Promise<void>;
  fields: Record<string, string>;
  question: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(question)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
