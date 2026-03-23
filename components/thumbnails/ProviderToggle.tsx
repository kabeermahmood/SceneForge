"use client";

import { Cloud, Monitor } from "lucide-react";

export type Provider = "replicate" | "google";

interface Props {
  value: Provider;
  onChange: (value: Provider) => void;
  disabled?: boolean;
}

const OPTIONS: { value: Provider; label: string; icon: typeof Cloud }[] = [
  { value: "replicate", label: "Replicate", icon: Cloud },
  { value: "google", label: "Google Direct", icon: Monitor },
];

export default function ProviderToggle({ value, onChange, disabled }: Props) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      {OPTIONS.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          disabled={disabled}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-medium transition-all ${
            value === v
              ? "bg-accent/15 text-accent"
              : "bg-surface text-text-secondary hover:bg-border/50 hover:text-text-primary"
          } disabled:opacity-50`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
