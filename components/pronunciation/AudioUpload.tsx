"use client";

import { useRef } from "react";
import { Upload, X, Music } from "lucide-react";

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPTED = ".mp3,.wav,.m4a,.ogg,.webm,.flac";

export default function AudioUpload({ file, onFileChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("audio/")) onFileChange(f);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <Music size={16} />
        Audio File
      </label>

      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface/50 p-8 transition hover:border-accent/50 hover:bg-surface"
        >
          <Upload size={28} className="text-text-secondary" />
          <p className="text-sm text-text-secondary">
            Drop an audio file or <span className="text-accent">browse</span>
          </p>
          <p className="text-xs text-text-secondary/60">
            MP3, WAV, M4A, OGG, WebM, FLAC
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <Music size={18} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-text-secondary">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            disabled={disabled}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-error/10 hover:text-error transition disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onFileChange(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
