"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "ACTIS" },
  { href: "/start", label: "Start" },
  { href: "/spec", label: "Spec" },
  { href: "/schemas", label: "Schemas" },
  { href: "/vectors", label: "Vectors" },
  { href: "/governance", label: "Governance" },
  { href: "/ip", label: "IP" },
  { href: "/github", label: "GitHub" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#e5e5e5] bg-white">
      <nav
        className="max-w-content mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, label }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm text-[#1a1a1a] hover:text-[#111] ${
                isActive ? "font-semibold underline underline-offset-4" : ""
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
