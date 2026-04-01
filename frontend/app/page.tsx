"use client";

import { useState, useEffect } from "react";
import NdaCreator from "@/components/NdaCreator";

export default function Home() {
  const [standardTerms, setStandardTerms] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates/mutual-nda")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load template: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setStandardTerms(data.content);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading template...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mutual NDA Creator
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Generate a Mutual Non-Disclosure Agreement based on the CommonPaper
              standard template
            </p>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NdaCreator standardTerms={standardTerms} />
      </main>
    </div>
  );
}
