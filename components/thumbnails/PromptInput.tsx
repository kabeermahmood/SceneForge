"use client";

import { X } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function PromptInput({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text-primary">
          Image Prompt <span className="text-error text-xs ml-1">REQUIRED</span>
        </label>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-error transition disabled:opacity-40"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={5}
        placeholder="Describe the image you want to generate in detail..."
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 resize-y disabled:opacity-50 font-mono"
      />
      <p className="text-xs text-text-secondary text-right">
        {value.length.toLocaleString()} characters
      </p>
    </div>
  );
}
