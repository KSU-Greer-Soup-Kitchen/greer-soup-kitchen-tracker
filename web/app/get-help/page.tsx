import { PublicPage } from "../components/SiteChrome";
import { HelpForm } from "./HelpForm";

export const metadata = { title: "Get Help" };

export default function GetHelpPage() {
  return (
    <PublicPage current="/get-help">
      <div className="container narrow">
        <h1>Ask for help</h1>
        <p className="lead">We would be glad to help. Tell us what you need and how to reach you.</p>
        <div className="note">
          <p>
            <strong>Just need a meal?</strong> You do not need to fill out a form. Come by 521 E. Poinsett St. Monday to Saturday for lunch at 11:30 AM,
            or Sunday for supper at 4:00 PM.
          </p>
        </div>
        <HelpForm />
      </div>
    </PublicPage>
  );
}
