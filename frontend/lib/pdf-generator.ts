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
  renderCoverPage,
  renderStandardTerms,
  fillPlaceholder,
  formatDate,
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
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 6,
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
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingVertical: 4,
  },
  tableHeader: {
    flexDirection: "row",
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
    // Party table
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
      ...["Name", "Title", "Company", "Notice Address", "Date"].map((label) => {
        let v1 = "";
        let v2 = "";
        if (label === "Name") { v1 = fp(formData.party1Name); v2 = fp(formData.party2Name); }
        else if (label === "Title") { v1 = fp(formData.party1Title); v2 = fp(formData.party2Title); }
        else if (label === "Company") { v1 = fp(formData.party1Company); v2 = fp(formData.party2Company); }
        else if (label === "Notice Address") { v1 = fp(formData.party1Address); v2 = fp(formData.party2Address); }
        else if (label === "Date") { v1 = formatDate(formData.effectiveDate); v2 = formatDate(formData.effectiveDate); }
        return createElement(
          View,
          { key: label, style: styles.tableRow },
          createElement(Text, { style: styles.tableCellLabel }, label),
          createElement(Text, { style: styles.tableCell }, v1),
          createElement(Text, { style: styles.tableCell }, v2)
        );
      })
    )
  );
}

function parseStandardTermsForPdf(template: string, formData: NdaFormData) {
  let text = template;
  text = text.replace(/<span class="coverpage_link">Purpose<\/span>/g, fillPlaceholder(formData.purpose, "Purpose"));
  text = text.replace(/<span class="coverpage_link">Effective Date<\/span>/g, formatDate(formData.effectiveDate));
  text = text.replace(/<span class="coverpage_link">MNDA Term<\/span>/g,
    formData.mndaTermType === "expires" ? `${formData.mndaTermYears} year(s)` : "until terminated"
  );
  text = text.replace(/<span class="coverpage_link">Term of Confidentiality<\/span>/g,
    formData.confidentialityTermType === "years" ? `${formData.confidentialityTermYears} year(s)` : "perpetuity"
  );
  text = text.replace(/<span class="coverpage_link">Governing Law<\/span>/g, fillPlaceholder(formData.governingLaw, "___________"));
  text = text.replace(/<span class="coverpage_link">Jurisdiction<\/span>/g, fillPlaceholder(formData.jurisdiction, "___________"));
  text = text.replace(/<span[^>]*>/g, "");
  text = text.replace(/<\/span>/g, "");

  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const elements: ReturnType<typeof createElement>[] = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      elements.push(
        createElement(Text, { key: line, style: styles.title }, line.slice(2))
      );
    } else {
      // Strip markdown bold markers for PDF
      const cleanLine = line.replace(/\*\*/g, "");
      elements.push(
        createElement(Text, { key: line, style: styles.paragraph }, cleanLine)
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
      { size: "A4", style: styles.page },
      createElement(CoverPagePdf, { formData }),
      createElement(View, { style: styles.divider }),
      ...parseStandardTermsForPdf(standardTerms, formData),
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
