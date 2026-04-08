"use client";

import { useState, useEffect, useRef } from "react";
import DocumentChat from "./DocumentChat";
import DocumentPreview from "./DocumentPreview";
import { generatePdf } from "@/lib/pdf-generator";

interface DocumentCreatorProps {
  templateContent: string | null;
  templateName: string | null;
  templateId: string | null;
  token: string;
  downloadRef: React.MutableRefObject<(() => Promise<void>) | null>;
  onTemplateSelected: (templateId: string) => void;
}

export default function DocumentCreator({
  templateContent,
  templateName,
  templateId,
  token,
  downloadRef,
  onTemplateSelected,
}: DocumentCreatorProps) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  useEffect(() => {
    if (!templateContent || !templateName) {
      downloadRef.current = null;
      return;
    }
    const content = templateContent;
    const name = templateName;
    downloadRef.current = async () => {
      try {
        const blob = await generatePdf(content, fieldsRef.current, name);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name.replace(/\s+/g, "-")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Failed to generate PDF. Please try again.");
      }
    };
  }, [templateContent, templateName, downloadRef]);

  function handleFieldsExtracted(newFields: Record<string, string>) {
    setFields((prev) => ({ ...prev, ...newFields }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      <div className="min-h-0">
        <DocumentChat
          token={token}
          templateId={templateId}
          onFieldsExtracted={handleFieldsExtracted}
          onTemplateSelected={onTemplateSelected}
        />
      </div>
      <div className="hidden lg:block min-h-0">
        <DocumentPreview
          templateContent={templateContent}
          fields={fields}
        />
      </div>
    </div>
  );
}
