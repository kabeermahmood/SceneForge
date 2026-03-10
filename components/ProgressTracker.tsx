"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { Check, Loader2, Circle } from "lucide-react";

interface Step {
  label: string;
  state: "pending" | "active" | "complete";
}

export default function ProgressTracker() {
  const pipelineStage = useProjectStore((s) => s.pipeline_stage);
  const scenes = useProjectStore((s) => s.scenes);
  const currentIndex = useProjectStore((s) => s.current_scene_index);

  const completedCount = scenes.filter(
    (s) => s.status === "completed" || s.status === "approved"
  ).length;
  const totalScenes = scenes.length;

  const steps: Step[] = [
    {
      label: "Analyzing Script & Creating Character Bible",
      state:
        pipelineStage === "generating_bible"
          ? "active"
          : pipelineStage === "idle"
            ? "pending"
            : "complete",
    },
    {
      label: "Splitting Script into Scenes",
      state:
        pipelineStage === "chunking"
          ? "active"
          : pipelineStage === "generating_bible" || pipelineStage === "idle"
            ? "pending"
            : "complete",
    },
    {
      label:
        totalScenes > 0
          ? `Generating Scene Images (${completedCount}/${totalScenes})`
          : "Generating Scene Images (0/0)",
      state:
        pipelineStage === "generating_images"
          ? "active"
          : pipelineStage === "complete"
            ? "complete"
            : "pending",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-xl py-6">
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              {step.state === "complete" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                  <Check size={18} className="text-success" />
                </div>
              )}
              {step.state === "active" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
                  <Loader2
                    size={18}
                    className="animate-spin text-accent"
                  />
                </div>
              )}
              {step.state === "pending" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-border/40">
                  <Circle size={18} className="text-text-secondary/40" />
                </div>
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                step.state === "active"
                  ? "text-accent"
                  : step.state === "complete"
                    ? "text-success"
                    : "text-text-secondary/60"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {pipelineStage === "generating_images" && totalScenes > 0 && (
        <div className="mt-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{
                width: `${(completedCount / totalScenes) * 100}%`,
              }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-text-secondary">
            Generating scene {currentIndex + 1} of {totalScenes}...
          </p>
        </div>
      )}
    </div>
  );
}
