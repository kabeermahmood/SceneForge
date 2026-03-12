"use client";

import { useState } from "react";
import { Check, X, RefreshCw, Pencil, ChevronDown, ChevronUp, Loader2, Download } from "lucide-react";
import type { Scene } from "@/lib/types";

interface SceneCardProps {
  scene: Scene;
  index: number;
  timestamp: { start: string; end: string };
  onRegenerate?: (index: number) => void;
  onEditRegenerate?: (index: number, newDescription: string) => void;
  onApproveToggle?: (index: number) => void;
  onRetry?: (index: number) => void;
}

export default function SceneCard({
  scene,
  index,
  timestamp,
  onRegenerate,
  onEditRegenerate,
  onApproveToggle,
  onRetry,
}: SceneCardProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(scene.scene_description);

  const downloadImage = () => {
    if (!scene.image_base64 || !scene.image_mime_type) return;
    const ext = scene.image_mime_type.includes("png") ? "png" : "jpg";
    const link = document.createElement("a");
    link.href = `data:${scene.image_mime_type};base64,${scene.image_base64}`;
    link.download = `scene-${String(scene.chunk_index).padStart(2, "0")}.${ext}`;
    link.click();
  };

  const borderClass =
    scene.status === "approved"
      ? "border-success"
      : scene.status === "completed"
        ? "border-border"
        : scene.status === "failed"
          ? "border-error/50"
          : scene.status === "generating"
            ? "border-accent/50"
            : "border-border/50";

  return (
    <div className={`animate-fade-in rounded-xl border-2 bg-surface ${borderClass} overflow-hidden`}>
      {/* Image */}
      <div className="relative w-full">
        {(scene.status === "completed" || scene.status === "approved") &&
        scene.image_base64 ? (
          <img
            src={`data:${scene.image_mime_type};base64,${scene.image_base64}`}
            alt={`Scene ${scene.chunk_index}`}
            className="w-full"
          />
        ) : scene.status === "generating" ? (
          <div className="animate-shimmer flex aspect-video w-full items-center justify-center">
            <Loader2 size={32} className="animate-spin text-accent/50" />
          </div>
        ) : scene.status === "failed" ? (
          <div className="flex aspect-video w-full items-center justify-center bg-error/5">
            <div className="text-center">
              <X size={32} className="mx-auto text-error/50" />
              <p className="mt-2 text-xs text-error">Generation failed</p>
            </div>
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center border-b border-dashed border-border bg-background/50">
            <span className="text-sm text-text-secondary/40">Pending</span>
          </div>
        )}

        {/* Status badge overlay */}
        {scene.status === "approved" && (
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-success shadow-lg">
            <Check size={16} className="text-background" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm font-bold text-text-primary">
            Scene {scene.chunk_index}
          </span>
          <span className="text-xs text-text-secondary">
            {timestamp.start} — {timestamp.end}
          </span>
          <span className="ml-auto rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
            {scene.scene_emotion}
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-text-secondary">
          {scene.script_text}
        </p>

        {scene.error_message && (
          <p className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
            {scene.error_message}
          </p>
        )}

        {/* Collapsible prompt */}
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="mt-3 flex items-center gap-1 text-[11px] text-text-secondary/60 transition-colors hover:text-text-secondary"
        >
          {showPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showPrompt ? "Hide prompt" : "Show prompt"}
        </button>
        {showPrompt && (
          <p className="mt-2 rounded-lg bg-background/50 p-3 text-[11px] leading-relaxed text-text-secondary/70">
            {scene.scene_description}
          </p>
        )}

        {/* Edit form */}
        {editing && (
          <div className="mt-3 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full resize-y rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
              style={{ minHeight: "80px" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEditRegenerate?.(index, editText);
                  setEditing(false);
                }}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-accent-hover"
              >
                Generate with New Description
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!editing && (scene.status === "completed" || scene.status === "approved" || scene.status === "failed") && (
          <div className="mt-4 flex gap-2 border-t border-border pt-3">
            {scene.status === "failed" ? (
              <button
                onClick={() => onRetry?.(index)}
                className="flex items-center gap-1.5 rounded-lg border border-error/30 px-3 py-1.5 text-xs text-error transition-colors hover:bg-error/10"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            ) : (
              <>
                <button
                  onClick={() => onRegenerate?.(index)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  <RefreshCw size={12} />
                  Regenerate
                </button>
                <button
                  onClick={() => {
                    setEditText(scene.scene_description);
                    setEditing(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  <Download size={12} />
                  Save
                </button>
                <button
                  onClick={() => onApproveToggle?.(index)}
                  className={`ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    scene.status === "approved"
                      ? "bg-success/20 text-success"
                      : "border border-border text-text-secondary hover:border-success hover:text-success"
                  }`}
                >
                  <Check size={12} />
                  {scene.status === "approved" ? "Approved" : "Approve"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
