// The STEP family shelter application (same questions as greerstep.org/family-shelter-application).
// This one list drives the public form, the checks below, and the staff page,
// so a question only has to be added or changed here.

import { today } from "./format";
import type { FieldErrors } from "./validate";

export type StepKind = "text" | "long" | "date" | "tel" | "email" | "ssn" | "money" | "yesno" | "agree";

export type StepField = {
  name: string;
  label: string;
  kind: StepKind;
  optional?: boolean;
  hint?: string;
  // Shorter wording for the staff page, when the form's wording doesn't fit there
  staffLabel?: string;
  // Sits next to the field after it on wide screens
  half?: boolean;
};

export type StepSection = {
  id: string;
  title: string;
  intro?: string;
  // Asked once
  fields?: StepField[];
  // Asked for every adult or every child (after the `fields` above)
  each?: "adult" | "child";
  eachFields?: StepField[];
};

export const MAX_ADULTS = 4;
export const MAX_CHILDREN = 8;

const NONE = "If this does not apply, write None.";

// Rows of "where from / how much". Only the first income row is required.
function moneyRows(prefix: "income" | "debt", count: number): StepField[] {
  const income = prefix === "income";
  return Array.from({ length: count }, (_, i): StepField[] => {
    const optional = !(income && i === 0);
    return [
      { name: `${prefix}${i + 1}_${income ? "source" : "place"}`, label: income ? "Source" : "Who you owe", kind: "text", half: true, optional },
      { name: `${prefix}${i + 1}_amount`, label: income ? "Monthly amount ($)" : "Amount owed ($)", kind: "money", half: true, optional },
    ];
  }).flat();
}

