"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AGE_GROUPS, AVAILABILITY, SKILLS, VOLUNTEER_PROGRAMS, type Option } from "../../lib/options";
import { initialFormState } from "../../lib/validate";
import { submitVolunteerForm } from "../form-actions";
import { ChoiceField, ErrorSummary, RobotTrap, SelectField, SubmitButton, SuccessPanel, TextField } from "../components/fields";

// "2026-11-07" -> "Saturday, November 7, 2026". Noon keeps it from shifting a day in any time zone.
function dateLabel(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// weekendDates is null when the dates could not be loaded
export function VolunteerForm({ weekendDates }: { weekendDates: string[] | null }) {
  const [state, action, pending] = useActionState(submitVolunteerForm, initialFormState);
  // Which choice is picked, so the weekend group questions show only when needed.
  // It lives outside the <form>, so it survives the form redrawing after a mistake.
  const [program, setProgram] = useState("");
  const isGroup = program === "weekend_group";

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

  const dateOptions: Option[] = (weekendDates ?? []).map((d) => ({ value: d, label: dateLabel(d) }));
  const f = { errors: state.errors, values: state.values };
  return (
    // The key makes the form redraw with what the person typed after a mistake
    <form className="form-card" action={action} noValidate key={state.attempt}>
      <ErrorSummary state={state} />
      <RobotTrap />

      <SelectField name="program" label="Where would you like to volunteer?" options={VOLUNTEER_PROGRAMS} onChange={setProgram} {...f} />

      {isGroup && (
        <>
          <h2 className="form-section-title">Your group</h2>
          <TextField name="group_name" label="Group name" hint="For example, your church, school, club, or company." {...f} />
          {dateOptions.length > 0 ? (
            <SelectField name="weekend_date" label="Which weekend date would your group like?" options={dateOptions} placeholder="Choose a date" {...f} />
          ) : (
            <p className="field-error" role="status">
              {weekendDates === null
                ? "We could not load the open weekend dates. Please refresh the page, or call us at 864-968-0323."
                : "There are no open weekend dates right now. Please call us at 864-968-0323 to plan a group visit."}
            </p>
          )}
          <TextField name="group_size" label="How many people are coming?" inputMode="numeric" optional {...f} />
        </>
      )}

      <h2 className="form-section-title">{isGroup ? "Group leader" : "About you"}</h2>
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
      {!isGroup && (
        <ChoiceField name="availability" label="When can you help?" hint="Pick all that work for you." options={AVAILABILITY} many {...f} />
      )}
      <ChoiceField name="skills" label="What would you like to help with?" options={SKILLS} many optional {...f} />
      <TextField
        name="notes"
        label="Anything else we should know?"
        hint={isGroup ? "Anything about your group we should plan for." : "Other skills, a group you are coming with, or times that do not fit above."}
        multiline
        optional
        {...f}
      />

      <SubmitButton pending={pending}>Send my sign-up</SubmitButton>
    </form>
  );
}
