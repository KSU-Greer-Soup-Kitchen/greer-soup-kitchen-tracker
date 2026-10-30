import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaff } from "../../../lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Staff Login", robots: { index: false } };

export default async function LoginPage() {
  if (await getStaff()) {
    redirect("/staff");
  }
  return (
    <main className="login-wrap" id="main">
      <div className="login-card">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-img" src="/logo.png" alt="Daily Bread Ministries, Greer Soup Kitchen. Go to home page" width={220} height={117} />
        </Link>
        <LoginForm />
        <p style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link href="/">Back to the public site</Link>
        </p>
      </div>
    </main>
  );
}
