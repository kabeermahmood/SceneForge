"use client";

import { useProjectStore } from "@/store/useProjectStore";

export default function DurationInput() {
  const duration = useProjectStore((s) => s.duration_seconds);
  const setDuration = useProjectStore((s) => s.setDuration);
  const secondsPerScene = useProjectStore((s) => s.seconds_per_scene);

  const sceneCount = Math.round(duration / secondsPerScene);

  return (
    <div className="flex-1">
      <label className="mb-2 block font-heading text-sm font-medium text-text-secondary">
        Voiceover Duration (seconds)
      </label>
      <input
        type="number"
        value={duration}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val)) setDuration(Math.max(30, Math.min(900, val)));
        }}
        min={30}
        max={900}
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <p className="mt-2 text-xs text-text-secondary">
        ≈ {sceneCount} scenes will be generated
      </p>
    </div>
  );
}
