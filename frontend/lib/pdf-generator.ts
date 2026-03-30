import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { createElement } from "react";
import { NdaFormData } from "./nda-template";
import {
  fillPlaceholder,
  formatDate,
  escapeHtml,
} from "@/components/NdaPreview";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  paragraph: {
    marginBottom: 6,
    textAlign: "justify",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  label: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  fieldValue: {
    marginBottom: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    marginVertical: 16,
  },
  table: {
    marginTop: 12,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: "row" as const,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingVertical: 4,
  },
  tableHeader: {
    flexDirection: "row" as const,
    borderBottomWidth: 2,
    borderBottomColor: "#333333",
    paddingVertical: 4,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
    fontSize: 9,
  },
  tableCellLabel: {
    width: 80,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    fontSize: 8,
    color: "#888888",
    marginTop: 20,
    fontStyle: "italic",
  },
});

function CoverPagePdf({ formData }: { formData: NdaFormData }) {
  const mndaTerm =
    formData.mndaTermType === "expires"
      ? `Expires ${formData.mndaTermYears} year(s) from Effective Date.`
      : "Continues until terminated in accordance with the terms of the MNDA.";

  const confidentialityTerm =
    formData.confidentialityTermType === "years"
      ? `${formData.confidentialityTermYears} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
      : "In perpetuity.";

  const fp = (val: string) => fillPlaceholder(val, "___________");

  const partyRows = [
    { label: "Name", v1: fp(formData.party1Name), v2: fp(formData.party2Name) },
    { label: "Title", v1: fp(formData.party1Title), v2: fp(formData.party2Title) },
    { label: "Company", v1: fp(formData.party1Company), v2: fp(formData.party2Company) },
    { label: "Notice Address", v1: fp(formData.party1Address), v2: fp(formData.party2Address) },
    { label: "Date", v1: formatDate(formData.effectiveDate), v2: formatDate(formData.effectiveDate) },
  ];

  return createElement(
    View,
    null,
    createElement(Text, { style: styles.title }, "Mutual Non-Disclosure Agreement"),
    createElement(
      Text,
      { style: styles.paragraph },
      'This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page and (2) the Common Paper Mutual NDA Standard Terms Version 1.0.'
    ),
    createElement(Text, { style: styles.label }, "Purpose:"),
    createElement(Text, { style: styles.fieldValue }, fp(formData.purpose)),
    createElement(Text, { style: styles.label }, "Effective Date:"),
    createElement(Text, { style: styles.fieldValue }, formatDate(formData.effectiveDate)),
    createElement(Text, { style: styles.label }, "MNDA Term:"),
    createElement(Text, { style: styles.fieldValue }, mndaTerm),
    createElement(Text, { style: styles.label }, "Term of Confidentiality:"),
    createElement(Text, { style: styles.fieldValue }, confidentialityTerm),
    createElement(Text, { style: styles.label }, "Governing Law:"),
    createElement(Text, { style: styles.fieldValue }, fp(formData.governingLaw)),
    createElement(Text, { style: styles.label }, "Jurisdiction:"),
    createElement(Text, { style: styles.fieldValue }, fp(formData.jurisdiction)),
    formData.modifications
      ? createElement(
          View,
          null,
          createElement(Text, { style: styles.label }, "MNDA Modifications:"),
          createElement(Text, { style: styles.fieldValue }, formData.modifications)
        )
      : null,
    createElement(
      Text,
      { style: [styles.paragraph, { marginTop: 12 }] },
      "By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date."
    ),
    createElement(
      View,
      { style: styles.table },
      createElement(
        View,
        { style: styles.tableHeader },
        createElement(Text, { style: styles.tableCellLabel }, ""),
        createElement(Text, { style: [styles.tableCell, styles.bold] }, "Party 1"),
        createElement(Text, { style: [styles.tableCell, styles.bold] }, "Party 2")
      ),
      ...partyRows.map((row) =>
        createElement(
          View,
          { key: row.label, style: styles.tableRow },
          createElement(Text, { style: styles.tableCellLabel }, row.label),
          createElement(Text, { style: styles.tableCell }, row.v1),
          createElement(Text, { style: styles.tableCell }, row.v2)
        )
      )
    )
  );
}

function parseStandardTermsForPdf(template: string, formData: NdaFormData) {
  let text = template;
  text = text.replace(/<span class="coverpage_link">Purpose<\/span>/g, escapeHtml(fillPlaceholder(formData.purpose, "Purpose")));
  text = text.replace(/<span class="coverpage_link">Effective Date<\/span>/g, escapeHtml(formatDate(formData.effectiveDate)));
  text = text.replace(/<span class="coverpage_link">MNDA Term<\/span>/g,
    escapeHtml(formData.mndaTermType === "expires" ? `${formData.mndaTermYears} year(s)` : "until terminated")
  );
  text = text.replace(/<span class="coverpage_link">Term of Confidentiality<\/span>/g,
    escapeHtml(formData.confidentialityTermType === "years" ? `${formData.confidentialityTermYears} year(s)` : "perpetuity")
  );
  text = text.replace(/<span class="coverpage_link">Governing Law<\/span>/g, escapeHtml(fillPlaceholder(formData.governingLaw, "___________")));
  text = text.replace(/<span class="coverpage_link">Jurisdiction<\/span>/g, escapeHtml(fillPlaceholder(formData.jurisdiction, "___________")));
  text = text.replace(/<span[^>]*>/g, "");
  text = text.replace(/<\/span>/g, "");

  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const elements: ReturnType<typeof createElement>[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Strip markdown links and bold markers for PDF
    let cleanLine = line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    cleanLine = cleanLine.replace(/\*\*/g, "");

    if (line.startsWith("# ")) {
      elements.push(
        createElement(Text, { key: `line-${i}`, style: styles.title }, cleanLine.slice(2))
      );
    } else {
      elements.push(
        createElement(Text, { key: `line-${i}`, style: styles.paragraph }, cleanLine)
      );
    }
  }

  return elements;
}

export async function generateNdaPdf(
  standardTerms: string,
  formData: NdaFormData
): Promise<Blob> {
  const doc = createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", style: styles.page, wrap: true },
      createElement(CoverPagePdf, { formData }),
      createElement(View, { style: styles.divider }),
      createElement(
        View,
        { wrap: true },
        ...parseStandardTermsForPdf(standardTerms, formData)
      ),
      createElement(
        Text,
        { style: styles.footer },
        "Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0."
      )
    )
  );

  const blob = await pdf(doc).toBlob();
  return blob;
}
