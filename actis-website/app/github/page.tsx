import Link from "next/link";

const repos = [
  {
    name: "actis-spec/actis",
    description:
      "Normative specification, schemas, and test vector corpus.",
    url: "https://github.com/actis-spec/actis",
  },
  {
    name: "actis-spec/actis-verifier-rust",
    description: "Reference verifier implementation in Rust.",
    url: "https://github.com/actis-spec/actis-verifier-rust",
  },
  {
    name: "actis-spec/actis-website",
    description: "Source for actis.world.",
    url: "https://github.com/actis-spec/actis-website",
  },
];

export default function GitHubPage() {
  return (
    <div className="max-w-[65ch] mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-6">
        Repositories
      </h1>
      <p className="text-[#1a1a1a] mb-10">
        GitHub hosts the canonical ACTIS repositories. actis.world provides
        public documentation and artifact distribution. The specification,
        schema, and test vectors are the authoritative reference artifacts — no
        particular implementation or service is required to implement ACTIS.
      </p>
      <ul className="space-y-8">
        {repos.map((repo) => (
          <li key={repo.name}>
            <Link
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[#1a1a1a] underline hover:no-underline block mb-1"
            >
              {repo.name}
            </Link>
            <p className="text-sm text-[#1a1a1a] mb-1">{repo.description}</p>
            <Link
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#666] underline hover:no-underline"
            >
              {repo.url}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
