"use client";

import { useState, useMemo } from "react";
import { Play, ArrowUpRight } from "lucide-react";
import type { DiffWord, DiffStatus } from "@/lib/pronunciationDiff";
import { getPhonetic } from "@/lib/pronunciationGuide";
import { formatTime } from "./DiffResults";

interface Props {
  words: DiffWord[];
  language: "en-GB" | "en-US";
  onPlayWord: (start: number, end: number) => void;
  onHighlightWord: (index: number) => void;
}

type FilterType = "all" | "phonetic_match" | "mismatch" | "missing" | "extra";

const FILTER_OPTIONS: { value: FilterType; label: string; color: string }[] = [
  { value: "all", label: "All", color: "text-text-primary" },
  { value: "mismatch", label: "Mismatches", color: "text-error" },
  { value: "phonetic_match", label: "Phonetic Matches", color: "text-teal-400" },
  { value: "missing", label: "Missing", color: "text-error/70" },
  { value: "extra", label: "Extra", color: "text-purple-400" },
];

const STATUS_BADGE: Record<DiffStatus, { label: string; cls: string }> = {
  match: { label: "Match", cls: "bg-success/20 text-success" },
  phonetic_match: { label: "Phonetic", cls: "bg-teal-500/20 text-teal-400" },
  mismatch: { label: "Mismatch", cls: "bg-error/20 text-error" },
  missing: { label: "Missing", cls: "bg-error/10 text-error/70" },
  extra: { label: "Extra", cls: "bg-purple-500/20 text-purple-400" },
};

export default function IssuesPanel({
  words,
  language,
  onPlayWord,
  onHighlightWord,
}: Props) {
  const [filter, setFilter] = useState<FilterType>("all");

  const issues = useMemo(() => {
    const flagged: { word: DiffWord; originalIndex: number }[] = [];
    words.forEach((w, i) => {
      if (w.status !== "match") flagged.push({ word: w, originalIndex: i });
    });
    if (filter === "all") return flagged;
    return flagged.filter((f) => f.word.status === filter);
  }, [words, filter]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === opt.value
                ? "bg-accent/15 text-accent"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {issues.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center text-sm text-text-secondary">
          No issues found for this filter.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_1fr_100px_70px_70px_120px_40px_40px] gap-2 border-b border-border bg-background/50 px-4 py-2.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
            <span>#</span>
            <span>Expected</span>
            <span>Spoken</span>
            <span>Type</span>
            <span>Conf.</span>
            <span>Time</span>
            <span>Pronunciation</span>
            <span></span>
            <span></span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {issues.map((issue, idx) => {
              const { word, originalIndex } = issue;
              const badge = STATUS_BADGE[word.status];
              const phonetic = word.scriptWord
                ? getPhonetic(word.scriptWord, language)
                : null;

              return (
                <div
                  key={originalIndex}
                  className="grid grid-cols-[40px_1fr_1fr_100px_70px_70px_120px_40px_40px] gap-2 px-4 py-3 text-xs items-center hover:bg-border/20 transition"
                >
                  <span className="text-text-secondary font-mono">{idx + 1}</span>

                  <span className="text-text-primary font-medium truncate">
                    {word.scriptWord ?? "—"}
                  </span>

                  <span className="text-text-primary truncate">
                    {word.spokenWord ?? "—"}
                  </span>

                  <span>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </span>

                  <span className={`font-mono ${
                    word.confidence !== null
                      ? word.confidence >= 0.85
                        ? "text-success"
                        : "text-amber-400"
                      : "text-text-secondary"
                  }`}>
                    {word.confidence !== null
                      ? `${(word.confidence * 100).toFixed(0)}%`
                      : "—"}
                  </span>

                  <span className="text-text-secondary font-mono">
                    {word.start !== null ? formatTime(word.start) : "—"}
                  </span>

                  <span className="text-accent text-[11px] truncate" title={phonetic?.notes}>
                    {phonetic ? phonetic.phonetic : "—"}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (word.start !== null && word.end !== null) {
                        onPlayWord(word.start, word.end);
                      }
                    }}
                    disabled={word.start === null}
                    className="rounded-lg p-1.5 text-text-secondary hover:text-accent hover:bg-accent/10 transition disabled:opacity-30"
                    title="Play audio segment"
                  >
                    <Play size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onHighlightWord(originalIndex)}
                    className="rounded-lg p-1.5 text-text-secondary hover:text-accent hover:bg-accent/10 transition"
                    title="Show in word flow"
                  >
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
