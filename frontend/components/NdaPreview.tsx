"use client";

import { NdaFormData } from "@/lib/nda-template";

interface NdaPreviewProps {
  standardTerms: string;
  formData: NdaFormData;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "___________";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fillPlaceholder(value: string, fallback: string): string {
  return value.trim() || fallback;
}

function renderCoverPage(formData: NdaFormData): string {
  const mndaTerm =
    formData.mndaTermType === "expires"
      ? `Expires ${formData.mndaTermYears} year(s) from Effective Date.`
      : "Continues until terminated in accordance with the terms of the MNDA.";

  const confidentialityTerm =
    formData.confidentialityTermType === "years"
      ? `${formData.confidentialityTermYears} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
      : "In perpetuity.";

  return `# Mutual Non-Disclosure Agreement

This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page and (2) the Common Paper Mutual NDA Standard Terms Version 1.0.

**Purpose:** ${fillPlaceholder(formData.purpose, "___________")}

**Effective Date:** ${formatDate(formData.effectiveDate)}

**MNDA Term:** ${mndaTerm}

**Term of Confidentiality:** ${confidentialityTerm}

**Governing Law:** ${fillPlaceholder(formData.governingLaw, "___________")}

**Jurisdiction:** ${fillPlaceholder(formData.jurisdiction, "___________")}

${formData.modifications ? `**MNDA Modifications:** ${formData.modifications}` : ""}

By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.

| | Party 1 | Party 2 |
|:---|:---:|:---:|
| Print Name | ${fillPlaceholder(formData.party1Name, "___________")} | ${fillPlaceholder(formData.party2Name, "___________")} |
| Title | ${fillPlaceholder(formData.party1Title, "___________")} | ${fillPlaceholder(formData.party2Title, "___________")} |
| Company | ${fillPlaceholder(formData.party1Company, "___________")} | ${fillPlaceholder(formData.party2Company, "___________")} |
| Notice Address | ${fillPlaceholder(formData.party1Address, "___________")} | ${fillPlaceholder(formData.party2Address, "___________")} |
| Date | ${formatDate(formData.effectiveDate)} | ${formatDate(formData.effectiveDate)} |`;
}

function renderStandardTerms(
  template: string,
  formData: NdaFormData
): string {
  let text = template;
  // Strip HTML span tags and replace with the form values
  text = text.replace(
    /<span class="coverpage_link">Purpose<\/span>/g,
    fillPlaceholder(formData.purpose, "Purpose")
  );
  text = text.replace(
    /<span class="coverpage_link">Effective Date<\/span>/g,
    formatDate(formData.effectiveDate)
  );
  text = text.replace(
    /<span class="coverpage_link">MNDA Term<\/span>/g,
    formData.mndaTermType === "expires"
      ? `${formData.mndaTermYears} year(s)`
      : "until terminated"
  );
  text = text.replace(
    /<span class="coverpage_link">Term of Confidentiality<\/span>/g,
    formData.confidentialityTermType === "years"
      ? `${formData.confidentialityTermYears} year(s)`
      : "perpetuity"
  );
  text = text.replace(
    /<span class="coverpage_link">Governing Law<\/span>/g,
    fillPlaceholder(formData.governingLaw, "___________")
  );
  text = text.replace(
    /<span class="coverpage_link">Jurisdiction<\/span>/g,
    fillPlaceholder(formData.jurisdiction, "___________")
  );
  // Remove any remaining span tags
  text = text.replace(/<span[^>]*>/g, "");
  text = text.replace(/<\/span>/g, "");
  return text;
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
      // Collect all table lines
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
      // Render inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1">
          {parts.map((part, pi) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={pi} className="font-semibold text-gray-900">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={pi}>{part}</span>
            )
          )}
        </p>
      );
    }
  }

  return <>{elements}</>;
}

export default function NdaPreview({ standardTerms, formData }: NdaPreviewProps) {
  const coverPage = renderCoverPage(formData);
  const filledTerms = renderStandardTerms(standardTerms, formData);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <MarkdownBlock content={coverPage} />
      <hr className="my-6 border-gray-300" />
      <MarkdownBlock content={filledTerms} />
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 italic">
          Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use
          under CC BY 4.0.
        </p>
      </div>
    </div>
  );
}

export { renderCoverPage, renderStandardTerms, fillPlaceholder, formatDate };
