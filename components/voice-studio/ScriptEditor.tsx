"use client";

import { FileText, Layers } from "lucide-react";
import {
  MAX_CHARACTERS,
  WARN_CHARACTERS,
  SAFE_CHUNK_CHARS,
} from "@/lib/elevenlabs";

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
  const inWarnZone = count >= WARN_CHARACTERS && !overLimit;
  const willChunk = count > SAFE_CHUNK_CHARS;
  const estimatedChunks = willChunk
    ? Math.ceil(count / SAFE_CHUNK_CHARS)
    : 1;

  const counterClass = overLimit
    ? "text-error"
    : inWarnZone
      ? "text-amber-400"
      : "text-text-secondary";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
          <FileText size={12} className="text-accent" />
          Script
        </div>
        <span className={`text-xs tabular-nums ${counterClass}`}>
          {count.toLocaleString()} characters
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste or type your script here. Long scripts are split automatically — up to 100,000 characters supported."
        className="min-h-[420px] flex-1 resize-none rounded-b-2xl border-0 bg-transparent px-5 py-4 text-sm leading-relaxed placeholder:text-text-secondary/60 focus:outline-none focus:ring-0 disabled:opacity-60"
      />

      {willChunk && !overLimit && (
        <div className="flex items-center gap-2 border-t border-border bg-background/40 px-5 py-2 text-[11px] text-text-secondary">
          <Layers size={11} className="text-accent" />
          <span>
            Long script &mdash; will be generated in{" "}
            <span className="font-medium text-text-primary">
              {estimatedChunks}
            </span>{" "}
            seamless parts.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border px-5 py-2 text-[11px]">
        <span className="text-text-secondary">Voice Studio v1.0</span>
        <span
          className={`tabular-nums ${
            overLimit
              ? "text-error font-medium"
              : inWarnZone
                ? "text-amber-400"
                : remaining < 1000
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
