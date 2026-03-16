"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { calculateSceneTimestamps } from "@/lib/chunker";
import { RefreshCw } from "lucide-react";
import SceneCard from "./SceneCard";

interface SceneTimelineProps {
  onRegenerate: (index: number) => void;
  onEditRegenerate: (index: number, newDescription: string) => void;
  onApproveToggle: (index: number) => void;
  onRetry: (index: number) => void;
  onRetryAllFailed?: () => void;
}

export default function SceneTimeline({
  onRegenerate,
  onEditRegenerate,
  onApproveToggle,
  onRetry,
  onRetryAllFailed,
}: SceneTimelineProps) {
  const scenes = useProjectStore((s) => s.scenes);
  const duration = useProjectStore((s) => s.duration_seconds);

  const timestamps = calculateSceneTimestamps(scenes.length, duration);
  const completedCount = scenes.filter(
    (s) => s.status === "completed" || s.status === "approved"
  ).length;
  const failedCount = scenes.filter((s) => s.status === "failed").length;

  return (
    <div className="w-full">
      {/* Summary */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-text-secondary">
          {scenes.length} scenes &bull; {duration}s &bull;{" "}
          <span className="text-success">{completedCount} completed</span>
          {failedCount > 0 && (
            <>
              {" "}
              &bull; <span className="text-error">{failedCount} failed</span>
            </>
          )}
        </div>

        {failedCount > 0 && onRetryAllFailed && (
          <button
            onClick={onRetryAllFailed}
            className="flex items-center gap-1.5 rounded-lg border border-error/30 bg-error/5 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10"
          >
            <RefreshCw size={12} />
            Retry All Failed ({failedCount})
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Vertical line */}
        <div className="absolute bottom-0 left-[19px] top-0 w-px bg-border" />

        {scenes.map((scene, i) => (
          <div key={i} className="relative flex gap-4 pl-10">
            {/* Timeline dot */}
            <div
              className={`absolute left-2.5 top-4 z-10 h-3 w-3 rounded-full border-2 ${
                scene.status === "approved"
                  ? "border-success bg-success"
                  : scene.status === "completed"
                    ? "border-success bg-surface"
                    : scene.status === "failed"
                      ? "border-error bg-surface"
                      : scene.status === "generating"
                        ? "border-accent bg-surface"
                        : "border-border bg-surface"
              }`}
            />

            <div className="w-full max-w-2xl" style={{ contentVisibility: "auto", containIntrinsicSize: "0 400px" }}>
              <SceneCard
                scene={scene}
                index={i}
                timestamp={timestamps[i]}
                onRegenerate={onRegenerate}
                onEditRegenerate={onEditRegenerate}
                onApproveToggle={onApproveToggle}
                onRetry={onRetry}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
