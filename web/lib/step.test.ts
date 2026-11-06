import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { lock, lockboxReady, unlock } from "./lockbox";
import { contactEmail, stepEmail } from "./notify";
import { readStepForm, STEP_SECTIONS, stepFieldName, type StepField } from "./step";
import { readContactForm } from "./validate";

function form(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}

const NOW = new Date("2026-11-05T15:00:00Z");

function sample(field: StepField): string {
  switch (field.kind) {
    case "yesno":
    case "agree":
      return "yes";
    case "date":
      return "1990-05-01";
    case "tel":
      return "864-555-0101";
    case "email":
      return "Pat@Example.com";
    case "ssn":
      return "123 45 6789";
    case "money":
      return "$1,200";
    default:
      return "None";
  }
}

// Every required question answered, for this many adults and children
function complete(adults: number, children: number): Record<string, string> {
  const out: Record<string, string> = { adult_count: String(adults), child_count: String(children) };
  for (const section of STEP_SECTIONS) {
    for (const field of section.fields ?? []) if (!field.optional) out[field.name] = sample(field);
    if (section.each) {
      const total = section.each === "adult" ? adults : children;
      for (let n = 1; n <= total; n++) {
        for (const field of section.eachFields ?? []) if (!field.optional) out[stepFieldName(field, section.each, n)] = sample(field);
      }
    }
  }
  out.adult1_name = "Pat Smith";
  return out;
}

describe("STEP application", () => {
  it("accepts a complete application and cleans up the answers", () => {
    const { input, errors } = readStepForm(form(complete(2, 1)), NOW);
    expect(errors).toEqual({});
    expect(input.adultCount).toBe(2);
    expect(input.childCount).toBe(1);
    expect(input.applicantName).toBe("Pat Smith");
    expect(input.answers.adult1_ssn).toBe("123-45-6789");
    expect(input.answers.income1_amount).toBe("1200.00");
    expect(input.answers.adult2_signature).toBe("None");
    expect(input.signedOn).toBe("2026-11-05");
  });

  it("asks every adult and child their own questions", () => {
    const fields = complete(2, 1);
    delete fields.adult2_dob;
    delete fields.child1_name;
    const { errors } = readStepForm(form(fields), NOW);
    expect(errors.adult2_dob).toMatch(/^Adult 2: /);
    expect(errors.child1_name).toMatch(/^Child 1: /);
  });

  it("ignores people beyond the counts it was told", () => {
    const fields = { ...complete(1, 0), adult2_name: "Not really here" };
    const { input } = readStepForm(form(fields), NOW);
    expect(input.answers.adult2_name).toBeUndefined();
  });

  it("checks SSNs, dates, consent, and money rows", () => {
    const fields = { ...complete(1, 0), adult1_ssn: "12345", adult1_dob: "2030-01-01", consent: "", debt1_place: "Duke Energy" };
    const { errors } = readStepForm(form(fields), NOW);
    expect(errors.adult1_ssn).toMatch(/9 digits/);
    expect(errors.adult1_dob).toMatch(/real date/);
    expect(errors.consent).toMatch(/Check the box/);
    expect(errors.debt1_amount).toMatch(/Duke Energy/);
  });

  it("keeps the counts in range", () => {
    expect(readStepForm(form({ adult_count: "99", child_count: "-3" }), NOW).input).toMatchObject({ adultCount: 4, childCount: 0 });
  });

  it("never puts private answers in the email", () => {
    const { input } = readStepForm(form(complete(1, 0)), NOW);
    const email = stepEmail(input);
    expect(email.route).toBe("step_application");
    expect(email.text).toContain("Pat Smith");
    expect(email.text).not.toContain("123-45-6789");
    expect(email.text).not.toContain("1990");
  });
});

describe("lockbox", () => {
  const env = { STEP_APPLICATION_KEY: randomBytes(32).toString("base64") };

  it("locks and unlocks", () => {
    const locked = lock({ ssn: "123-45-6789" }, env);
    expect(locked).not.toContain("123-45-6789");
    expect(unlock(locked, env)).toEqual({ ssn: "123-45-6789" });
  });

  it("refuses a wrong key or changed text", () => {
    const locked = lock({ a: 1 }, env);
    expect(() => unlock(locked, { STEP_APPLICATION_KEY: randomBytes(32).toString("base64") })).toThrow();
    const parts = locked.split(".");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(() => unlock(parts.join("."), env)).toThrow();
  });

  it("is only ready with a 32-byte key", () => {
    expect(lockboxReady(env)).toBe(true);
    expect(lockboxReady({})).toBe(false);
    expect(lockboxReady({ STEP_APPLICATION_KEY: "short" })).toBe(false);
  });
});

describe("contact form", () => {
  it("accepts a message and routes it by topic", () => {
    const { input, errors } = readContactForm(form({ name: "Ann", email: "Ann@Example.com", topic: "step", message: "Hello" }));
    expect(errors).toEqual({});
    const email = contactEmail(input);
    expect(email.route).toBe("contact_step");
    expect(email.replyTo).toBe("ann@example.com");
    expect(email.text).toContain("Hello");
  });

  it("needs a name, a way to answer, a topic, and a message", () => {
    const { errors } = readContactForm(form({ topic: "hacker" }));
    expect(Object.keys(errors).sort()).toEqual(["email", "message", "name", "topic"]);
  });
});
