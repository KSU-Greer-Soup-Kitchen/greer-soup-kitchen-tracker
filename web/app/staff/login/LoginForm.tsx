"use client";

import { useActionState } from "react";
import { initialFormState } from "../../../lib/validate";
import { logIn } from "../actions";
import { ErrorSummary, SubmitButton, TextField } from "../../components/fields";

export function LoginForm() {
  const [state, action, pending] = useActionState(logIn, initialFormState);
  const f = { errors: state.errors, values: state.values };
  return (
    <form className="form-card" action={action} noValidate key={state.attempt}>
      <h1 style={{ fontSize: "1.7rem" }}>Staff login</h1>
      <p className="muted">For Daily Bread Ministries staff only.</p>
      <ErrorSummary state={state} />
      <TextField name="email" label="Email address" type="email" autoComplete="username" {...f} />
      <TextField name="password" label="Password" type="password" autoComplete="current-password" {...f} />
      <SubmitButton pending={pending} pendingText="Logging in...">
        Log in
      </SubmitButton>
      <p className="small muted" style={{ marginTop: "1.25rem", marginBottom: 0 }}>
        Forgot your password or need an account? Ask the person who manages the website to set one up for you.
      </p>
    </form>
  );
}
