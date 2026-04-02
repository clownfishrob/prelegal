"use client";

import { fillTemplate } from "@/lib/template-utils";

interface DocumentPreviewProps {
  templateContent: string | null;
  fields: Record<string, string>;
}

function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function renderInlineParts(line: string): React.ReactNode[] {
  const cleaned = stripMarkdownLinks(line);
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, pi) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={pi} className="font-semibold text-gray-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={pi}>{part}</span>
    )
  );
}

function MarkdownBlock({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl font-bold mb-4 text-gray-900">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-semibold mb-2 mt-4 text-gray-900">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("|")) {
      const tableLines: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].startsWith("|")) {
        i++;
        tableLines.push(lines[i]);
      }
      const rows = tableLines.filter((l) => !l.match(/^\|[\s:-]+\|/));
      elements.push(
        <table key={i} className="w-full border-collapse text-sm my-4">
          <tbody>
            {rows.map((row, ri) => {
              const cells = row
                .split("|")
                .filter((c) => c.trim() !== "")
                .map((c) => c.trim());
              const Tag = ri === 0 ? "th" : "td";
              return (
                <tr key={ri} className={ri === 0 ? "bg-gray-50" : ""}>
                  {cells.map((cell, ci) => (
                    <Tag
                      key={ci}
                      className={`border border-gray-200 px-3 py-2 ${
                        ri === 0 ? "font-semibold text-gray-700" : "text-gray-600"
                      } ${ci === 0 ? "text-left" : "text-center"}`}
                    >
                      {cell}
                    </Tag>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1">
          {renderInlineParts(line)}
        </p>
      );
    }
  }

  return <>{elements}</>;
}

export default function DocumentPreview({
  templateContent,
  fields,
}: DocumentPreviewProps) {
  if (!templateContent) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-h-[calc(100vh-8rem)] flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          Select a document to see the preview
        </p>
      </div>
    );
  }

  const filled = fillTemplate(templateContent, fields);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <MarkdownBlock content={filled} />
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 italic">
          CommonPaper legal document template, free to use under CC BY 4.0.
        </p>
      </div>
    </div>
  );
}

export { MarkdownBlock };
