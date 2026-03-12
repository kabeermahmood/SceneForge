"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { Check, Loader2, Circle, Zap, Anchor, ArrowRightLeft } from "lucide-react";

interface Step {
  label: string;
  state: "pending" | "active" | "complete";
}

interface ProgressTrackerProps {
  batchMode?: boolean;
  batchState?: string;
  pollCount?: number;
  onSwitchToStandard?: () => void;
}

export default function ProgressTracker({
  batchMode,
  batchState,
  pollCount,
  onSwitchToStandard,
}: ProgressTrackerProps) {
  const pipelineStage = useProjectStore((s) => s.pipeline_stage);
  const scenes = useProjectStore((s) => s.scenes);
  const currentIndex = useProjectStore((s) => s.current_scene_index);

  const completedCount = scenes.filter(
    (s) => s.status === "completed" || s.status === "approved"
  ).length;
  const failedCount = scenes.filter((s) => s.status === "failed").length;
  const totalScenes = scenes.length;

  const heroComplete = totalScenes > 0 && (scenes[0]?.status === "completed" || scenes[0]?.status === "approved");
  const heroGenerating = totalScenes > 0 && scenes[0]?.status === "generating";

  const step3Label = batchMode
    ? `Batch Processing Remaining ${Math.max(0, totalScenes - 1)} Scenes`
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
      label: "Generating Hero Frame (Scene 1) for Reference",
      state:
        pipelineStage === "generating_images" && heroGenerating && !heroComplete
          ? "active"
          : heroComplete
            ? "complete"
            : pipelineStage === "generating_images" || pipelineStage === "complete"
              ? "complete"
              : "pending",
    },
    {
      label: step3Label,
      state:
        pipelineStage === "generating_images" && heroComplete
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
              {i === 2 && heroComplete && (
                <Anchor size={12} className="ml-1.5 inline text-success" />
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Batch mode indicator */}
      {pipelineStage === "generating_images" && batchMode && heroComplete && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-accent">
            <Zap size={16} />
            <span className="text-sm font-semibold">
              50% Cost Savings — Parallel Batch Processing
            </span>
          </div>

          {/* Parallel sub-batch progress */}
          {(() => {
            const completeMatch = batchState?.match(/^(\d+)\/(\d+)\s*complete/);
            if (completeMatch) {
              const done = parseInt(completeMatch[1]);
              const total = parseInt(completeMatch[2]);
              const pct = total > 0 ? (done / total) * 100 : 0;
              return (
                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-1000"
                      style={{ width: `${Math.min(Math.max(pct, 3), 100)}%` }}
                    />
                  </div>
                  <p className="text-center text-xs font-medium text-accent">
                    {done}/{total} sub-batches complete
                  </p>
                </div>
              );
            }
            return (
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] rounded-full bg-accent" />
              </div>
            );
          })()}

          <p className="text-center text-xs text-text-secondary">
            {batchState?.includes("JOB_STATE_QUEUED") && "Some batches queued — waiting for processing slot..."}
            {batchState?.includes("JOB_STATE_PENDING") && "Batches pending — preparing jobs..."}
            {batchState?.includes("JOB_STATE_RUNNING") && "Batches running — generating images..."}
            {batchState?.includes("in progress") && !batchState?.includes("JOB_STATE") && "Batch jobs in progress..."}
            {!batchState && "Submitting all batch jobs in parallel..."}
            {pollCount != null && pollCount > 0 && (
              <span className="ml-1 text-text-secondary/40">
                (poll #{pollCount})
              </span>
            )}
          </p>

          {completedCount > 1 && (
            <p className="text-center text-xs text-success">
              {completedCount}/{totalScenes} scenes completed so far
            </p>
          )}

          {/* Switch to Standard Processing button */}
          {onSwitchToStandard && (
            <div className="pt-2">
              <button
                onClick={onSwitchToStandard}
                className="mx-auto flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-xs font-medium text-accent transition-all hover:border-accent hover:bg-accent/10"
              >
                <ArrowRightLeft size={14} />
                Switch to Standard Processing
              </button>
              <p className="mt-1.5 text-center text-[10px] text-text-secondary/50">
                Stops batch polling and generates remaining scenes via parallel standard API
              </p>
            </div>
          )}

          <p className="text-center text-[11px] text-text-secondary/50">
            All sub-batches run in parallel — typically 5–15 min total
          </p>
        </div>
      )}

      {/* Hybrid retry indicator */}
      {pipelineStage === "generating_images" && !batchMode && failedCount > 0 && completedCount > 1 && (
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-center text-xs text-accent">
          Auto-retrying {failedCount} failed scene{failedCount > 1 ? "s" : ""} via standard API...
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
