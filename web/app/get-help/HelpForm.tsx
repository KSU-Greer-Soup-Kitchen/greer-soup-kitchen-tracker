"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BEST_TIMES, NEEDS } from "../../lib/options";
import { initialFormState } from "../../lib/validate";
import { submitHelpForm } from "../form-actions";
import { ErrorSummary, RobotTrap, SelectField, SubmitButton, SuccessPanel, TextField } from "../components/fields";

export function HelpForm() {
  const [state, action, pending] = useActionState(submitHelpForm, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessPanel title="We got your request">
        <p>
          Someone from our team will contact you soon. If it is urgent, please call the Soup Kitchen at <a href="tel:+18649680323">864-968-0323</a> or
          STEP at <a href="tel:+18643345265">864-334-5265</a>.
        </p>
        <Link className="button" href="/">
          Back to home
        </Link>
      </SuccessPanel>
    );
  }

  const f = { errors: state.errors, values: state.values };
  return (
    <form className="form-card" action={action} noValidate key={state.attempt}>
      <ErrorSummary state={state} />
      <RobotTrap />

      <h2 className="form-section-title">About you</h2>
      <div className="field-pair">
        <TextField name="first_name" label="First name" autoComplete="given-name" {...f} />
        <TextField name="last_name" label="Last name" autoComplete="family-name" {...f} />
      </div>

      <h2 className="form-section-title">How can we reach you?</h2>
      <p className="hint">Give us at least one: a phone number or an email address.</p>
      <TextField name="phone" label="Phone number" type="tel" autoComplete="tel" {...f} />
      <TextField name="email" label="Email address" type="email" autoComplete="email" {...f} />
      <SelectField name="best_time" label="Best time to reach you" options={BEST_TIMES} placeholder="Any time" optional {...f} />

      <h2 className="form-section-title">What you need</h2>
      <SelectField name="need" label="What do you need help with?" options={NEEDS} {...f} />
      <TextField name="details" label="Tell us a little more" multiline optional {...f} />

      <SubmitButton pending={pending}>Send my request</SubmitButton>
    </form>
  );
}
