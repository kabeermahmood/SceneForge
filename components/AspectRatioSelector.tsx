"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { Monitor, Smartphone, Square } from "lucide-react";

const RATIOS = [
  {
    value: "16:9" as const,
    label: "16:9",
    sublabel: "YouTube Landscape",
    Icon: Monitor,
  },
  {
    value: "9:16" as const,
    label: "9:16",
    sublabel: "Shorts / TikTok",
    Icon: Smartphone,
  },
  {
    value: "1:1" as const,
    label: "1:1",
    sublabel: "Instagram Square",
    Icon: Square,
  },
];

export default function AspectRatioSelector() {
  const aspectRatio = useProjectStore((s) => s.aspect_ratio);
  const setAspectRatio = useProjectStore((s) => s.setAspectRatio);

  return (
    <div className="flex-1">
      <label className="mb-2 block font-heading text-sm font-medium text-text-secondary">
        Aspect Ratio
      </label>
      <div className="flex gap-2">
        {RATIOS.map(({ value, label, sublabel, Icon }) => (
          <button
            key={value}
            onClick={() => setAspectRatio(value)}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 transition-all ${
              aspectRatio === value
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:border-text-secondary/30"
            }`}
          >
            <Icon
              size={20}
              className={
                aspectRatio === value ? "text-accent" : "text-text-secondary"
              }
            />
            <span className="text-xs font-semibold text-text-primary">
              {label}
            </span>
            <span className="text-[10px] text-text-secondary">{sublabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
