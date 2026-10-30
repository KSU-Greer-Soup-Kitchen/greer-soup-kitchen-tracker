"use server";

// What happens when someone sends one of the public forms
// Nothing is sent back to the browser except "saved" or the list of mistakes.
// After saving, the form is emailed to whoever handles it (see lib/notify.ts)

import { donorEmail, helpEmail, sendFormEmail, volunteerEmail, type Email } from "../lib/notify";
import { DateTakenError, findRecipient, saveDonor, saveHelpRequest, saveVolunteer } from "../lib/supabase";
import { formValues, readDonorForm, readHelpForm, readVolunteerForm, type FieldErrors, type FormState } from "../lib/validate";

const SAVE_FAILED: FieldErrors = {
  form: "Sorry, something went wrong and your form was not sent. Please try again, or call us at 864-968-0323.",
};

const DATE_TAKEN: FieldErrors = {
  weekend_date: "Another group just took that weekend date. Please choose a different date.",
};

async function handle<T>(
  prev: FormState,
  form: FormData,
  read: (form: FormData) => { input: T; errors: FieldErrors },
  save: (input: T) => Promise<void>,
  email: (input: T) => Email,
): Promise<FormState> {
  const attempt = prev.attempt + 1;
  // Robots fill in the hidden "website" box. Act as if it worked, but save nothing.
  if (form.get("website")) {
    return { status: "success", errors: {}, values: {}, attempt };
  }
  const { input, errors } = read(form);
  if (Object.keys(errors).length > 0) {
    return { status: "error", errors, values: formValues(form), attempt };
  }
  try {
    await save(input);
  } catch (err) {
    if (err instanceof DateTakenError) {
      return { status: "error", errors: DATE_TAKEN, values: formValues(form), attempt };
    }
    console.error("Form save failed:", err instanceof Error ? err.message : err);
    return { status: "error", errors: SAVE_FAILED, values: formValues(form), attempt };
  }
  // Never throws: a failed email is logged, and the form is already saved
  await sendFormEmail(email(input), findRecipient);
  return { status: "success", errors: {}, values: {}, attempt };
}

export async function submitVolunteerForm(prev: FormState, form: FormData): Promise<FormState> {
  return handle(prev, form, (f) => readVolunteerForm(f), saveVolunteer, volunteerEmail);
}

export async function submitDonorForm(prev: FormState, form: FormData): Promise<FormState> {
  return handle(prev, form, readDonorForm, saveDonor, donorEmail);
}

export async function submitHelpForm(prev: FormState, form: FormData): Promise<FormState> {
  return handle(prev, form, readHelpForm, saveHelpRequest, helpEmail);
}
