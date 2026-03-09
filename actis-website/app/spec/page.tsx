import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { DocLayout } from "@/components/DocLayout";
import { Markdown } from "@/components/Markdown";

const GITHUB_RAW =
  "https://github.com/actis-spec/actis/raw/main/docs";

export default function SpecPage() {
  const standardPath = join(process.cwd(), "content", "ACTIS_STANDARD_v1.md");
  const compatibilityPath = join(
    process.cwd(),
    "content",
    "ACTIS_COMPATIBILITY.md"
  );
  const standardContent = readFileSync(standardPath, "utf-8");
  const compatibilityContent = readFileSync(compatibilityPath, "utf-8");

  return (
    <article className="max-w-[65ch] mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
        ACTIS v1.0 Specification
      </h1>
      <p className="text-sm text-[#666] mb-6">
        Version 1.0 · Normative
      </p>
      <p className="text-sm text-[#1a1a1a] mb-8">
        <Link
          href={`${GITHUB_RAW}/ACTIS_STANDARD_v1.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline mr-4"
        >
          View ACTIS_STANDARD_v1.md
        </Link>
        <Link
          href={`${GITHUB_RAW}/ACTIS_COMPATIBILITY.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          View ACTIS_COMPATIBILITY.md
        </Link>
      </p>
      <div className="prose prose-neutral max-w-none prose-headings:font-semibold prose-headings:text-[#1a1a1a] prose-pre:bg-[#f5f5f5] prose-pre:border prose-pre:border-[#e5e5e5] prose-pre:text-sm prose-table:border-collapse prose-th:border prose-th:border-[#e5e5e5] prose-th:bg-[#fafafa] prose-td:border prose-td:border-[#e5e5e5]">
        <Markdown content={standardContent} />
        <Markdown content={compatibilityContent} />
      </div>
    </article>
  );
}
