"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { Check, Loader2, Circle, Zap } from "lucide-react";

interface Step {
  label: string;
  state: "pending" | "active" | "complete";
}

interface ProgressTrackerProps {
  batchMode?: boolean;
  batchState?: string;
  pollCount?: number;
}

export default function ProgressTracker({
  batchMode,
  batchState,
  pollCount,
}: ProgressTrackerProps) {
  const pipelineStage = useProjectStore((s) => s.pipeline_stage);
  const scenes = useProjectStore((s) => s.scenes);
  const currentIndex = useProjectStore((s) => s.current_scene_index);

  const completedCount = scenes.filter(
    (s) => s.status === "completed" || s.status === "approved"
  ).length;
  const totalScenes = scenes.length;

  const step3Label = batchMode
    ? `Batch Processing All ${totalScenes} Scenes`
    : totalScenes > 0
      ? `Generating Scene Images (${completedCount}/${totalScenes})`
      : "Generating Scene Images (0/0)";

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
      label: step3Label,
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
                  <Loader2 size={18} className="animate-spin text-accent" />
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

      {/* Batch mode indicator */}
      {pipelineStage === "generating_images" && batchMode && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-accent">
            <Zap size={16} />
            <span className="text-sm font-semibold">
              50% Cost Savings with Batch API
            </span>
          </div>

          {/* Indeterminate pulsing progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] rounded-full bg-accent" />
          </div>

          <p className="text-center text-xs text-text-secondary">
            {batchState === "JOB_STATE_QUEUED" && "Queued — waiting for processing slot..."}
            {batchState === "JOB_STATE_PENDING" && "Pending — preparing batch job..."}
            {batchState === "JOB_STATE_RUNNING" && "Running — generating all images..."}
            {!batchState && "Submitting batch job..."}
            {pollCount != null && pollCount > 0 && (
              <span className="ml-1 text-text-secondary/40">
                (poll #{pollCount})
              </span>
            )}
          </p>
          <p className="text-center text-[11px] text-text-secondary/50">
            Typically 1–5 minutes for completion
          </p>
        </div>
      )}

      {/* Sequential mode progress bar */}
      {pipelineStage === "generating_images" && !batchMode && totalScenes > 0 && (
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
