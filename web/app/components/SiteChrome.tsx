// Header and footer for the public pages.

import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/donate", label: "Donate" },
  { href: "/get-help", label: "Get Help" },
];

export function SiteHeader({ current }: { current: string }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Daily Bread Ministries, Greer Soup Kitchen. Go to home page" width={170} height={90} />
        </Link>
        <nav className="main-nav" aria-label="Main">
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} aria-current={current === link.href ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link className="nav-staff" href="/staff">
                Staff Login
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          <strong>Daily Bread Ministries</strong> &middot; Greer Soup Kitchen &amp; Greer STEP
          <br />
          PO Box 2344, Greer, SC 29652
        </p>
        <p>
          Soup Kitchen: <a href="tel:+18649680323">864-968-0323</a>
          <br />
          STEP: <a href="tel:+18643345265">864-334-5265</a>
        </p>
      </div>
    </footer>
  );
}

export function PublicPage({ current, children }: { current: string; children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <SiteHeader current={current} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
