"use client";

import { NdaFormData } from "@/lib/nda-template";

interface NdaFormProps {
  formData: NdaFormData;
  onChange: (data: NdaFormData) => void;
  onDownload: () => void;
  isGenerating: boolean;
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function NdaForm({
  formData,
  onChange,
  onDownload,
  isGenerating,
}: NdaFormProps) {
  function update(field: keyof NdaFormData, value: string) {
    onChange({ ...formData, [field]: value });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Agreement Details</h2>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to generate your Mutual NDA.
        </p>
      </div>

      <Field label="Purpose" id="purpose">
        <textarea
          id="purpose"
          className={inputClass}
          rows={2}
          value={formData.purpose}
          onChange={(e) => update("purpose", e.target.value)}
        />
      </Field>

      <Field label="Effective Date" id="effectiveDate">
        <input
          id="effectiveDate"
          type="date"
          className={inputClass}
          value={formData.effectiveDate}
          onChange={(e) => update("effectiveDate", e.target.value)}
        />
      </Field>

      <Field label="MNDA Term">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mndaTermType"
              checked={formData.mndaTermType === "expires"}
              onChange={() => update("mndaTermType", "expires")}
            />
            Expires after
            <input
              type="number"
              min="1"
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
              value={formData.mndaTermYears}
              onChange={(e) => update("mndaTermYears", e.target.value)}
              disabled={formData.mndaTermType !== "expires"}
            />
            year(s)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mndaTermType"
              checked={formData.mndaTermType === "continues"}
              onChange={() => update("mndaTermType", "continues")}
            />
            Continues until terminated
          </label>
        </div>
      </Field>

      <Field label="Term of Confidentiality">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={formData.confidentialityTermType === "years"}
              onChange={() => update("confidentialityTermType", "years")}
            />
            <input
              type="number"
              min="1"
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
              value={formData.confidentialityTermYears}
              onChange={(e) =>
                update("confidentialityTermYears", e.target.value)
              }
              disabled={formData.confidentialityTermType !== "years"}
            />
            year(s) (trade secrets protected until no longer applicable)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={formData.confidentialityTermType === "perpetuity"}
              onChange={() => update("confidentialityTermType", "perpetuity")}
            />
            In perpetuity
          </label>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Governing Law (State)" id="governingLaw">
          <input
            id="governingLaw"
            type="text"
            className={inputClass}
            placeholder="e.g. Delaware"
            value={formData.governingLaw}
            onChange={(e) => update("governingLaw", e.target.value)}
          />
        </Field>
        <Field label="Jurisdiction" id="jurisdiction">
          <input
            id="jurisdiction"
            type="text"
            className={inputClass}
            placeholder="e.g. New Castle, DE"
            value={formData.jurisdiction}
            onChange={(e) => update("jurisdiction", e.target.value)}
          />
        </Field>
      </div>

      <Field label="MNDA Modifications (optional)" id="modifications">
        <textarea
          id="modifications"
          className={inputClass}
          rows={2}
          placeholder="List any modifications..."
          value={formData.modifications}
          onChange={(e) => update("modifications", e.target.value)}
        />
      </Field>

      <hr className="border-gray-200" />

      <h2 className="text-lg font-semibold text-gray-900">Party 1</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" id="party1Name">
          <input
            id="party1Name"
            type="text"
            className={inputClass}
            value={formData.party1Name}
            onChange={(e) => update("party1Name", e.target.value)}
          />
        </Field>
        <Field label="Title" id="party1Title">
          <input
            id="party1Title"
            type="text"
            className={inputClass}
            value={formData.party1Title}
            onChange={(e) => update("party1Title", e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Company" id="party1Company">
          <input
            id="party1Company"
            type="text"
            className={inputClass}
            value={formData.party1Company}
            onChange={(e) => update("party1Company", e.target.value)}
          />
        </Field>
        <Field label="Notice Address" id="party1Address">
          <input
            id="party1Address"
            type="text"
            className={inputClass}
            placeholder="Email or postal address"
            value={formData.party1Address}
            onChange={(e) => update("party1Address", e.target.value)}
          />
        </Field>
      </div>

      <hr className="border-gray-200" />

      <h2 className="text-lg font-semibold text-gray-900">Party 2</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" id="party2Name">
          <input
            id="party2Name"
            type="text"
            className={inputClass}
            value={formData.party2Name}
            onChange={(e) => update("party2Name", e.target.value)}
          />
        </Field>
        <Field label="Title" id="party2Title">
          <input
            id="party2Title"
            type="text"
            className={inputClass}
            value={formData.party2Title}
            onChange={(e) => update("party2Title", e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Company" id="party2Company">
          <input
            id="party2Company"
            type="text"
            className={inputClass}
            value={formData.party2Company}
            onChange={(e) => update("party2Company", e.target.value)}
          />
        </Field>
        <Field label="Notice Address" id="party2Address">
          <input
            id="party2Address"
            type="text"
            className={inputClass}
            placeholder="Email or postal address"
            value={formData.party2Address}
            onChange={(e) => update("party2Address", e.target.value)}
          />
        </Field>
      </div>

      <button
        onClick={onDownload}
        disabled={isGenerating}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? "Generating PDF..." : "Download PDF"}
      </button>
    </div>
  );
}
