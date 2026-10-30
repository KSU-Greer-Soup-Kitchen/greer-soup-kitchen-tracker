// Choices shown on the forms

export type Option = { value: string; label: string };

export const AGE_GROUPS: Option[] = [
  "Under 18",
  "18 to 29",
  "30 to 49",
  "50 to 64",
  "65 to 79",
  "80 or older",
].map((g) => ({ value: g, label: g }));

// Where a volunteer wants to help
// Each one is sent to a different person; form_recipients in 0004.
export const VOLUNTEER_PROGRAMS: Option[] = [
  { value: "step", label: "STEP" },
  { value: "weekday", label: "Weekday Soup Kitchen" },
  { value: "weekend_group", label: "Soup Kitchen Weekend Group" },
];

export const AVAILABILITY: Option[] = [
  { value: "weekday-morning", label: "Weekday mornings (Mon to Fri, 8 AM to 1 PM)" },
  { value: "saturday-morning", label: "Saturday mornings (8 AM to 1 PM)" },
  { value: "sunday-supper", label: "Sunday supper (4 PM to 5:30 PM)" },
  { value: "step", label: "Helping STEP families (times vary)" },
];

export const SKILLS: Option[] = [
  { value: "cooking", label: "Cooking" },
  { value: "serving", label: "Serving meals" },
  { value: "cleaning", label: "Cleaning up" },
  { value: "mentoring", label: "Mentoring or job help for STEP families" },
  { value: "office", label: "Office or computer work" },
];

export const GIVING_FREQUENCY: Option[] = [
  { value: "one-time", label: "One time" },
  { value: "recurring", label: "Regularly (monthly, yearly, etc.)" },
];

export const HEARD_FROM: Option[] = [
  "Friend or family",
  "Church",
  "Social media",
  "Event",
  "Newspaper or TV",
  "Other",
].map((h) => ({ value: h, label: h }));

export const CONTACT_PREFS: Option[] = [
  { value: "email", label: "Email" },
  { value: "mail", label: "Mail" },
  { value: "phone", label: "Phone" },
];

export const TRIBUTE: Option[] = [
  { value: "", label: "No" },
  { value: "honor", label: "In honor of someone" },
  { value: "memory", label: "In memory of someone" },
];

export const NEEDS: Option[] = [
  { value: "housing", label: "Housing or shelter (STEP program)" },
  { value: "food", label: "Food for my family" },
  { value: "other", label: "Something else" },
];

export const BEST_TIMES: Option[] = ["Morning", "Afternoon", "Evening"].map((t) => ({ value: t, label: t }));

export const REQUEST_STATUS: Option[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

// Every way a gift can be paid. Matches the payment_method values in the database.
export const PAYMENT_METHODS: Option[] = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "venmo", label: "Venmo" },
  { value: "paypal", label: "PayPal" },
  { value: "card", label: "Card" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "google_pay", label: "Google Pay" },
  { value: "other", label: "Other" },
];

// The ones staff pick from when they type in a gift by hand
export const MANUAL_PAYMENT_METHODS = PAYMENT_METHODS.filter((m) =>
  ["cash", "check", "venmo", "card", "other"].includes(m.value),
);

// Turns a stored value into the words staff see, e.g. "apple_pay" -> "Apple Pay"
export function labelFor(options: Option[], value: string | null | undefined): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}
