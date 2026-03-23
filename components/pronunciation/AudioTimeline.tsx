"use client";

import { useState, useEffect, useCallback, useRef, type RefObject } from "react";
import { Play, Pause, SkipBack } from "lucide-react";
import type { DiffWord } from "@/lib/pronunciationDiff";

interface Props {
  audioRef: RefObject<HTMLAudioElement | null>;
  words: DiffWord[];
  onSeekToWord: (index: number) => void;
}

const STATUS_MARKER_COLOR: Record<string, string> = {
  mismatch: "bg-error",
  phonetic_match: "bg-teal-500/40",
  missing: "bg-error/60",
  extra: "bg-purple-500",
};

export default function AudioTimeline({ audioRef, words, onSeekToWord }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const scrubberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("durationchange", onDurationChange);

    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, [audioRef]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [audioRef]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  }, [audioRef]);

  const seekTo = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = scrubberRef.current;
      if (!audio || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * duration;
    },
    [audioRef, duration]
  );

  const flaggedMarkers = duration > 0
    ? words
        .map((w, i) => ({ word: w, index: i }))
        .filter((m) => m.word.status !== "match" && m.word.start !== null)
    : [];

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-2">
      {/* Controls row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={restart}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text-primary transition"
          title="Restart"
        >
          <SkipBack size={16} />
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-background hover:bg-accent-hover transition"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        <span className="text-xs font-mono text-text-secondary min-w-[70px]">
          {fmtTime(currentTime)} / {fmtTime(duration)}
        </span>

        {/* Scrubber */}
        <div
          ref={scrubberRef}
          className="relative flex-1 h-6 flex items-center cursor-pointer group"
          onClick={seekTo}
        >
          {/* Track */}
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Flag markers */}
          {flaggedMarkers.map((m) => {
            const pct = ((m.word.start! / duration) * 100).toFixed(3);
            const color = STATUS_MARKER_COLOR[m.word.status] || "bg-text-secondary";
            return (
              <button
                key={m.index}
                type="button"
                className={`absolute top-0 h-6 w-1.5 rounded-sm ${color} opacity-60 hover:opacity-100 transition z-10`}
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeekToWord(m.index);
                }}
                title={`${m.word.scriptWord ?? m.word.spokenWord} (${m.word.status})`}
              />
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-accent shadow-md transition-[left] duration-100 group-hover:scale-125"
            style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)` }}
          />
        </div>
      </div>

      {/* Marker legend */}
      {flaggedMarkers.length > 0 && (
        <div className="flex gap-3 text-[10px] text-text-secondary pl-[100px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-error" /> Mismatch
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-teal-500/40" /> Phonetic
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-purple-500" /> Extra
          </span>
        </div>
      )}
    </div>
  );
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
