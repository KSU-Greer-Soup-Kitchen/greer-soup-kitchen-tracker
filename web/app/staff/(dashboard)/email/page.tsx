import { requireStaff } from "../../../../lib/auth";
import { listVolunteerContacts } from "../../../../lib/staff-data";
import { PageHead } from "../bits";
import { EmailVolunteers } from "./EmailVolunteers";

export const metadata = { title: "Email Volunteers" };

export default async function EmailPage() {
  const [staff, contacts] = await Promise.all([requireStaff(), listVolunteerContacts()]);
  return (
    <>
      <PageHead title="Email volunteers" intro="Let volunteers know about an upcoming need or event. Only active volunteers are included." />
      <EmailVolunteers contacts={contacts} staffEmail={staff.email} />
    </>
  );
}
