"use client";

import { useState } from "react";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";
import { NdaFormData, defaultFormData } from "@/lib/nda-template";
import { generateNdaPdf } from "@/lib/pdf-generator";

interface NdaCreatorProps {
  standardTerms: string;
}

export default function NdaCreator({ standardTerms }: NdaCreatorProps) {
  const [formData, setFormData] = useState<NdaFormData>(defaultFormData);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const blob = await generateNdaPdf(standardTerms, formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Mutual-NDA-${formData.party1Company || "Party1"}-${formData.party2Company || "Party2"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
        <NdaForm
          formData={formData}
          onChange={setFormData}
          onDownload={handleDownload}
          isGenerating={isGenerating}
        />
      </div>
      <div className="hidden lg:block">
        <NdaPreview standardTerms={standardTerms} formData={formData} />
      </div>
    </div>
  );
}
