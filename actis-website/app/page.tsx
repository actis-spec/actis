import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-[640px] mx-auto px-6 py-16">
      <section className="mb-12">
        <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-1">
          ACTIS v1.0
        </h1>
        <p className="text-lg text-[#1a1a1a]">
          Audit-Compliant Transaction Integrity Standard
        </p>
      </section>

      <p className="text-lg text-[#1a1a1a] mb-8">
        Vendor-neutral standard for cryptographic integrity verification and
        deterministic replay of transaction evidence.
      </p>

      <div className="border-l-4 border-[#e5e5e5] pl-4 py-2 mb-12 text-[#1a1a1a]">
        <p className="font-medium">
          ACTIS answers one question: &ldquo;Is this evidence cryptographically
          intact and deterministically reproducible?&rdquo;
        </p>
      </div>

      <nav className="flex flex-wrap gap-x-6 gap-y-2 mb-12 text-sm" aria-label="Quick links">
        <Link href="/spec" className="text-[#1a1a1a] underline hover:no-underline">
          Read the spec →
        </Link>
        <Link href="/start" className="text-[#1a1a1a] underline hover:no-underline">
          Start here →
        </Link>
        <Link href="/schemas" className="text-[#1a1a1a] underline hover:no-underline">
          Download schema →
        </Link>
        <Link href="/vectors" className="text-[#1a1a1a] underline hover:no-underline">
          View test vectors →
        </Link>
      </nav>

      <dl className="space-y-8 text-[#1a1a1a]">
        <div>
          <dt className="font-semibold mb-2">What ACTIS proves</dt>
          <dd className="space-y-1 text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li>Integrity of evidence bundles</li>
              <li>Hash-chain correctness</li>
              <li>Signature validity</li>
              <li>Deterministic replay</li>
            </ul>
          </dd>
        </div>
        <div>
          <dt className="font-semibold mb-2">What ACTIS does not do</dt>
          <dd className="space-y-1 text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li>Adjudication or blame assignment</li>
              <li>Settlement or payment rails</li>
              <li>Reputation or risk scoring</li>
              <li>Compliance certification</li>
            </ul>
          </dd>
        </div>
        <div>
          <dt className="font-semibold mb-2">Implementation resources</dt>
          <dd className="space-y-1 text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <Link href="/spec" className="underline">Standard</Link> — normative specification
              </li>
              <li>
                <Link href="/spec" className="underline">Compatibility rules</Link> — conformance levels and decision tree
              </li>
              <li>
                <Link href="/schemas" className="underline">Schema</Link> — transcript JSON schema
              </li>
              <li>
                <Link href="/vectors" className="underline">Test vectors</Link> — conformance test corpus
              </li>
              <li>
                <Link href="/governance" className="underline">Governance</Link> — versioning and change process
              </li>
              <li>
                <Link href="/ip" className="underline">IP commitment</Link> — patent non-assert and contribution license
              </li>
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  );
}
