"use client";

import { useState } from "react";
import { X, ChevronDown, Ban, Wand2, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  negativePrompt: string;
  onNegativeChange: (value: string) => void;
  disabled?: boolean;
  geminiKey?: string;
}

export default function PromptInput({
  value,
  onChange,
  negativePrompt,
  onNegativeChange,
  disabled,
  geminiKey,
}: Props) {
  const [showNegative, setShowNegative] = useState(negativePrompt.length > 0);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const canEnhance = value.trim().length > 0 && !disabled && !enhancing;

  async function handleEnhance() {
    if (!canEnhance) return;
    setEnhancing(true);
    setEnhanceError(null);

    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: value.trim(),
          apiKey: geminiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enhancement failed");

      onChange(data.enhanced);
    } catch (err: unknown) {
      setEnhanceError(
        err instanceof Error ? err.message : "Enhancement failed"
      );
    } finally {
      setEnhancing(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Main prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-text-primary">
            Image Prompt{" "}
            <span className="text-error text-xs ml-1">REQUIRED</span>
          </label>
          <div className="flex items-center gap-3">
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
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || enhancing}
          rows={5}
          placeholder="Describe the image you want to generate in detail..."
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 resize-y disabled:opacity-50 font-mono"
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleEnhance}
            disabled={!canEnhance}
            className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent transition-all hover:bg-accent/15 hover:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent/5 disabled:hover:border-accent/30"
          >
            {enhancing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Enhancing…
              </>
            ) : (
              <>
                <Wand2 size={12} />
                Enhance with AI
              </>
            )}
          </button>
          <p className="text-xs text-text-secondary">
            {value.length.toLocaleString()} characters
          </p>
        </div>
        {enhanceError && (
          <p className="text-xs text-error animate-fade-in">{enhanceError}</p>
        )}
      </div>

      {/* Negative prompt toggle + field */}
      <div>
        <button
          type="button"
          onClick={() => setShowNegative(!showNegative)}
          className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition"
        >
          <Ban size={12} />
          Negative Prompt
          <ChevronDown
            size={12}
            className={`transition-transform ${showNegative ? "rotate-180" : ""}`}
          />
          {negativePrompt.length > 0 && !showNegative && (
            <span className="rounded-full bg-error/15 text-error px-2 py-0.5 text-[10px] font-semibold">
              Active
            </span>
          )}
        </button>

        {showNegative && (
          <div className="mt-2 space-y-1.5 animate-fade-in">
            <textarea
              value={negativePrompt}
              onChange={(e) => onNegativeChange(e.target.value)}
              disabled={disabled}
              rows={2}
              placeholder="Things to exclude: watermarks, text, borders, blurry, low quality..."
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 resize-y disabled:opacity-50 font-mono"
            />
            {negativePrompt.length > 0 && (
              <button
                type="button"
                onClick={() => onNegativeChange("")}
                disabled={disabled}
                className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-error transition"
              >
                <X size={10} />
                Clear negative prompt
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
