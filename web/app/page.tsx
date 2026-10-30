import Link from "next/link";
import { Icon } from "./components/Icon";
import { PublicPage } from "./components/SiteChrome";

export default function HomePage() {
  return (
    <PublicPage current="/">
      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">Greer Soup Kitchen &amp; Greer STEP</span>
          <h1>Everyone is welcome at our table.</h1>
          <p className="lead">How can we help you today? Pick one of the choices below. Each form is short and only asks what we need.</p>
        </div>
      </section>

      <div className="container" style={{ paddingTop: 0 }}>
        <section className="action-cards" aria-label="Choose a form">
          <div className="action-card">
            <span className="icon-badge">
              <Icon name="hands" />
            </span>
            <h2>Volunteer</h2>
            <p>Help serve meals or support families in the STEP program. Tell us when you are free and we will contact you.</p>
            <Link className="button button-wide" href="/volunteer">
              Sign up to volunteer
            </Link>
          </div>
          <div className="action-card">
            <span className="icon-badge">
              <Icon name="heart" />
            </span>
            <h2>Donate</h2>
            <p>Give online, by check, or in honor or memory of someone you love.</p>
            <Link className="button button-wide" href="/donate">
              Give now
            </Link>
          </div>
          <div className="action-card">
            <span className="icon-badge">
              <Icon name="home" />
            </span>
            <h2>Need help?</h2>
            <p>If you or your family need help, tell us what you need and the best way to reach you.</p>
            <Link className="button button-wide" href="/get-help">
              Ask for help
            </Link>
          </div>
        </section>

        <section className="section" aria-labelledby="about-heading">
          <h2 id="about-heading">Two programs, one mission</h2>
          <p className="lead">
            Daily Bread Ministries is a non-profit in Greer, South Carolina, started by local citizens in 1990. We receive no government or United Way
            funding. We rely on gifts from local people, businesses, and churches.
          </p>
          <div className="programs">
            <div className="program program-kitchen">
              <span className="eyebrow">Open 365 days a year</span>
              <h3>Greer Soup Kitchen</h3>
              <p>
                Over 150 free, hot, healthy meals every day in a restaurant-style dining room. Everyone is welcome. No form is needed for a meal.
              </p>
            </div>
            <div className="program program-step">
              <span className="eyebrow">Two-year program</span>
              <h3>Greer STEP</h3>
              <p>
                Shelter to Empower People. Homeless families get a place to live and support with jobs, savings, and finding a home of their own.
              </p>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="contact-heading">
          <h2 id="contact-heading">Visit or contact us</h2>
          <div className="info-grid">
            <div className="info-block">
              <h3>Meals served</h3>
              <p>
                <strong>Monday to Saturday:</strong> Lunch, 11:30 AM to 12:30 PM
              </p>
              <p>
                <strong>Sunday:</strong> Supper, 4:00 PM to 5:00 PM
              </p>
            </div>
            <div className="info-block">
              <h3>Volunteers on site</h3>
              <p>
                <strong>Monday to Saturday:</strong> 8:00 AM to 1:00 PM
              </p>
              <p>
                <strong>Sunday:</strong> 4:00 PM to 5:30 PM
              </p>
            </div>
            <div className="info-block">
              <h3>Call or email</h3>
              <p>
                Soup Kitchen: <a href="tel:+18649680323">864-968-0323</a>
              </p>
              <p>
                STEP: <a href="tel:+18643345265">864-334-5265</a>
              </p>
              <p>
                <a href="mailto:mlbennett1116@gmail.com">mlbennett1116@gmail.com</a>
              </p>
            </div>
            <div className="info-block">
              <h3>Find us</h3>
              <p>Soup Kitchen: 521 E. Poinsett St., Greer, SC</p>
              <p>STEP: 511 E. Poinsett St., Greer, SC</p>
              <p>Mail: PO Box 2344, Greer, SC 29652</p>
            </div>
          </div>
        </section>
      </div>
    </PublicPage>
  );
}
