import { lockboxReady } from "../../lib/lockbox";
import { PublicPage } from "../components/SiteChrome";
import { StepForm } from "./StepForm";

export const metadata = { title: "STEP Family Shelter Application" };

// Read the key setting on every visit, not once at build time
export const dynamic = "force-dynamic";

export default function StepApplicationPage() {
  return (
    <PublicPage current="/get-help">
      <div className="container narrow">
        <h1>Greer STEP family shelter application</h1>
        <p className="lead">
          STEP (Shelter to Empower People) gives homeless families a place to live for up to two years, with help finding work, saving money,
          and moving into a home of their own.
        </p>
        <div className="note">
          <p>
            <strong>Before you start:</strong> this application takes about 30 to 45 minutes and can&apos;t be saved partway, so give yourself
            time. Have these ready for every adult and child: dates of birth, Social Security numbers (adults), work history, income, and
            doctors and prescriptions.
          </p>
          <p>
            <strong>Your answers are private.</strong> Only Greer STEP staff can read them.
          </p>
          <p>
            Questions or need help filling it out? Call STEP at <a href="tel:+18643345265">864-334-5265</a>.
          </p>
        </div>
        {lockboxReady() ? (
          <StepForm />
        ) : (
          <p className="alert alert-error">
            Online applications are not open right now. Please call STEP at <a href="tel:+18643345265">864-334-5265</a> to apply.
          </p>
        )}
      </div>
    </PublicPage>
  );
}
