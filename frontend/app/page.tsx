"use client";

import { useState, useRef } from "react";
import DocumentCreator from "@/components/DocumentCreator";

export default function Home() {
  // Auth state
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("prelegal_token") : null
  );
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Template state
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);

  // Download ref
  const downloadRef = useRef<(() => Promise<void>) | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [templateError, setTemplateError] = useState<string | null>(null);

  async function handleTemplateSelected(id: string) {
    setTemplateError(null);
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`Failed to load template: ${res.status}`);
      const data = await res.json();
      setTemplateId(data.id);
      setTemplateName(data.name);
      setTemplateContent(data.content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load template";
      setTemplateError(msg);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Registration failed");
        }
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Login failed");
      }
      const data = await res.json();
      sessionStorage.setItem("prelegal_token", data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleDownload() {
    if (!downloadRef.current) return;
    setIsGenerating(true);
    try {
      await downloadRef.current();
    } finally {
      setIsGenerating(false);
    }
  }

  // Auth gate
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Prelegal</h1>
          <p className="text-sm text-gray-500 mb-6">
            {authMode === "login" ? "Sign in to continue" : "Create an account"}
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                minLength={3}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>
            {authError && (
              <p className="text-sm text-red-600">{authError}</p>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {authLoading
                ? "..."
                : authMode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            {authMode === "login" ? (
              <>
                No account?{" "}
                <button
                  onClick={() => { setAuthMode("register"); setAuthError(null); }}
                  className="text-blue-600 hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Have an account?{" "}
                <button
                  onClick={() => { setAuthMode("login"); setAuthError(null); }}
                  className="text-blue-600 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {templateName || "Prelegal"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {templateName
                ? `Chat with AI to generate your ${templateName}`
                : "Chat with AI to draft your legal document"}
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={isGenerating || !templateContent}
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Download PDF"}
          </button>
        </div>
        {templateError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
            <p className="text-sm text-red-600">{templateError}</p>
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DocumentCreator
          templateContent={templateContent}
          templateName={templateName}
          templateId={templateId}
          token={token}
          downloadRef={downloadRef}
          onTemplateSelected={handleTemplateSelected}
        />
      </main>
    </div>
  );
}
