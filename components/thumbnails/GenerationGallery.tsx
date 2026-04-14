"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Clock,
  Cloud,
  Monitor,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCcw,
} from "lucide-react";

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
  onReusePrompt?: (prompt: string) => void;
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

function Lightbox({
  generations,
  index,
  onClose,
  onNav,
  onReusePrompt,
}: {
  generations: Generation[];
  index: number;
  onClose: () => void;
  onNav: (newIndex: number) => void;
  onReusePrompt?: (prompt: string) => void;
}) {
  const gen = generations[index];
  const hasPrev = index > 0;
  const hasNext = index < generations.length - 1;

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNav(index - 1);
      if (e.key === "ArrowRight" && hasNext) onNav(index + 1);
    },
    [onClose, onNav, index, hasPrev, hasNext]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[95vh] max-w-[95vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="absolute top-0 right-0 z-10 flex items-center gap-2 p-3">
          <button
            type="button"
            onClick={() => downloadImage(gen)}
            className="rounded-lg bg-surface/80 p-2 text-text-secondary hover:text-accent transition"
            title="Download"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface/80 p-2 text-text-secondary hover:text-text-primary transition"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav arrows */}
        {hasPrev && (
          <button
            type="button"
            onClick={() => onNav(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-text-secondary hover:text-accent transition"
            title="Previous (←)"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={() => onNav(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-text-secondary hover:text-accent transition"
            title="Next (→)"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Image */}
        <img
          src={getImageSrc(gen)}
          alt={gen.prompt.slice(0, 60)}
          className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
        />

        {/* Info bar */}
        <div className="mt-3 w-full max-w-2xl rounded-xl border border-border bg-surface px-4 py-3 space-y-2">
          <p className="text-xs text-text-primary">{gen.prompt}</p>
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
              {" · "}
              {new Date(gen.timestamp).toLocaleString()}
            </span>
            <div className="flex items-center gap-3">
              {onReusePrompt && (
                <button
                  type="button"
                  onClick={() => {
                    onReusePrompt(gen.prompt);
                    onClose();
                  }}
                  className="text-accent hover:underline"
                >
                  Use this prompt
                </button>
              )}
              <span>
                {index + 1} / {generations.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GenerationGallery({
  generations,
  onClear,
  onReusePrompt,
}: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
    <>
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
          {generations.map((gen, i) => (
            <div
              key={gen.id}
              className="group rounded-xl border border-border bg-surface overflow-hidden transition hover:border-accent/40"
            >
              <div
                className="relative aspect-video bg-background cursor-pointer"
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={getImageSrc(gen)}
                  alt={gen.prompt.slice(0, 60)}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-background/0 group-hover:bg-background/30 transition">
                  <Maximize2
                    size={20}
                    className="text-text-primary opacity-0 group-hover:opacity-80 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(gen);
                  }}
                  className="absolute top-2 right-2 rounded-lg bg-background/80 p-2 text-text-secondary opacity-0 group-hover:opacity-100 transition hover:text-accent hover:bg-background"
                  title="Download"
                >
                  <Download size={14} />
                </button>
              </div>
              <div className="px-3 py-2.5 space-y-1.5">
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
                {onReusePrompt && (
                  <button
                    type="button"
                    onClick={() => onReusePrompt(gen.prompt)}
                    className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-accent transition"
                  >
                    <RotateCcw size={10} />
                    Reuse prompt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          generations={generations}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
          onReusePrompt={onReusePrompt}
        />
      )}
    </>
  );
}
