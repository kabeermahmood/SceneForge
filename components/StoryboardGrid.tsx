"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { calculateSceneTimestamps } from "@/lib/chunker";

export default function StoryboardGrid() {
  const scenes = useProjectStore((s) => s.scenes);
  const duration = useProjectStore((s) => s.duration_seconds);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const timestamps = calculateSceneTimestamps(scenes.length, duration);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {scenes.map((scene, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            style={{ contentVisibility: "auto", containIntrinsicSize: "0 200px" }}
            className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
              scene.status === "approved"
                ? "border-success"
                : scene.status === "failed"
                  ? "border-error/50"
                  : "border-border hover:border-accent/50"
            }`}
          >
            {(scene.status === "completed" || scene.status === "approved") &&
            scene.image_base64 ? (
              <img
                src={`data:${scene.image_mime_type};base64,${scene.image_base64}`}
                alt={`Scene ${scene.chunk_index}`}
                className="aspect-video w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : scene.status === "failed" ? (
              <div className="flex aspect-video w-full items-center justify-center bg-error/5">
                <span className="text-xs text-error">Failed</span>
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-background/50">
                <span className="text-xs text-text-secondary/40">—</span>
              </div>
            )}

            {/* Scene number overlay */}
            <div className="absolute bottom-1.5 left-1.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-bold text-text-primary backdrop-blur-sm">
              {scene.chunk_index}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-2xl border border-border bg-surface p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 text-text-secondary backdrop-blur-sm transition-colors hover:text-text-primary"
            >
              <X size={18} />
            </button>

            {scenes[selectedIndex].image_base64 ? (
              <img
                src={`data:${scenes[selectedIndex].image_mime_type};base64,${scenes[selectedIndex].image_base64}`}
                alt={`Scene ${scenes[selectedIndex].chunk_index}`}
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-background/50">
                <span className="text-text-secondary">No image</span>
              </div>
            )}

            <div className="mt-3 space-y-2 p-3">
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm font-bold text-text-primary">
                  Scene {scenes[selectedIndex].chunk_index}
                </span>
                <span className="text-xs text-text-secondary">
                  {timestamps[selectedIndex]?.start} —{" "}
                  {timestamps[selectedIndex]?.end}
                </span>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  {scenes[selectedIndex].scene_emotion}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">
                {scenes[selectedIndex].script_text}
              </p>
              <p className="text-[11px] italic leading-relaxed text-text-secondary/60">
                {scenes[selectedIndex].scene_description}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
