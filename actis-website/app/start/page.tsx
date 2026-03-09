import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DocLayout } from "@/components/DocLayout";
import { Markdown } from "@/components/Markdown";

export default function StartPage() {
  const contentPath = join(process.cwd(), "content", "START_HERE.md");
  const content = readFileSync(contentPath, "utf-8");

  return (
    <DocLayout title="Start Here">
      <Markdown content={content} />
    </DocLayout>
  );
}
