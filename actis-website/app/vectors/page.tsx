import Link from "next/link";

const vectors = [
  {
    id: "tv-001",
    file: "tv-001-compatible-minimal.zip",
    result: "ACTIS_COMPATIBLE",
    resultClass: "text-emerald-800 bg-emerald-50",
    description: "Minimal valid bundle, all checks pass",
  },
  {
    id: "tv-002",
    file: "tv-002-partial-invalid-signature.zip",
    result: "ACTIS_PARTIAL",
    resultClass: "text-amber-800 bg-amber-50",
    description: "Invalid signature on one round",
  },
  {
    id: "tv-003",
    file: "tv-003-noncompliant-schema-fail.zip",
    result: "ACTIS_NONCOMPLIANT",
    resultClass: "text-red-800 bg-red-50",
    description: "Wrong transcript_version",
  },
  {
    id: "tv-004",
    file: "tv-004-noncompliant-hash-chain-break.zip",
    result: "ACTIS_NONCOMPLIANT",
    resultClass: "text-red-800 bg-red-50",
    description: "Hash chain break at round 1",
  },
  {
    id: "tv-005",
    file: "tv-005-noncompliant-checksum-tamper.zip",
    result: "ACTIS_NONCOMPLIANT",
    resultClass: "text-red-800 bg-red-50",
    description: "Checksum tampered post-generation",
  },
  {
    id: "tv-006",
    file: "tv-006-noncompliant-missing-manifest.zip",
    result: "ACTIS_NONCOMPLIANT",
    resultClass: "text-red-800 bg-red-50",
    description: "Missing manifest.json",
  },
  {
    id: "tv-007",
    file: "tv-007-compatible-with-failure-event.zip",
    result: "ACTIS_COMPATIBLE",
    resultClass: "text-emerald-800 bg-emerald-50",
    description: "Valid bundle with failure_event",
  },
  {
    id: "tv-008",
    file: "tv-008-partial-zero-signatures.zip",
    result: "ACTIS_PARTIAL",
    resultClass: "text-amber-800 bg-amber-50",
    description: "Zero valid signatures",
  },
];

export default function VectorsPage() {
  return (
    <div className="max-w-[65ch] mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-6">
        Test Vectors
      </h1>
      <p className="text-[#1a1a1a] mb-10">
        The ACTIS v1.0 conformance test vector corpus provides eight reference
        bundles covering all conformance levels and failure modes. ACTIS verifier
        implementations MUST produce the expected result for all eight vectors
        to claim ACTIS Verifier Conformance.
      </p>

      <div className="overflow-x-auto mb-10">
        <table className="w-full border-collapse border border-[#e5e5e5]">
          <thead>
            <tr className="bg-[#fafafa]">
              <th
                scope="col"
                className="border border-[#e5e5e5] px-3 py-2 text-left font-semibold text-[#1a1a1a]"
              >
                Vector ID
              </th>
              <th
                scope="col"
                className="border border-[#e5e5e5] px-3 py-2 text-left font-semibold text-[#1a1a1a]"
              >
                Expected Result
              </th>
              <th
                scope="col"
                className="border border-[#e5e5e5] px-3 py-2 text-left font-semibold text-[#1a1a1a]"
              >
                Description
              </th>
              <th
                scope="col"
                className="border border-[#e5e5e5] px-3 py-2 text-left font-semibold text-[#1a1a1a]"
              >
                Download
              </th>
            </tr>
          </thead>
          <tbody>
            {vectors.map((v) => (
              <tr key={v.id} className="border-b border-[#e5e5e5]">
                <td className="border border-[#e5e5e5] px-3 py-2 font-mono text-sm text-[#1a1a1a]">
                  {v.id}
                </td>
                <td className="border border-[#e5e5e5] px-3 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-sm font-mono ${v.resultClass}`}
                  >
                    {v.result}
                  </span>
                </td>
                <td className="border border-[#e5e5e5] px-3 py-2 text-[#1a1a1a]">
                  {v.description}
                </td>
                <td className="border border-[#e5e5e5] px-3 py-2">
                  <Link
                    href={`/vectors/v1/${v.file}`}
                    className="text-sm underline text-[#1a1a1a]"
                    download
                  >
                    Download
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-semibold text-[#1a1a1a] mb-3">Corpus artifacts</p>
      <ul className="space-y-2 text-sm text-[#1a1a1a]">
        <li>
          expected_results.json{" "}
          <Link
            href="/vectors/v1/expected_results.json"
            className="underline"
            download
          >
            [Download]
          </Link>
        </li>
        <li>
          MANIFEST.sha256{" "}
          <Link
            href="/vectors/v1/MANIFEST.sha256"
            className="underline"
            download
          >
            [Download]
          </Link>
        </li>
        <li>
          VECTORS_VERSION{" "}
          <Link
            href="/vectors/v1/VECTORS_VERSION"
            className="underline"
            download
          >
            [Download]
          </Link>
        </li>
      </ul>
    </div>
  );
}
