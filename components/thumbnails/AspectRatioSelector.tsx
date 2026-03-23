"use client";

import { Monitor, Smartphone, Square } from "lucide-react";
import type { ReactNode } from "react";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4";

interface Props {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled?: boolean;
}

const RATIOS: { value: AspectRatio; label: string; sub: string; icon: ReactNode }[] = [
  {
    value: "16:9",
    label: "16:9",
    sub: "YouTube Landscape",
    icon: <Monitor size={20} />,
  },
  {
    value: "9:16",
    label: "9:16",
    sub: "Shorts / TikTok",
    icon: <Smartphone size={20} />,
  },
  { value: "1:1", label: "1:1", sub: "Instagram Square", icon: <Square size={20} /> },
  { value: "4:3", label: "4:3", sub: "Classic", icon: <Monitor size={18} /> },
  { value: "3:4", label: "3:4", sub: "Portrait", icon: <Smartphone size={18} /> },
];

export default function AspectRatioSelector({
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-text-primary">
        Aspect Ratio
      </label>
      <div className="flex flex-wrap gap-3">
        {RATIOS.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange(r.value)}
            disabled={disabled}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-5 py-3 text-xs transition-all ${
              value === r.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-text-secondary hover:border-text-secondary hover:text-text-primary"
            } disabled:opacity-50`}
          >
            {r.icon}
            <span className="font-semibold">{r.label}</span>
            <span className="text-[10px] opacity-70">{r.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
