"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Provider } from "./ProviderToggle";

interface Props {
  provider: Provider;
  resolution: string;
  onResolutionChange: (v: string) => void;
  outputFormat: string;
  onOutputFormatChange: (v: string) => void;
  model: string;
  onModelChange: (v: string) => void;
  disabled?: boolean;
}

const RESOLUTIONS = ["1K", "2K", "4K"];
const FORMATS = ["png", "jpg", "webp"];
const GOOGLE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
];

export default function AdvancedSettings({
  provider,
  resolution,
  onResolutionChange,
  outputFormat,
  onOutputFormatChange,
  model,
  onModelChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-text-primary hover:bg-border/20 transition"
      >
        <div className="flex items-center gap-2">
          Advanced Settings
          <span
            className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
              open
                ? "bg-accent/15 text-accent"
                : "bg-success/15 text-success"
            }`}
          >
            {open ? "Editing" : (
              <>
                <Check size={10} className="inline mr-1" />
                Ready
              </>
            )}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-4 animate-fade-in">
          {provider === "replicate" ? (
            <>
              <SelectField
                label="Resolution"
                value={resolution}
                options={RESOLUTIONS}
                onChange={onResolutionChange}
                disabled={disabled}
              />
              <SelectField
                label="Output Format"
                value={outputFormat}
                options={FORMATS}
                onChange={onOutputFormatChange}
                disabled={disabled}
              />
            </>
          ) : (
            <SelectField
              label="Model"
              value={model}
              options={GOOGLE_MODELS}
              onChange={onModelChange}
              disabled={disabled}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text-primary disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
