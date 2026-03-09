import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }) => (
          <pre className="bg-[#f5f5f5] border border-[#e5e5e5] p-4 rounded text-sm overflow-x-auto font-mono">
            {children}
          </pre>
        ),
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code
                className="bg-[#f5f5f5] border border-[#e5e5e5] px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          }
          return <code className={className} {...props}>{children}</code>;
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-[#e5e5e5]">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[#fafafa]">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-[#e5e5e5] px-3 py-2 text-left font-semibold text-[#1a1a1a]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-[#e5e5e5] px-3 py-2 text-[#1a1a1a]">
            {children}
          </td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-[#e5e5e5] pl-4 my-4 text-[#1a1a1a]">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