export const STEP_SECTIONS: StepSection[] = [
  {
    id: "who",
    title: "Who is applying",
    intro: "List every adult who would live at the shelter. Start with yourself.",
    each: "adult",
    eachFields: [
      { name: "name", label: "Full name", kind: "text" },
      { name: "dob", label: "Date of birth", kind: "date", half: true },
      { name: "ssn", label: "Social Security number", kind: "ssn", half: true },
      { name: "phone", label: "Phone number", kind: "tel", half: true },
      { name: "email", label: "Email address", kind: "email", half: true, optional: true },
      { name: "relationship", label: "Relationship", kind: "text", hint: "For example: self, wife, husband, partner, mother." },
    ],
  },
  {
    id: "children",
    title: "Children",
    intro: "List children who live with you at least 5 days a week.",
    each: "child",
    eachFields: [
      { name: "name", label: "Full name", kind: "text" },
      { name: "dob", label: "Date of birth", kind: "date", half: true },
      { name: "relationship", label: "Relationship to you", kind: "text", half: true, hint: "For example: son, daughter." },
    ],
  },
  {
    id: "about",
    title: "About each adult",
    each: "adult",
    eachFields: [
      { name: "school_level", label: "Last year of school completed", kind: "text", half: true },
      { name: "school_name", label: "Name of school", kind: "text", half: true },
      { name: "medical", label: "Medical conditions", kind: "long", hint: NONE },
      { name: "substance", label: "Substance abuse history", kind: "long", hint: NONE },
      { name: "mental_health", label: "Mental health needs", kind: "long", hint: NONE },
      { name: "legal", label: "Legal issues", kind: "long", hint: NONE },
      { name: "insurance", label: "Health insurance", kind: "text", hint: "For example: Medicaid, through work, or None." },
      { name: "insurance_company", label: "Insurance company", kind: "text", half: true, optional: true },
      { name: "insurance_renews", label: "Insurance renews on", kind: "text", half: true, optional: true },
      { name: "military", label: "Did you serve in the military?", kind: "yesno" },
      { name: "license", label: "Driver's license number", kind: "text", half: true, hint: NONE },
      { name: "fines", label: "Outstanding fines", kind: "text", half: true, hint: NONE },
    ],
  },
  {
    id: "emergency",
    title: "Emergency contact",
    fields: [
      { name: "ec_name", label: "Name", kind: "text", half: true },
      { name: "ec_relationship", label: "Relationship", kind: "text", half: true },
      { name: "ec_phone", label: "Phone number", kind: "tel" },
      { name: "ec_address", label: "Address", kind: "long", hint: "Street, city, state, and ZIP code." },
    ],
  },
  {
    id: "work",
    title: "Work",
    each: "adult",
    eachFields: [
      { name: "employer", label: "Current employer", kind: "text", hint: "If not working right now, write None." },
      { name: "work_type", label: "Type of work", kind: "text", half: true, optional: true },
      { name: "hired", label: "Date hired", kind: "date", half: true, optional: true },
      { name: "supervisor", label: "Supervisor's name", kind: "text", half: true, optional: true },
      { name: "supervisor_phone", label: "Supervisor's phone", kind: "tel", half: true, optional: true },
      { name: "past_employers", label: "Every employer in the last 2 years", kind: "long", hint: NONE },
      { name: "skills", label: "Work skills", kind: "long" },
    ],
  },
  {
    id: "income",
    title: "Income and bank accounts",
    intro: "Income for every adult hoping to live at the shelter: jobs, child support, disability, alimony, and so on.",
    fields: [
      ...moneyRows("income", 3),
      { name: "checking", label: "Do you have a checking account?", kind: "yesno" },
      { name: "savings", label: "Do you have a savings account?", kind: "yesno" },
    ],
  },
  {
    id: "debts",
    title: "Money you owe",
    intro: "List every person or place you owe money: friends, loans, utilities, lawsuits, child support, credit cards, court fees, tickets. Leave blank if none.",
    fields: moneyRows("debt", 6),
  },
  {
    id: "home",
    title: "Getting around and housing",
    fields: [
      { name: "vehicle", label: "Do you have a vehicle you can use?", kind: "yesno" },
      { name: "bicycle", label: "Do you have a bicycle?", kind: "yesno" },
      { name: "housing_now", label: "Where are you living right now?", kind: "long" },
      { name: "past_addresses", label: "Past addresses", kind: "long", optional: true, hint: "One per line, newest first." },
    ],
  },
  {
    id: "family",
    title: "School, childcare, and family",
    fields: [
      { name: "schools", label: "Schools anyone attends now", kind: "long", hint: "Include the grade for each child. If none, write None." },
      { name: "childcare", label: "Childcare", kind: "long", hint: "Name, address, phone, hours of care, and contact person. If none, write None." },
      { name: "cps", label: "Have you been in touch with Child Protective Services in the past two years?", kind: "yesno", optional: true },
      { name: "restraining", label: "Any restraining orders?", kind: "yesno" },
      { name: "visitation", label: "Any supervised parental visitation?", kind: "yesno" },
      { name: "snap", label: "Do you receive SNAP (food stamps)?", kind: "yesno" },
      { name: "abc", label: "Do you receive ABC childcare vouchers?", kind: "yesno" },
    ],
  },
  {
    id: "story",
    title: "Your story",
    fields: [
      { name: "story", label: "How did you come to be in your current situation?", kind: "long" },
      { name: "barrier", label: "What do you feel is the biggest barrier keeping you from having a home?", kind: "long" },
      { name: "plan", label: "What can you do to improve your life in the next 12 months?", kind: "long" },
    ],
  },
  {
    id: "health",
    title: "Health",
    intro: "A copy of each child's immunization record will be needed when you move in.",
    fields: [
      { name: "physicians", label: "Doctors", kind: "long", hint: "For each one: name, location, phone, and who sees them. If none, write None." },
      { name: "prescriptions", label: "Prescriptions", kind: "long", hint: "For each one: name, what it is for, who takes it, and how often. If none, write None." },
      { name: "allergies", label: "Allergies", kind: "long", hint: "For each person. If none, write None." },
    ],
  },
  {
    id: "sign",
    title: "Sign",
    fields: [{ name: "consent", label: "I have answered all questions completely and truthfully.", staffLabel: "Promised every answer is true", kind: "agree" }],
    each: "adult",
    eachFields: [{ name: "signature", label: "Type your full name to sign", staffLabel: "Signature", kind: "text" }],
  },
];

// The form name for a question, e.g. adult2_dob or ec_phone
export function stepFieldName(field: StepField, each?: "adult" | "child", n?: number): string {
  return each ? `${each}${n}_${field.name}` : field.name;
}

