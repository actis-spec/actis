import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DocLayout } from "@/components/DocLayout";
import { Markdown } from "@/components/Markdown";

export default function GovernancePage() {
  const contentPath = join(process.cwd(), "content", "GOVERNANCE.md");
  const content = readFileSync(contentPath, "utf-8");

  return (
    <DocLayout title="Governance">
      <Markdown content={content} />
    </DocLayout>
  );
}
