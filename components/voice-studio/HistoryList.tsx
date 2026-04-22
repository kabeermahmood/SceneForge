"use client";

import { useEffect, useRef, useState } from "react";
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Loader2,
  Mic2,
} from "lucide-react";
import {
  listHistory,
  deleteHistoryEntry,
  type HistoryEntry,
} from "@/lib/voiceHistory";

interface HistoryListProps {
  refreshSignal?: number;
}

export default function HistoryList({ refreshSignal = 0 }: HistoryListProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef<Map<string, string>>(new Map());

  const load = async () => {
    setLoading(true);
    try {
      const list = await listHistory();
      setEntries(list);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [refreshSignal]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const blobUrl = (entry: HistoryEntry) => {
    const cached = urlsRef.current.get(entry.id);
    if (cached) return cached;
    const url = URL.createObjectURL(entry.blob);
    urlsRef.current.set(entry.id, url);
    return url;
  };

  const togglePlay = (entry: HistoryEntry) => {
    if (playingId === entry.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(blobUrl(entry));
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audioRef.current = audio;
    void audio.play();
    setPlayingId(entry.id);
  };

  const download = (entry: HistoryEntry) => {
    const url = blobUrl(entry);
    const a = document.createElement("a");
    a.href = url;
    const safeName = entry.voiceName.replace(/[^a-z0-9-_]+/gi, "_");
    a.download = `voicestudio_${safeName}_${entry.id.slice(0, 6)}.mp3`;
    a.click();
  };

  const remove = async (entry: HistoryEntry) => {
    if (playingId === entry.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    const url = urlsRef.current.get(entry.id);
    if (url) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(entry.id);
    }
    await deleteHistoryEntry(entry.id);
    void load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-5 py-6 text-xs text-text-secondary">
        <Loader2 size={14} className="animate-spin text-accent" />
        Loading history…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-5 py-8 text-center text-xs text-text-secondary">
        Your generated voiceovers will appear here.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <History size={14} className="text-accent" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Recent Generations
        </h2>
        <span className="ml-auto text-[11px] text-text-secondary">
          {entries.length} saved
        </span>
      </div>

      <ul className="divide-y divide-border">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 px-5 py-3 transition hover:bg-border/20"
          >
            <button
              onClick={() => togglePlay(entry)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent transition hover:bg-accent/25"
              title={playingId === entry.id ? "Pause" : "Play"}
            >
              {playingId === entry.id ? (
                <Pause size={14} />
              ) : (
                <Play size={14} className="ml-0.5" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs">
                <Mic2 size={11} className="text-text-secondary" />
                <span className="font-medium text-text-primary">
                  {entry.voiceName}
                </span>
                <span className="text-text-secondary">•</span>
                <span className="text-text-secondary">
                  {formatRelative(entry.createdAt)}
                </span>
                <span className="text-text-secondary">•</span>
                <span className="text-text-secondary">
                  {(entry.sizeBytes / 1024).toFixed(0)} KB
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-text-secondary">
                {entry.scriptPreview}
              </p>
            </div>

            <button
              onClick={() => download(entry)}
              title="Download MP3"
              className="rounded-lg p-2 text-text-secondary transition hover:bg-border/50 hover:text-text-primary"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => void remove(entry)}
              title="Delete"
              className="rounded-lg p-2 text-text-secondary transition hover:bg-error/15 hover:text-error"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatRelative(ts: number): string {
  const diffSec = (Date.now() - ts) / 1000;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}