export function personTitle(each: "adult" | "child", n: number): string {
  if (each === "adult") return n === 1 ? "Adult 1 (you)" : `Adult ${n}`;
  return `Child ${n}`;
}

export type StepInput = {
  adultCount: number;
  childCount: number;
  // Only the questions that were answered, by form name
  answers: Record<string, string>;
  signedOn: string;
  applicantName: string;
  phone: string;
  email: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function count(form: FormData, name: string, min: number, max: number): number {
  const n = Number(form.get(name));
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : min;
}

function realDate(value: string, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value && value >= "1900-01-01" && value <= today(now);
}

// Returns the cleaned answer, or an error message
function check(field: StepField, raw: string, now: Date): { value: string; error?: string } {
  const value = raw.trim().slice(0, field.kind === "long" ? 3000 : 200);
  if (!value) {
    if (field.optional) return { value };
    if (field.kind === "yesno") return { value, error: `Choose Yes or No: "${field.label}"` };
    if (field.kind === "agree") return { value, error: "Check the box to say your answers are true" };
    return { value, error: `Fill in "${field.label}"` };
  }
  switch (field.kind) {
    case "yesno":
      return value === "yes" || value === "no" ? { value } : { value: "", error: `Choose Yes or No: "${field.label}"` };
    case "agree":
      return value === "yes" ? { value } : { value: "", error: "Check the box to say your answers are true" };
    case "ssn": {
      const digits = value.replace(/\D/g, "");
      if (digits.length !== 9) return { value, error: "The Social Security number should have 9 digits" };
      return { value: `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}` };
    }
    case "date":
      return realDate(value, now) ? { value } : { value, error: `Enter a real date for "${field.label}"` };
    case "tel":
      return value.replace(/\D/g, "").length >= 7 ? { value } : { value, error: `Check "${field.label}". It should have at least 7 digits` };
    case "email":
      return EMAIL.test(value) ? { value: value.toLowerCase() } : { value, error: "Check the email address. It should look like name@example.com" };
    case "money": {
      const n = Number(value.replace(/[$,\s]/g, ""));
      return Number.isFinite(n) && n >= 0 && n < 1_000_000 ? { value: n.toFixed(2) } : { value, error: `Enter "${field.label}" in dollars, like 450` };
    }
    default:
      return { value };
  }
}

export function readStepForm(form: FormData, now = new Date()): { input: StepInput; errors: FieldErrors } {
  const adultCount = count(form, "adult_count", 1, MAX_ADULTS);
  const childCount = count(form, "child_count", 0, MAX_CHILDREN);
  const answers: Record<string, string> = {};
  const errors: FieldErrors = {};

  function ask(field: StepField, name: string, who: string) {
    const raw = form.get(name);
    const { value, error } = check(field, typeof raw === "string" ? raw : "", now);
    if (value) answers[name] = value;
    if (error) errors[name] = who + error;
  }

  for (const section of STEP_SECTIONS) {
    for (const field of section.fields ?? []) ask(field, field.name, "");
    if (section.each) {
      const total = section.each === "adult" ? adultCount : childCount;
      for (let n = 1; n <= total; n++) {
        for (const field of section.eachFields ?? []) ask(field, stepFieldName(field, section.each, n), `${personTitle(section.each, n)}: `);
      }
    }
  }

  // A row of money needs both halves
  for (const [prefix, what, missing] of [
    ["income", "source", "Enter where this income comes from"],
    ["debt", "place", "Enter who you owe this money to"],
  ]) {
    for (let n = 1; n <= 6; n++) {
      const whatName = `${prefix}${n}_${what}`;
      const amountName = `${prefix}${n}_amount`;
      if (answers[whatName] && !answers[amountName] && !errors[amountName]) errors[amountName] = `Enter the amount for "${answers[whatName]}"`;
      if (answers[amountName] && !answers[whatName] && !errors[whatName]) errors[whatName] = missing;
    }
  }

  return {
    input: {
      adultCount,
      childCount,
      answers,
      signedOn: today(now),
      applicantName: answers.adult1_name ?? "",
      phone: answers.adult1_phone ?? "",
      email: answers.adult1_email ?? "",
    },
    errors,
  };
}
