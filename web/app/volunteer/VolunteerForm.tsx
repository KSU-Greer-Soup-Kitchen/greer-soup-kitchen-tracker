"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AGE_GROUPS, AVAILABILITY, SKILLS } from "../../lib/options";
import { initialFormState } from "../../lib/validate";
import { submitVolunteerForm } from "../form-actions";
import { ChoiceField, ErrorSummary, RobotTrap, SelectField, SubmitButton, SuccessPanel, TextField } from "../components/fields";

export function VolunteerForm() {
  const [state, action, pending] = useActionState(submitVolunteerForm, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessPanel title="Thank you for signing up!">
        <p>We got your information. Someone from our team will call or email you soon to set up your first day.</p>
        <Link className="button" href="/">
          Back to home
        </Link>
      </SuccessPanel>
    );
  }

  const f = { errors: state.errors, values: state.values };
  return (
    // The key makes the form redraw with what the person typed after a mistake
    <form className="form-card" action={action} noValidate key={state.attempt}>
      <ErrorSummary state={state} />
      <RobotTrap />

      <h2 className="form-section-title">About you</h2>
      <div className="field-pair">
        <TextField name="first_name" label="First name" autoComplete="given-name" {...f} />
        <TextField name="last_name" label="Last name" autoComplete="family-name" {...f} />
      </div>
      <TextField
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        hint="If you have given to us before, use the same email so we can keep your records together."
        {...f}
      />
      <TextField name="phone" label="Phone number" type="tel" autoComplete="tel" {...f} />
      <TextField name="address" label="Mailing address" autoComplete="street-address" optional {...f} />
      <SelectField name="age_group" label="Age group" options={AGE_GROUPS} optional {...f} />

      <h2 className="form-section-title">How you would like to help</h2>
      <ChoiceField name="availability" label="When can you help?" hint="Pick all that work for you." options={AVAILABILITY} many {...f} />
      <ChoiceField name="skills" label="What would you like to help with?" options={SKILLS} many optional {...f} />
      <TextField
        name="notes"
        label="Anything else we should know?"
        hint="Other skills, a group you are coming with, or times that do not fit above."
        multiline
        optional
        {...f}
      />

      <SubmitButton pending={pending}>Send my sign-up</SubmitButton>
    </form>
  );
}
