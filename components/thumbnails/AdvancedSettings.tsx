"use client";

import { useState } from "react";
import { ChevronDown, Check, Globe, Info, AlertTriangle } from "lucide-react";
import type { Provider } from "./ProviderToggle";

interface Props {
  provider: Provider;
  resolution: string;
  onResolutionChange: (v: string) => void;
  outputFormat: string;
  onOutputFormatChange: (v: string) => void;
  model: string;
  onModelChange: (v: string) => void;
  useGoogleSearch: boolean;
  onUseGoogleSearchChange: (v: boolean) => void;
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
  useGoogleSearch,
  onUseGoogleSearchChange,
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
            <>
              <SelectField
                label="Model"
                value={model}
                options={GOOGLE_MODELS}
                onChange={onModelChange}
                disabled={disabled}
              />

              {/* Google Search Grounding toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-text-secondary" />
                    <label className="text-xs font-medium text-text-secondary">
                      Grounding with Google Search
                    </label>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useGoogleSearch}
                    onClick={() => onUseGoogleSearchChange(!useGoogleSearch)}
                    disabled={disabled}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                      useGoogleSearch ? "bg-accent" : "bg-border"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        useGoogleSearch ? "translate-x-[18px]" : "translate-x-[3px]"
                      }`}
                    />
                  </button>
                </div>
                {useGoogleSearch && model === "gemini-2.5-flash-image" ? (
                  <div className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-400 leading-relaxed">
                      Google Search grounding is not supported on Gemini 2.5 Flash Image.
                      Switch to <button type="button" onClick={() => onModelChange("gemini-3.1-flash-image-preview")} className="font-semibold underline hover:text-amber-300 transition">Gemini 3.1 Flash Image</button> to use this feature.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 rounded-lg bg-accent/5 border border-accent/10 px-3 py-2">
                    <Info size={12} className="text-accent mt-0.5 shrink-0" />
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Grounds the image in real-time web information — producing
                      more accurate subjects, text overlays, and context-aware
                      compositions.
                    </p>
                  </div>
                )}
              </div>
            </>
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
