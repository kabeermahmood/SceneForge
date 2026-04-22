"use client";

import { BookOpen, ChevronRight, AlertTriangle } from "lucide-react";

interface PronunciationDictSectionProps {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  ruleCount: number;
  onManage: () => void;
  v3Warning?: boolean;
  disabled?: boolean;
}

export default function PronunciationDictSection({
  enabled,
  onToggle,
  ruleCount,
  onManage,
  v3Warning,
  disabled,
}: PronunciationDictSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-text-secondary">
        <span className="flex items-center gap-2">
          <BookOpen size={12} className="text-accent" />
          Dictionary
        </span>
        <Toggle
          checked={enabled}
          onChange={onToggle}
          disabled={disabled || ruleCount === 0}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            enabled && ruleCount > 0
              ? "bg-success"
              : "bg-text-secondary/30"
          }`}
        />
        <span className="text-text-secondary">
          {ruleCount === 0
            ? "No rules yet"
            : enabled
              ? `${ruleCount} rule${ruleCount === 1 ? "" : "s"} active`
              : `${ruleCount} rule${ruleCount === 1 ? "" : "s"} (off)`}
        </span>
      </div>

      <button
        onClick={onManage}
        disabled={disabled}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-primary transition hover:border-accent/40 disabled:opacity-50"
      >
        <span>{ruleCount === 0 ? "Add pronunciation rules" : "Manage rules"}</span>
        <ChevronRight size={14} className="text-text-secondary" />
      </button>

      {v3Warning && enabled && ruleCount > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>
            Eleven v3 (alpha) doesn&apos;t support pronunciation dictionaries.
            Switch to Multilingual v2 or Turbo to apply your rules.
          </span>
        </div>
      )}
    </section>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative h-5 w-9 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-accent" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
