import { PublicPage } from "../components/SiteChrome";
import { ContactForm } from "./ContactForm";

export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <PublicPage current="/contact">
      <div className="container narrow">
        <h1>Contact us</h1>
        <p className="lead">Have a question? Send us a message and we will get back to you.</p>
        <div className="note">
          <p>
            <strong>Rather call?</strong> Soup Kitchen: <a href="tel:+18649680323">864-968-0323</a>. STEP:{" "}
            <a href="tel:+18643345265">864-334-5265</a>.
          </p>
        </div>
        <ContactForm />
      </div>
    </PublicPage>
  );
}
