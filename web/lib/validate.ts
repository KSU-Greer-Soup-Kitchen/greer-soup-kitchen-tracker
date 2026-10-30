// Checks what people typed into the public forms and turns it into clean values.
// Every error message says exactly what to do, in plain words (NFR-1).

import { AGE_GROUPS, AVAILABILITY, BEST_TIMES, CONTACT_PREFS, GIVING_FREQUENCY, HEARD_FROM, NEEDS, SKILLS, type Option } from "./options";

export type FieldErrors = Record<string, string>;

// What a form shows after it is sent: the errors to fix, or success.
// `values` lets the form keep what the person typed when there is a mistake.
export type FormState = {
  status: "idle" | "error" | "success";
  errors: FieldErrors;
  values: Record<string, string | string[]>;
  attempt: number;
};

export const initialFormState: FormState = { status: "idle", errors: {}, values: {}, attempt: 0 };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(form: FormData, name: string, max = 500): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Only keeps answers that are one of the listed choices
function pickMany(form: FormData, name: string, options: Option[]): string[] {
  const allowed = new Set(options.map((o) => o.value));
  return [...new Set(form.getAll(name).filter((v): v is string => typeof v === "string" && allowed.has(v)))];
}

function pickOne(form: FormData, name: string, options: Option[]): string {
  const value = text(form, name);
  return options.some((o) => o.value === value) ? value : "";
}

function phoneLooksReal(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 7;
}

export type VolunteerInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  ageGroup: string;
  availability: string[];
  skills: string[];
  notes: string;
};

export function readVolunteerForm(form: FormData): { input: VolunteerInput; errors: FieldErrors } {
  const input: VolunteerInput = {
    firstName: text(form, "first_name", 100),
    lastName: text(form, "last_name", 100),
    email: text(form, "email", 200).toLowerCase(),
    phone: text(form, "phone", 40),
    address: text(form, "address", 300),
    ageGroup: pickOne(form, "age_group", AGE_GROUPS),
    availability: pickMany(form, "availability", AVAILABILITY),
    skills: pickMany(form, "skills", SKILLS),
    notes: text(form, "notes", 2000),
  };
  const errors: FieldErrors = {};
  if (!input.firstName) errors.first_name = "Enter your first name";
  if (!input.lastName) errors.last_name = "Enter your last name";
  if (!input.email) errors.email = "Enter your email address";
  else if (!EMAIL.test(input.email)) errors.email = "Check your email address. It should look like name@example.com";
  if (!input.phone) errors.phone = "Enter your phone number";
  else if (!phoneLooksReal(input.phone)) errors.phone = "Check your phone number. It should have at least 7 digits";
  if (input.availability.length === 0) errors.availability = "Pick at least one time you can help";
  return { input, errors };
}

export type DonorInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  ageGroup: string;
  givingFrequency: string;
  heardFrom: string;
  contactPrefs: string[];
  newsletter: boolean | null;
  tributeType: string;
  tributeName: string;
};

export function readDonorForm(form: FormData): { input: DonorInput; errors: FieldErrors } {
  const newsletter = text(form, "newsletter");
  const input: DonorInput = {
    firstName: text(form, "first_name", 100),
    lastName: text(form, "last_name", 100),
    email: text(form, "email", 200).toLowerCase(),
    phone: text(form, "phone", 40),
    address: text(form, "address", 300),
    city: text(form, "city", 100),
    ageGroup: pickOne(form, "age_group", AGE_GROUPS),
    givingFrequency: pickOne(form, "giving_frequency", GIVING_FREQUENCY),
    heardFrom: pickOne(form, "heard_from", HEARD_FROM),
    contactPrefs: pickMany(form, "contact_prefs", CONTACT_PREFS),
    newsletter: newsletter === "yes" ? true : newsletter === "no" ? false : null,
    tributeType: ["honor", "memory"].includes(text(form, "tribute")) ? text(form, "tribute") : "",
    tributeName: text(form, "tribute_name", 200),
  };
  const errors: FieldErrors = {};
  if (!input.firstName) errors.first_name = "Enter your first name";
  if (!input.lastName) errors.last_name = "Enter your last name";
  if (!input.email) errors.email = "Enter your email address";
  else if (!EMAIL.test(input.email)) errors.email = "Check your email address. It should look like name@example.com";
  if (input.phone && !phoneLooksReal(input.phone)) errors.phone = "Check your phone number. It should have at least 7 digits";
  if (!input.city) errors.city = "Enter the town or city you live in";
  if (!input.ageGroup) errors.age_group = "Choose your age group";
  if (!input.givingFrequency) errors.giving_frequency = "Choose one time or regular giving";
  if (input.tributeType && !input.tributeName) errors.tribute_name = "Enter the name of the person your gift honors";
  if (!input.tributeType) input.tributeName = "";
  return { input, errors };
}

export type HelpInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  need: string;
  details: string;
  bestTime: string;
};

export function readHelpForm(form: FormData): { input: HelpInput; errors: FieldErrors } {
  const input: HelpInput = {
    firstName: text(form, "first_name", 100),
    lastName: text(form, "last_name", 100),
    email: text(form, "email", 200).toLowerCase(),
    phone: text(form, "phone", 40),
    need: pickOne(form, "need", NEEDS),
    details: text(form, "details", 2000),
    bestTime: pickOne(form, "best_time", BEST_TIMES),
  };
  const errors: FieldErrors = {};
  if (!input.firstName) errors.first_name = "Enter your first name";
  if (!input.lastName) errors.last_name = "Enter your last name";
  if (!input.phone && !input.email) errors.phone = "Give us a phone number or an email address so we can reach you";
  else if (input.email && !EMAIL.test(input.email)) errors.email = "Check your email address. It should look like name@example.com";
  else if (input.phone && !phoneLooksReal(input.phone)) errors.phone = "Check your phone number. It should have at least 7 digits";
  if (!input.need) errors.need = "Choose what you need help with";
  return { input, errors };
}

// Keeps what the person typed so the form can show it again
export function formValues(form: FormData): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};
  for (const key of new Set(form.keys())) {
    if (key.startsWith("$")) continue; // React's own hidden fields
    const all = form.getAll(key).filter((v): v is string => typeof v === "string");
    values[key] = all.length > 1 ? all : all[0] ?? "";
  }
  return values;
}
