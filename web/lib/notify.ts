// Emails each new form to the person in charge of it
import { labelFor, NEEDS, VOLUNTEER_PROGRAMS, AVAILABILITY, SKILLS, GIVING_FREQUENCY } from "./options";
import type { DonorInput, HelpInput, VolunteerInput } from "./validate";

export type Email = { route: string; subject: string; text: string };

function lines(rows: [string, string | number | null | undefined][]): string {
  return rows
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

const FOOTER = "\n\nThis came from the website form. See every record on the staff pages.";

export function volunteerEmail(v: VolunteerInput): Email {
  const program = labelFor(VOLUNTEER_PROGRAMS, v.program);
  return {
    route: `volunteer_${v.program}`,
    subject: `New volunteer sign-up: ${program}`,
    text:
      lines([
        ["Name", `${v.firstName} ${v.lastName}`],
        ["Volunteering for", program],
        ["Group", v.groupName],
        ["Weekend date", v.weekendDate],
        ["Group size", v.groupSize],
        ["Email", v.email],
        ["Phone", v.phone],
        ["Can help", v.availability.map((a) => labelFor(AVAILABILITY, a)).join("; ")],
        ["Interested in", v.skills.map((s) => labelFor(SKILLS, s)).join(", ")],
        ["They wrote", v.notes],
      ]) + FOOTER,
  };
}

export function helpEmail(h: HelpInput): Email {
  const need = labelFor(NEEDS, h.need);
  return {
    route: `help_${h.need}`,
    subject: `New help request: ${need}`,
    text:
      lines([
        ["Name", `${h.firstName} ${h.lastName}`],
        ["Needs", need],
        ["Phone", h.phone],
        ["Email", h.email],
        ["Best time to reach", h.bestTime],
        ["They wrote", h.details],
      ]) + FOOTER,
  };
}

export function donorEmail(d: DonorInput): Email {
  return {
    route: "donor",
    subject: "New donor form",
    text:
      lines([
        ["Name", `${d.firstName} ${d.lastName}`],
        ["Email", d.email],
        ["Phone", d.phone],
        ["Town or city", d.city],
        ["Gives", labelFor(GIVING_FREQUENCY, d.givingFrequency)],
        ["Gift is", d.tributeType ? `In ${d.tributeType} of ${d.tributeName}` : null],
      ]) + FOOTER,
  };
}

export type SendResult = "sent" | "skipped" | "failed";

// `findRecipient` is passed in so this can be tested without a database
export async function sendFormEmail(
  email: Email,
  findRecipient: (route: string) => Promise<string | null>,
  env: Record<string, string | undefined> = process.env,
): Promise<SendResult> {
  try {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) return "skipped";
    const to = await findRecipient(email.route);
    if (!to) return "skipped";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM || "Greer Soup Kitchen <onboarding@resend.dev>",
        to: [to],
        subject: email.subject,
        text: email.text,
      }),
    });
    if (!res.ok) {
      console.error(`Form email (${email.route}): Resend answered ${res.status}`);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error(`Form email (${email.route}):`, err instanceof Error ? err.message : err);
    return "failed";
  }
}
