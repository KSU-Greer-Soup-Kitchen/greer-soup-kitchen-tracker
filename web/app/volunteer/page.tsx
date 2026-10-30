import { listOpenWeekendDates } from "../../lib/supabase";
import { PublicPage } from "../components/SiteChrome";
import { VolunteerForm } from "./VolunteerForm";

export const metadata = { title: "Volunteer" };
// The open weekend dates change as groups book them, so build this page fresh each time
export const dynamic = "force-dynamic";

export default async function VolunteerPage() {
  let weekendDates: string[] | null = null;
  try {
    weekendDates = await listOpenWeekendDates();
  } catch (err) {
    // The form still works for STEP and weekday volunteers
    console.error("Volunteer page:", err instanceof Error ? err.message : err);
  }
  return (
    <PublicPage current="/volunteer">
      <div className="container narrow">
        <h1>Volunteer sign-up</h1>
        <p className="lead">Thank you for wanting to help. Fill out this form and someone from our team will contact you.</p>
        <VolunteerForm weekendDates={weekendDates} />
      </div>
    </PublicPage>
  );
}
