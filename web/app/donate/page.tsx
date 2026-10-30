import { PublicPage } from "../components/SiteChrome";
import { DonorForm } from "./DonorForm";
import { PayPalGive } from "./PayPalGive";

export const metadata = { title: "Donate" };

export default function DonatePage() {
  // The PayPal client ID is public by design; the secret never leaves the server
  const clientId = process.env.PAYPAL_CLIENT_ID ?? "";
  const giveOnline = clientId ? (
    <PayPalGive clientId={clientId} />
  ) : (
    <p className="muted">Online giving is not set up yet. Please mail a check.</p>
  );

  return (
    <PublicPage current="/donate">
      <div className="container narrow">
        <h1>Give to Daily Bread Ministries</h1>
        <p className="lead">
          Your gift feeds neighbors at the Greer Soup Kitchen and helps families in Greer STEP find a home of their own. Thank you.
        </p>

        <ol className="steps" aria-label="How to give">
          <li>
            <span className="num" aria-hidden="true">1</span> Tell us about yourself
          </li>
          <li>
            <span className="num" aria-hidden="true">2</span> Give online or by mail
          </li>
        </ol>
        <p>
          <a href="#give">Already sent us the form? Skip to giving online</a>
        </p>

        <DonorForm giveOnline={giveOnline} />

      </div>
    </PublicPage>
  );
}
