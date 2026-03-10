"use client";

import { useProjectStore } from "@/store/useProjectStore";

export default function ScriptInput() {
  const script = useProjectStore((s) => s.script);
  const setScript = useProjectStore((s) => s.setScript);

  const charCount = script.length;
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const isBelow = charCount > 0 && charCount < 100;

  return (
    <div className="w-full">
      <label className="mb-2 block font-heading text-sm font-medium text-text-secondary">
        Video Script
      </label>
      <textarea
        value={script}
        onChange={(e) => {
          if (e.target.value.length <= 10000) setScript(e.target.value);
        }}
        placeholder="Paste your video script here... (e.g., 'The moment you close that door, your dog's world changes. Research shows that most dogs experience a spike in cortisol...')"
        className="w-full resize-y rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
        style={{ minHeight: "200px" }}
      />
      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex gap-3 text-text-secondary">
          <span>{charCount.toLocaleString()} characters</span>
          <span>•</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
        <div>
          {isBelow && (
            <span className="text-error">
              Minimum 100 characters required ({100 - charCount} more needed)
            </span>
          )}
          <span className="text-text-secondary">
            {charCount.toLocaleString()} / 10,000
          </span>
        </div>
      </div>
    </div>
  );
}
