"use client";

import { FileText } from "lucide-react";

interface Props {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

export default function ScriptInput({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <FileText size={16} />
        Reference Script
      </label>
      <textarea
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste your original written script here…"
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 resize-y disabled:opacity-50"
      />
      <p className="text-xs text-text-secondary">
        {value.trim().split(/\s+/).filter(Boolean).length} words
      </p>
    </div>
  );
}
