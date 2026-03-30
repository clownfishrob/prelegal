import fs from "fs";
import path from "path";
import NdaCreator from "@/components/NdaCreator";

function loadTemplate(filename: string): string {
  const templatesDir = path.join(process.cwd(), "..", "templates");
  return fs.readFileSync(path.join(templatesDir, filename), "utf-8");
}

export default function Home() {
  const standardTerms = loadTemplate("Mutual-NDA.md");

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
