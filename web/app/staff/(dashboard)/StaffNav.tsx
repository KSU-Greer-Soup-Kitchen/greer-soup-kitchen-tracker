"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../../components/Icon";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/staff", label: "Overview", icon: "dashboard" },
  { href: "/staff/donations", label: "Gifts", icon: "gift" },
  { href: "/staff/donors", label: "Donors", icon: "heart" },
  { href: "/staff/volunteers", label: "Volunteers", icon: "users" },
  { href: "/staff/help", label: "Help requests", icon: "help" },
  { href: "/staff/reports", label: "Reports", icon: "chart" },
  { href: "/staff/email", label: "Email volunteers", icon: "mail" },
];

export function StaffNav() {
  const path = usePathname();
  return (
    <nav className="staff-nav" aria-label="Staff">
      <ul>
        {LINKS.map((link) => {
          const current = link.href === "/staff" ? path === "/staff" : path.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link href={link.href} aria-current={current ? "page" : undefined}>
                <Icon name={link.icon} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
