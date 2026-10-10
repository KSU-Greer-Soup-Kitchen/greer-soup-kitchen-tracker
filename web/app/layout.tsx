import type { ReactNode } from "react";

export const metadata = {
  title: "Greer Soup Kitchen",
  description: "Volunteer, donor, and assistance forms for Daily Bread Ministries",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
