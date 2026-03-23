"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { List, AlignLeft, Volume2 } from "lucide-react";
import type { DiffWord, DiffStats } from "@/lib/pronunciationDiff";
import { getPhonetic } from "@/lib/pronunciationGuide";
import IssuesPanel from "./IssuesPanel";
import AudioTimeline from "./AudioTimeline";

interface Props {
  words: DiffWord[];
  stats: DiffStats;
  audioUrl: string | null;
  language: "en-GB" | "en-US";
}

const STATUS_LABELS: Record<string, string> = {
  match: "Exact Match",
  phonetic_match: "Phonetic Match",
  mismatch: "Mismatch",
  missing: "Missing from audio",
  extra: "Extra in audio",
};

const LEGEND = [
  { label: "Exact Match", cls: "text-text-primary" },
  { label: "Phonetic Match", cls: "border-b-2 border-dashed border-teal-500/60 text-text-primary" },
  { label: "Mismatch", cls: "bg-error/20 text-error rounded px-1.5" },
  { label: "Missing", cls: "line-through text-error/70" },
  { label: "Extra", cls: "bg-purple-500/20 text-purple-400 rounded px-1.5" },
];

function WordToken({
  word,
  index,
  highlightIndex,
  language,
  onPlayWord,
}: {
  word: DiffWord;
  index: number;
  highlightIndex: number | null;
  language: "en-GB" | "en-US";
  onPlayWord: (start: number, end: number) => void;
}) {
  const [showTip, setShowTip] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isHighlighted = highlightIndex === index;
  const isFlagged = word.status !== "match";

  useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  const phonetic = word.scriptWord
    ? getPhonetic(word.scriptWord, language)
    : null;

  const handleClick = () => {
    if (word.start !== null && word.end !== null) {
      onPlayWord(word.start, word.end);
    }
  };

  if (word.status === "match") {
    return <span className="inline">{word.spokenWord ?? word.scriptWord}</span>;
  }

  const highlightRing = isHighlighted
    ? "ring-2 ring-accent ring-offset-1 ring-offset-background rounded"
    : "";

  if (word.status === "phonetic_match") {
    return (
      <span
        ref={ref}
        className={`relative inline cursor-pointer border-b-2 border-dashed border-teal-500/60 ${highlightRing}`}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onClick={handleClick}
        data-word-index={index}
      >
        {word.spokenWord}
        <Tooltip
          show={showTip}
          word={word}
          phonetic={phonetic}
          language={language}
        />
      </span>
    );
  }

  if (word.status === "mismatch") {
    return (
      <span
        ref={ref}
        className={`relative inline-block cursor-pointer rounded bg-error/20 px-1.5 py-0.5 text-error ${highlightRing}`}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onClick={handleClick}
        data-word-index={index}
      >
        <span className="text-[10px] opacity-70">Expected:</span>{" "}
        <span className="font-medium">{word.scriptWord}</span>{" "}
        <span className="text-[10px] opacity-70">| Heard:</span>{" "}
        <span className="font-medium">{word.spokenWord}</span>
        <Tooltip
          show={showTip}
          word={word}
          phonetic={phonetic}
          language={language}
        />
      </span>
    );
  }

  if (word.status === "missing") {
    return (
      <span
        ref={ref}
        className={`relative inline cursor-default line-through text-error/70 ${highlightRing}`}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        data-word-index={index}
      >
        {word.scriptWord}
        <Tooltip
          show={showTip}
          word={word}
          phonetic={phonetic}
          language={language}
        />
      </span>
    );
  }

  // extra
  return (
    <span
      ref={ref}
      className={`relative inline cursor-pointer rounded bg-purple-500/20 px-1 text-purple-400 ${highlightRing}`}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      onClick={handleClick}
      data-word-index={index}
    >
      {word.spokenWord}
      <Tooltip
        show={showTip}
        word={word}
        phonetic={phonetic}
        language={language}
      />
    </span>
  );
}

