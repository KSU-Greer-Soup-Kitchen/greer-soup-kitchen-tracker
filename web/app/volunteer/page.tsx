import { PublicPage } from "../components/SiteChrome";
import { VolunteerForm } from "./VolunteerForm";

export const metadata = { title: "Volunteer" };

export default function VolunteerPage() {
  return (
    <PublicPage current="/volunteer">
      <div className="container narrow">
        <h1>Volunteer sign-up</h1>
        <p className="lead">Thank you for wanting to help. Fill out this form and someone from our team will contact you.</p>
        <VolunteerForm />
      </div>
    </PublicPage>
  );
}
