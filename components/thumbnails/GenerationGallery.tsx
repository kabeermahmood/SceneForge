"use client";

import { Download, Clock, Cloud, Monitor, Trash2 } from "lucide-react";

export interface Generation {
  id: string;
  prompt: string;
  provider: "replicate" | "google";
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  timestamp: number;
}

interface Props {
  generations: Generation[];
  onClear?: () => void;
}

function getImageSrc(gen: Generation): string {
  if (gen.imageUrl) return gen.imageUrl;
  if (gen.imageBase64)
    return `data:${gen.mimeType || "image/png"};base64,${gen.imageBase64}`;
  return "";
}

function downloadImage(gen: Generation) {
  const src = getImageSrc(gen);
  const a = document.createElement("a");
  a.href = src;
  a.download = `thumbnail-${gen.id}.${gen.mimeType?.split("/")[1] || "png"}`;
  a.click();
}

export default function GenerationGallery({ generations, onClear }: Props) {
  if (generations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-border/30">
          <Clock size={24} className="text-text-secondary" />
        </div>
        <p className="text-sm text-text-secondary">
          No generations yet. Enter a prompt above to get started.
        </p>
        <p className="mt-1 text-xs text-text-secondary/60">
          Press Ctrl + Enter to generate quickly
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Generated Images ({generations.length})
        </h3>
        {onClear && generations.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-error transition"
          >
            <Trash2 size={12} />
            Clear All
          </button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {generations.map((gen) => (
          <div
            key={gen.id}
            className="group rounded-xl border border-border bg-surface overflow-hidden transition hover:border-accent/40"
          >
            <div className="relative aspect-video bg-background">
              <img
                src={getImageSrc(gen)}
                alt={gen.prompt.slice(0, 60)}
                className="h-full w-full object-contain"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => downloadImage(gen)}
                className="absolute top-2 right-2 rounded-lg bg-background/80 p-2 text-text-secondary opacity-0 group-hover:opacity-100 transition hover:text-accent hover:bg-background"
                title="Download"
              >
                <Download size={14} />
              </button>
            </div>
            <div className="px-3 py-2.5 space-y-1">
              <p className="text-xs text-text-primary line-clamp-2">
                {gen.prompt}
              </p>
              <div className="flex items-center justify-between text-[10px] text-text-secondary">
                <span className="flex items-center gap-1">
                  {gen.provider === "replicate" ? (
                    <Cloud size={10} />
                  ) : (
                    <Monitor size={10} />
                  )}
                  {gen.provider === "replicate"
                    ? "Nano Banana Pro"
                    : "Google Direct"}
                </span>
                <span>{new Date(gen.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
