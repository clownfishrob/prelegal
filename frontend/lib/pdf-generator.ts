import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { createElement } from "react";
import { fillTemplate } from "./template-utils";

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
  subtitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    marginBottom: 6,
    textAlign: "justify",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
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
  tableCellBold: {
    flex: 1,
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

function markdownToPdfElements(markdown: string) {
  const lines = markdown.split("\n").filter((l) => l.trim() !== "");
  const elements: ReturnType<typeof createElement>[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let clean = line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    clean = clean.replace(/\*\*/g, "");

    if (line.startsWith("# ")) {
      elements.push(
        createElement(Text, { key: `l-${i}`, style: styles.title }, clean.slice(2))
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        createElement(Text, { key: `l-${i}`, style: styles.subtitle }, clean.slice(3))
      );
    } else if (line.startsWith("|")) {
      const tableLines: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].startsWith("|")) {
        i++;
        tableLines.push(lines[i]);
      }
      const rows = tableLines.filter((l) => !l.match(/^\|[\s:-]+\|/));
      const tableRows = rows.map((row, ri) => {
        const cells = row
          .split("|")
          .filter((c) => c.trim() !== "")
          .map((c) => c.trim().replace(/\*\*/g, ""));
        return createElement(
          View,
          { key: `tr-${i}-${ri}`, style: ri === 0 ? styles.tableHeader : styles.tableRow },
          ...cells.map((cell, ci) =>
            createElement(
              Text,
              { key: `tc-${ci}`, style: ri === 0 ? styles.tableCellBold : styles.tableCell },
              cell
            )
          )
        );
      });
      elements.push(
        createElement(View, { key: `tbl-${i}`, style: styles.table }, ...tableRows)
      );
    } else {
      elements.push(
        createElement(Text, { key: `l-${i}`, style: styles.paragraph }, clean)
      );
    }
  }

  return elements;
}

export async function generatePdf(
  templateContent: string,
  fields: Record<string, string>,
  documentName: string
): Promise<Blob> {
  const filled = fillTemplate(templateContent, fields);
  const contentElements = markdownToPdfElements(filled);

  const doc = createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", style: styles.page, wrap: true },
      createElement(View, { wrap: true }, ...contentElements),
      createElement(
        Text,
        { style: styles.footer },
        `CommonPaper ${documentName} — free to use under CC BY 4.0.`
      )
    )
  );

  return await pdf(doc).toBlob();
}
