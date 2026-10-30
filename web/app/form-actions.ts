"use server";

// What happens when someone sends one of the public forms (FR-1, FR-2, FR-3).
// Nothing is sent back to the browser except "saved" or the list of mistakes.

import { saveDonor, saveHelpRequest, saveVolunteer } from "../lib/supabase";
import { formValues, readDonorForm, readHelpForm, readVolunteerForm, type FieldErrors, type FormState } from "../lib/validate";

const SAVE_FAILED: FieldErrors = {
  form: "Sorry, something went wrong and your form was not sent. Please try again, or call us at 864-968-0323.",
};

async function handle<T>(
  prev: FormState,
  form: FormData,
  read: (form: FormData) => { input: T; errors: FieldErrors },
  save: (input: T) => Promise<void>,
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
    console.error("Form save failed:", err instanceof Error ? err.message : err);
    return { status: "error", errors: SAVE_FAILED, values: formValues(form), attempt };
  }
  return { status: "success", errors: {}, values: {}, attempt };
}

export async function submitVolunteerForm(prev: FormState, form: FormData): Promise<FormState> {
  return handle(prev, form, readVolunteerForm, saveVolunteer);
}

export async function submitDonorForm(prev: FormState, form: FormData): Promise<FormState> {
  return handle(prev, form, readDonorForm, saveDonor);
}

export async function submitHelpForm(prev: FormState, form: FormData): Promise<FormState> {
  return handle(prev, form, readHelpForm, saveHelpRequest);
}
