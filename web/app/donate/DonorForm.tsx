"use client";

import { useActionState, useState } from "react";
import { AGE_GROUPS, CONTACT_PREFS, GIVING_FREQUENCY, HEARD_FROM, TRIBUTE } from "../../lib/options";
import { initialFormState } from "../../lib/validate";
import { submitDonorForm } from "../form-actions";
import { ChoiceField, ErrorSummary, RobotTrap, SelectField, SubmitButton, SuccessPanel, TextField } from "../components/fields";

const NEWSLETTER = [
  { value: "yes", label: "Yes, please" },
  { value: "no", label: "No, thank you" },
];

export function DonorForm({ giveOnline }: { giveOnline: React.ReactNode }) {
  const [state, action, pending] = useActionState(submitDonorForm, initialFormState);
  const [tribute, setTribute] = useState("");
  const shownTribute = tribute || (typeof state.values.tribute === "string" ? state.values.tribute : "");

  if (state.status === "success") {
    return (
      <SuccessPanel title="Thank you!">
        <p>We got your information. If you would like to give online now, choose an amount below.</p>
        <div className="give-card" style={{ marginBottom: 0 }}>
          {giveOnline}
        </div>
      </SuccessPanel>
    );
  }

  const f = { errors: state.errors, values: state.values };
  return (
    <>
    <form className="form-card" action={action} noValidate key={state.attempt}>
      <ErrorSummary state={state} />
      <RobotTrap />

      <h2 className="form-section-title">About you</h2>
      <div className="field-pair">
        <TextField name="first_name" label="First name" autoComplete="given-name" {...f} />
        <TextField name="last_name" label="Last name" autoComplete="family-name" {...f} />
      </div>
      <TextField name="email" label="Email address" type="email" autoComplete="email" hint="Use the same email you give PayPal so we can match your gifts." {...f} />
      <TextField name="phone" label="Phone number" type="tel" autoComplete="tel" optional {...f} />
      <TextField
        name="address"
        label="Mailing address"
        autoComplete="street-address"
        hint="Needed if you want thank-you letters or the newsletter by mail."
        optional
        {...f}
      />
      <TextField name="city" label="Town or city you live in" autoComplete="address-level2" {...f} />
      <SelectField name="age_group" label="Age group" options={AGE_GROUPS} {...f} />

      <h2 className="form-section-title">Your giving</h2>
      <ChoiceField name="giving_frequency" label="How often do you give?" options={GIVING_FREQUENCY} {...f} />
      <ChoiceField name="tribute" label="Is your gift in honor or memory of someone?" options={TRIBUTE} optional onChange={setTribute} {...f} />
      {shownTribute && <TextField name="tribute_name" label="Their name" {...f} />}
      <SelectField name="heard_from" label="How did you hear about us?" options={HEARD_FROM} optional {...f} />

      <h2 className="form-section-title">Staying in touch</h2>
      <ChoiceField name="contact_prefs" label="How should we contact you?" hint="Pick all that are okay." options={CONTACT_PREFS} many optional {...f} />
      <ChoiceField name="newsletter" label="Would you like our quarterly newsletter?" options={NEWSLETTER} optional {...f} />

      <SubmitButton pending={pending}>Send donor form</SubmitButton>
    </form>

    <section className="section" aria-labelledby="give-heading">
      <div className="give-card" id="give">
        <h2 id="give-heading">Give online</h2>
        <p className="muted">Already sent us the form? You can give right here with PayPal, Venmo, or a card.</p>
        {giveOnline}
      </div>
      <div className="note">
        <p>
          <strong>Give by mail:</strong> make a check out to Daily Bread Ministries and mail it to PO Box 2344, Greer, SC 29652.
        </p>
      </div>
    </section>
    </>
  );
}
