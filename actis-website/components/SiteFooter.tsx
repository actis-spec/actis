import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e5e5e5] bg-white mt-auto">
      <div className="max-w-content mx-auto px-6 py-6 text-sm text-[#1a1a1a]">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>ACTIS Standard</span>
          <span aria-hidden>·</span>
          <span>actis.world</span>
          <span aria-hidden>·</span>
          <a
            href="mailto:info@actis.world"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            info@actis.world
          </a>
          <span aria-hidden>·</span>
          <a
            href="https://github.com/actis-spec/actis"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
