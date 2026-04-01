"use client";

import { useState, useEffect, useRef } from "react";
import NdaChat from "./NdaChat";
import NdaPreview from "./NdaPreview";
import { NdaFormData, defaultFormData } from "@/lib/nda-template";
import { generateNdaPdf } from "@/lib/pdf-generator";

interface NdaCreatorProps {
  standardTerms: string;
  token: string;
  downloadRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

export default function NdaCreator({
  standardTerms,
  token,
  downloadRef,
}: NdaCreatorProps) {
  const [formData, setFormData] = useState<NdaFormData>(defaultFormData);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  useEffect(() => {
    downloadRef.current = async () => {
      const data = formDataRef.current;
      try {
        const blob = await generateNdaPdf(standardTerms, data);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Mutual-NDA-${data.party1Company || "Party1"}-${data.party2Company || "Party2"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Failed to generate PDF. Please try again.");
      }
    };
  }, [standardTerms, downloadRef]);

  function handleFieldsExtracted(fields: Partial<NdaFormData>) {
    setFormData((prev) => ({ ...prev, ...fields }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      <div className="min-h-0">
        <NdaChat
          onFieldsExtracted={handleFieldsExtracted}
          token={token}
        />
      </div>
      <div className="hidden lg:block min-h-0">
        <NdaPreview standardTerms={standardTerms} formData={formData} />
      </div>
    </div>
  );
}
