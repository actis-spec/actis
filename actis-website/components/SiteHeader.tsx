import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/start", label: "Start" },
  { href: "/spec", label: "Spec" },
  { href: "/schemas", label: "Schemas" },
  { href: "/vectors", label: "Vectors" },
  { href: "/governance", label: "Governance" },
  { href: "/ip", label: "IP" },
  { href: "/github", label: "GitHub" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[#e5e5e5] bg-white">
      <nav
        className="max-w-content mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2"
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/actis-logo.png"
            alt="ACTIS"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-sm text-[#1a1a1a] hover:text-[#111]"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
