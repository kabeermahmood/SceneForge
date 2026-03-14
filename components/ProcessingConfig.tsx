"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { IMAGE_MODELS, TEXT_MODELS, type ProcessingMode } from "@/lib/types";
import {
  Zap,
  Clock,
  ChevronDown,
  DollarSign,
  Image as ImageIcon,
  Calculator,
  MessageSquareText,
} from "lucide-react";

const MODES: {
  id: ProcessingMode;
  label: string;
  description: string;
  icon: typeof Zap;
  badge: string;
}[] = [
  {
    id: "batch",
    label: "Batch Processing",
    description: "All scenes at once — 50% cheaper, 1–5 min wait",
    icon: Zap,
    badge: "50% off",
  },
  {
    id: "standard",
    label: "Standard Processing",
    description: "One scene at a time — see progress live, full price",
    icon: Clock,
    badge: "",
  },
];

const BATCH_DISCOUNT = 0.5;

export default function ProcessingConfig() {
  const processingMode = useProjectStore((s) => s.processing_mode);
  const setProcessingMode = useProjectStore((s) => s.setProcessingMode);
  const imageModel = useProjectStore((s) => s.image_model);
  const setImageModel = useProjectStore((s) => s.setImageModel);
  const textModel = useProjectStore((s) => s.text_model);
  const setTextModel = useProjectStore((s) => s.setTextModel);
  const durationSeconds = useProjectStore((s) => s.duration_seconds);
  const secondsPerScene = useProjectStore((s) => s.seconds_per_scene);

  const selectedModel = IMAGE_MODELS.find((m) => m.id === imageModel);
  const selectedTextModel = TEXT_MODELS.find((m) => m.id === textModel);
  const sceneCount = Math.max(
    4,
    Math.min(Math.round(durationSeconds / secondsPerScene), 100)
  );

  const costPerImage = selectedModel?.costPerImage ?? 0.039;
  const standardTotal = sceneCount * costPerImage;
  const batchTotal = standardTotal * BATCH_DISCOUNT;
  const activeCost = processingMode === "batch" ? batchTotal : standardTotal;
  const savings = standardTotal - activeCost;

  return (
    <div className="w-full space-y-6">
      {/* Processing Mode */}
      <div>
        <label className="mb-3 block font-heading text-sm font-medium text-text-secondary">
          Processing Mode
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODES.map(({ id, label, description, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setProcessingMode(id)}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                processingMode === id
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-text-secondary/30"
              }`}
            >
              <Icon
                size={20}
                className={`mt-0.5 shrink-0 ${
                  processingMode === id ? "text-accent" : "text-text-secondary"
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {label}
                  </span>
                  {badge && (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">
                  {description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Image Model Selector */}
      <div>
        <label className="mb-2 block font-heading text-sm font-medium text-text-secondary">
          Image Generation Model
        </label>
        <div className="relative">
          <select
            value={imageModel}
            onChange={(e) => setImageModel(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-surface px-4 py-3 pr-10 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {IMAGE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — ${m.costPerImage.toFixed(3)}/image
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {selectedModel?.description}
        </p>
      </div>

      {/* Text Model Selector */}
      <div>
        <label className="mb-2 flex items-center gap-2 font-heading text-sm font-medium text-text-secondary">
          <MessageSquareText size={14} />
          Text Model (Bible & Chunking)
        </label>
        <div className="relative">
          <select
            value={textModel}
            onChange={(e) => setTextModel(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-surface px-4 py-3 pr-10 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {TEXT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.costPer1MTokens === 0 ? "Free" : `$${m.costPer1MTokens}/1M tokens`}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {selectedTextModel?.description}
        </p>
      </div>

      {/* Cost Estimator */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
          <Calculator size={16} className="text-accent" />
          <span className="font-heading text-sm font-semibold text-text-primary">
            Estimated Cost
          </span>
        </div>

        <div className="px-4 py-4">
          {/* Breakdown rows */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <ImageIcon size={13} />
                Scenes
              </span>
              <span className="font-mono font-medium text-text-primary">
                {sceneCount}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <DollarSign size={13} />
                Cost per image
              </span>
              <span className="font-mono font-medium text-text-primary">
                ${costPerImage.toFixed(3)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Mode</span>
              <span className="font-medium text-text-primary">
                {processingMode === "batch" ? (
                  <span className="flex items-center gap-1">
                    Batch
                    <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
                      −50%
                    </span>
                  </span>
                ) : (
                  "Standard"
                )}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-border pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">
                  Total
                </span>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-accent">
                    ${activeCost.toFixed(2)}
                  </span>
                  {processingMode === "batch" && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono text-xs text-text-secondary line-through">
                        ${standardTotal.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-success">
                        save ${savings.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Per-image effective cost */}
          <div className="mt-3 rounded-lg bg-background px-3 py-2 text-center">
            <span className="text-[11px] text-text-secondary">
              Effective cost:{" "}
              <span className="font-mono font-semibold text-accent">
                ${(activeCost / sceneCount).toFixed(4)}
              </span>
              /image × {sceneCount} images
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
