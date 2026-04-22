"use client";

import { FileText } from "lucide-react";
import { MAX_CHARACTERS } from "@/lib/elevenlabs";

interface ScriptEditorProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export default function ScriptEditor({
  value,
  onChange,
  disabled,
}: ScriptEditorProps) {
  const count = value.length;
  const remaining = MAX_CHARACTERS - count;
  const overLimit = remaining < 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
          <FileText size={12} className="text-accent" />
          Script
        </div>
        <span
          className={`text-xs tabular-nums ${
            overLimit ? "text-error" : "text-text-secondary"
          }`}
        >
          {count.toLocaleString()} characters
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste or type your script here. ElevenLabs supports up to 5,000 characters per generation."
        className="min-h-[420px] flex-1 resize-none rounded-b-2xl border-0 bg-transparent px-5 py-4 text-sm leading-relaxed placeholder:text-text-secondary/60 focus:outline-none focus:ring-0 disabled:opacity-60"
      />

      <div className="flex items-center justify-between border-t border-border px-5 py-2 text-[11px]">
        <span className="text-text-secondary">
          Voice Studio v1.0
        </span>
        <span
          className={`tabular-nums ${
            overLimit
              ? "text-error font-medium"
              : remaining < 500
                ? "text-amber-400"
                : "text-text-secondary"
          }`}
        >
          {overLimit
            ? `${Math.abs(remaining).toLocaleString()} over limit`
            : `${remaining.toLocaleString()} characters left`}
        </span>
      </div>
    </div>
  );
}
