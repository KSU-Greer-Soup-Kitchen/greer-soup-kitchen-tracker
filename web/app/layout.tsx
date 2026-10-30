import type { ReactNode } from "react";
import { Atkinson_Hyperlegible, Libre_Baskerville } from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible was designed for low-vision readers
const body = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-body" });
const heading = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-heading" });

export const metadata = {
  title: {
    default: "Greer Soup Kitchen | Daily Bread Ministries",
    template: "%s | Greer Soup Kitchen",
  },
  description: "Volunteer, give, or ask for help with the Greer Soup Kitchen and Greer STEP, run by Daily Bread Ministries in Greer, SC.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
