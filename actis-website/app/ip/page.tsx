import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DocLayout } from "@/components/DocLayout";
import { Markdown } from "@/components/Markdown";

export default function IPPage() {
  const contentPath = join(process.cwd(), "content", "ACTIS_IP_COMMITMENT.md");
  const content = readFileSync(contentPath, "utf-8");

  return (
    <DocLayout title="IP Commitment">
      <Markdown content={content} />
    </DocLayout>
  );
}