function Tooltip({
  show,
  word,
  phonetic,
  language,
}: {
  show: boolean;
  word: DiffWord;
  phonetic: { phonetic: string; notes?: string } | null;
  language: string;
}) {
  if (!show) return null;
  return (
    <span className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg pointer-events-none">
      <span className="block font-semibold text-text-primary">
        {STATUS_LABELS[word.status]}
      </span>
      {word.scriptWord && (
        <span className="block text-text-secondary">
          Expected: <span className="text-text-primary">{word.scriptWord}</span>
        </span>
      )}
      {word.spokenWord && (
        <span className="block text-text-secondary">
          Spoken: <span className="text-text-primary">{word.spokenWord}</span>
        </span>
      )}
      {word.confidence !== null && (
        <span className="block text-text-secondary">
          Confidence:{" "}
          <span className={word.confidence >= 0.85 ? "text-success" : "text-amber-400"}>
            {(word.confidence * 100).toFixed(1)}%
          </span>
        </span>
      )}
      {word.start !== null && (
        <span className="block text-text-secondary">
          Time: {formatTime(word.start)}
        </span>
      )}
      {phonetic && (
        <span className="block text-accent">
          Say: {phonetic.phonetic}
          {phonetic.notes && (
            <span className="block text-text-secondary/70">{phonetic.notes}</span>
          )}
        </span>
      )}
      {word.start !== null && (
        <span className="block mt-1 text-accent/60">
          <Volume2 size={10} className="inline mr-1" />
          Click to play
        </span>
      )}
    </span>
  );
}

export default function DiffResults({ words, stats, audioUrl, language }: Props) {
  const [activeTab, setActiveTab] = useState<"flow" | "issues">("flow");
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimeRef = useRef<number | null>(null);

  const playWordSegment = useCallback(
    (start: number, end: number) => {
      if (!audioRef.current || !audioUrl) return;
      const audio = audioRef.current;
      stopTimeRef.current = end + 0.15;
      audio.currentTime = Math.max(0, start - 0.05);
      audio.play();
    },
    [audioUrl]
  );

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || stopTimeRef.current === null) return;
    if (audio.currentTime >= stopTimeRef.current) {
      audio.pause();
      stopTimeRef.current = null;
    }
  }, []);

  const handleHighlight = useCallback((idx: number) => {
    setHighlightIndex(idx);
    setActiveTab("flow");
    setTimeout(() => setHighlightIndex(null), 2000);
  }, []);

  const issueCount = stats.mismatches + stats.missing + stats.extra;

  return (
    <div className="space-y-5 animate-fade-in">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          preload="auto"
        />
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Words" value={stats.total} />
        <StatCard label="Exact Matches" value={stats.matches} color="text-success" />
        <StatCard label="Phonetic Matches" value={stats.phoneticMatches} color="text-teal-400" />
        <StatCard label="Mismatches" value={stats.mismatches} color="text-error" />
        <StatCard label="Missing" value={stats.missing} color="text-error/70" />
        <StatCard
          label="Accuracy"
          value={`${stats.accuracy}%`}
          color={stats.accuracy >= 90 ? "text-success" : stats.accuracy >= 70 ? "text-amber-400" : "text-error"}
        />
      </div>

      {/* Audio timeline */}
      {audioUrl && (
        <AudioTimeline
          audioRef={audioRef}
          words={words}
          onSeekToWord={(idx) => {
            handleHighlight(idx);
            const w = words[idx];
            if (w.start !== null && w.end !== null) {
              playWordSegment(w.start, w.end);
            }
          }}
        />
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("flow")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === "flow"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <AlignLeft size={14} />
          Word Flow
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
            activeTab === "issues"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <List size={14} />
          Issues List
          {issueCount > 0 && (
            <span className="rounded-full bg-error/20 text-error px-2 py-0.5 text-[10px] font-bold">
              {issueCount}
            </span>
          )}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`inline-block py-0.5 ${l.cls}`}>Aa</span>
            <span className="text-text-secondary">{l.label}</span>
          </span>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "flow" ? (
        <div className="rounded-xl border border-border bg-surface p-5 leading-10 text-sm">
          {words.map((w, i) => (
            <span key={i} className="inline">
              <WordToken
                word={w}
                index={i}
                highlightIndex={highlightIndex}
                language={language}
                onPlayWord={playWordSegment}
              />{" "}
            </span>
          ))}
        </div>
      ) : (
        <IssuesPanel
          words={words}
          language={language}
          onPlayWord={playWordSegment}
          onHighlightWord={handleHighlight}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 text-center">
      <p className={`text-xl font-bold font-heading ${color ?? "text-text-primary"}`}>
        {value}
      </p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  );
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}
