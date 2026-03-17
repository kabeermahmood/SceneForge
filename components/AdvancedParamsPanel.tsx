"use client";

import { Sliders, RotateCcw } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { DEFAULT_ADVANCED_PARAMS } from "@/lib/types";
import type { AdvancedParams } from "@/lib/types";

const PARAM_CONFIG: {
  key: keyof AdvancedParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}[] = [
  { key: "bible_temperature", label: "Bible Temperature", min: 0, max: 1, step: 0.05 },
  { key: "bible_max_tokens", label: "Bible Max Tokens", min: 1024, max: 16384, step: 512, unit: "tokens" },
  { key: "chunking_temperature", label: "Chunking Temperature", min: 0, max: 1, step: 0.05 },
  { key: "description_temperature", label: "Description Temperature", min: 0, max: 1, step: 0.05 },
  { key: "description_max_tokens", label: "Description Max Tokens", min: 256, max: 4096, step: 256, unit: "tokens" },
  { key: "max_retries", label: "Max API Retries", min: 1, max: 10, step: 1 },
];

export default function AdvancedParamsPanel() {
  const params = useProjectStore((s) => s.advanced_params);
  const setAdvancedParams = useProjectStore((s) => s.setAdvancedParams);

  const resetAll = () => setAdvancedParams({ ...DEFAULT_ADVANCED_PARAMS });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-accent" />
          <h3 className="font-heading text-sm font-bold text-text-primary">
            Advanced Parameters
          </h3>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-accent"
        >
          <RotateCcw size={10} /> Reset All
        </button>
      </div>
      <p className="text-[11px] text-text-secondary">
        Fine-tune the AI generation parameters. Changes apply to new generations.
      </p>

      <div className="space-y-3">
        {PARAM_CONFIG.map(({ key, label, min, max, step, unit }) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-text-primary">{label}</label>
              <span className="font-mono text-xs text-accent">
                {params[key]}
                {unit ? ` ${unit}` : ""}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={params[key]}
              onChange={(e) => setAdvancedParams({ [key]: Number(e.target.value) })}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[9px] text-text-secondary/50">
              <span>{min}</span>
              <span className="text-text-secondary/30">
                default: {DEFAULT_ADVANCED_PARAMS[key]}
              </span>
              <span>{max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
