import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";
import { lastMonths, monthKey, monthStart } from "./format";
import { buildReports } from "./reports";
import { secondsLeft } from "./session";
import { readDonorForm, readHelpForm, readVolunteerForm } from "./validate";

function form(fields: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) f.append(k, x);
  return f;
}

describe("volunteer form", () => {
  it("accepts a complete sign-up and drops unknown choices", () => {
    const { input, errors } = readVolunteerForm(
      form({ first_name: " Ann ", last_name: "Lee", email: "Ann@Example.com", phone: "864-555-0101", availability: ["weekday-morning", "hacker"] }),
    );
    expect(errors).toEqual({});
    expect(input.firstName).toBe("Ann");
    expect(input.email).toBe("ann@example.com");
    expect(input.availability).toEqual(["weekday-morning"]);
  });

  it("lists every missing answer in plain words", () => {
    const { errors } = readVolunteerForm(form({ email: "not-an-email" }));
    expect(Object.keys(errors).sort()).toEqual(["availability", "email", "first_name", "last_name", "phone"]);
    expect(errors.email).toMatch(/name@example.com/);
  });
});

describe("donor form", () => {
  const base = { first_name: "Bo", last_name: "Ray", email: "bo@example.com", city: "Greer", age_group: "65 to 79", giving_frequency: "one-time" };

  it("needs a name for an honor or memory gift", () => {
    expect(readDonorForm(form({ ...base, tribute: "memory" })).errors.tribute_name).toBeDefined();
    expect(readDonorForm(form({ ...base, tribute: "memory", tribute_name: "Mom" })).errors).toEqual({});
  });

  it("forgets a tribute name when no tribute is picked", () => {
    expect(readDonorForm(form({ ...base, tribute_name: "Mom" })).input.tributeName).toBe("");
  });
});

describe("help form", () => {
  it("needs a phone or an email, not both", () => {
    const base = { first_name: "C", last_name: "D", need: "food" };
    expect(readHelpForm(form(base)).errors.phone).toMatch(/phone number or an email/);
    expect(readHelpForm(form({ ...base, phone: "864-555-0101" })).errors).toEqual({});
  });
});

describe("dates", () => {
  it("uses Greer's month, not the server's", () => {
    // 1 AM on Nov 1 in UTC is still Oct 31 in Greer
    expect(monthStart(0, new Date("2026-11-01T01:00:00Z"))).toBe("2026-10-01");
    expect(monthKey("2026-11-01T01:00:00Z")).toBe("2026-10");
    expect(monthKey("2026-11-01")).toBe("2026-11");
  });

  it("lists the last months oldest first", () => {
    expect(lastMonths(3, new Date("2026-02-15T12:00:00Z")).map((m) => m.key)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
});

describe("reports", () => {
  it("adds up gifts, hours, and age groups", () => {
    const now = new Date("2026-10-20T12:00:00Z");
    const r = buildReports(
      [
        { amount: 5, donated_at: "2026-10-10T15:00:00Z", payment_method: "paypal" },
        { amount: 20, donated_at: "2026-09-10T15:00:00Z", payment_method: "check" },
        { amount: 10, donated_at: "2026-10-12T15:00:00Z", payment_method: null },
      ],
      [{ hours: 3, shift_date: "2026-10-05", person_id: "p1" }],
      [{ age_group: "65 to 79" }, { age_group: null }],
      new Map([["p1", "Ann Lee"]]),
      now,
    );
    expect(r.totalGiven).toBe(35);
    expect(r.givenByMonth.at(-1)).toMatchObject({ label: "Oct", value: 15 });
    expect(r.givenByMethod[0]).toEqual({ label: "Check", value: 20 });
    expect(r.givenByMethod.map((m) => m.label)).toContain("Not recorded");
    expect(r.donorAges.find((a) => a.label === "65 to 79")?.value).toBe(1);
    expect(r.donorAges.at(-1)).toEqual({ label: "Not given", value: 1 });
    expect(r.topVolunteers).toEqual([{ label: "Ann Lee", value: 3 }]);
  });
});

describe("spreadsheet export", () => {
  it("quotes commas and blocks formulas", () => {
    const csv = toCsv(["Name", "Note"], [["Lee, Ann", "=HYPERLINK(1)"]]);
    expect(csv).toContain('"Lee, Ann",\'=HYPERLINK(1)');
  });
});

describe("login token timing", () => {
  it("reads how long a token has left", () => {
    const payload = btoa(JSON.stringify({ exp: 1_000_100 })).replace(/=+$/, "");
    expect(secondsLeft(`x.${payload}.y`, 1_000_000 * 1000)).toBe(100);
    expect(secondsLeft("garbage")).toBe(0);
  });
});
