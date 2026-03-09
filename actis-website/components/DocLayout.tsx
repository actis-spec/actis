import { ReactNode } from "react";

interface DocLayoutProps {
  title?: string;
  children: ReactNode;
}

export function DocLayout({ title, children }: DocLayoutProps) {
  return (
    <article className="max-w-[65ch] mx-auto px-6 py-12">
      {title && (
        <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-8">{title}</h1>
      )}
      <div className="prose prose-neutral max-w-none prose-headings:font-semibold prose-headings:text-[#1a1a1a] prose-p:text-[#1a1a1a] prose-a:text-[#1a1a1a] prose-a:underline prose-li:text-[#1a1a1a] prose-blockquote:border-l-[#e5e5e5] prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:not-italic prose-pre:bg-[#f5f5f5] prose-pre:border prose-pre:border-[#e5e5e5] prose-pre:text-sm prose-table:border-collapse prose-th:border prose-th:border-[#e5e5e5] prose-th:bg-[#fafafa] prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-[#e5e5e5] prose-td:px-3 prose-td:py-2">
        {children}
      </div>
    </article>
  );
}
