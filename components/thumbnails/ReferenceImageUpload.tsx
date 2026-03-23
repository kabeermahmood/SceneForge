"use client";

import { useCallback, useRef } from "react";
import { Upload, X, Plus } from "lucide-react";

export interface RefImage {
  data: string;
  mimeType: string;
  preview: string;
  name: string;
}

interface Props {
  images: RefImage[];
  onChange: (images: RefImage[]) => void;
  disabled?: boolean;
  max?: number;
}

function readFileAsRefImage(file: File): Promise<RefImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve({
        data: base64,
        mimeType: file.type || "image/png",
        preview: dataUrl,
        name: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReferenceImageUpload({
  images,
  onChange,
  disabled,
  max = 14,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || disabled) return;
      const remaining = max - images.length;
      if (remaining <= 0) return;

      const toProcess = Array.from(files).slice(0, remaining);
      const newImages = await Promise.all(toProcess.map(readFileAsRefImage));
      onChange([...images, ...newImages]);
    },
    [images, onChange, max, disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const openFilePicker = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text-primary">
          Reference Images{" "}
          <span className="text-xs font-normal text-accent">(Optional)</span>
        </label>
        <span className="text-xs text-text-secondary">
          {images.length}/{max} images
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        disabled={disabled || images.length >= max}
        onChange={(e) => {
          processFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={handleDrop}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openFilePicker();
        }}
        className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-surface/50 p-6 text-center transition-all hover:border-accent/50 hover:bg-accent/5 active:bg-accent/10"
      >
        <Upload size={28} className="mx-auto mb-2 text-text-secondary" />
        <p className="text-sm text-text-secondary">
          Drop images here or{" "}
          <span className="text-accent hover:underline">browse</span>
        </p>
        <p className="mt-1 text-xs text-text-secondary/60">
          PNG, JPG, WebP — drag & drop or click to add
        </p>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
          {images.map((img, i) => (
            <div
              key={`${img.name}-${i}`}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={img.preview}
                alt={img.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                disabled={disabled}
                className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-text-secondary opacity-0 group-hover:opacity-100 transition hover:text-error"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Add more button */}
          {images.length < max && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              disabled={disabled}
              className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-text-secondary transition hover:border-accent hover:text-accent hover:bg-accent/5 disabled:opacity-40"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
