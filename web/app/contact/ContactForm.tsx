"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CONTACT_TOPICS } from "../../lib/options";
import { initialFormState } from "../../lib/validate";
import { submitContactForm } from "../form-actions";
import { ErrorSummary, RobotTrap, SelectField, SubmitButton, SuccessPanel, TextField } from "../components/fields";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactForm, initialFormState);

  if (state.status === "success") {
    return (
      <SuccessPanel title="Thank you. We got your message.">
        <p>We will get back to you soon.</p>
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

      <TextField name="name" label="Your name" autoComplete="name" {...f} />
      <p className="hint">Give us at least one way to answer you: an email address or a phone number.</p>
      <TextField name="email" label="Email address" type="email" autoComplete="email" {...f} />
      <TextField name="phone" label="Phone number" type="tel" autoComplete="tel" optional {...f} />
      <SelectField name="topic" label="Who is your message for?" options={CONTACT_TOPICS} {...f} />
      <TextField name="message" label="Your message" multiline {...f} />

      <SubmitButton pending={pending}>Send my message</SubmitButton>
    </form>
  );
}
