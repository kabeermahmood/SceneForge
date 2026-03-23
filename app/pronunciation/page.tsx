"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, Loader2, AlertCircle, KeyRound, Globe, Cpu } from "lucide-react";
import Link from "next/link";
import ScriptInput from "@/components/pronunciation/ScriptInput";
import AudioUpload from "@/components/pronunciation/AudioUpload";
import DiffResults from "@/components/pronunciation/DiffResults";
import {
  cleanText,
  diffWords,
  computeStats,
  type DiffWord,
  type DiffStats,
  type TranscriptWord,
} from "@/lib/pronunciationDiff";

const DG_KEY_STORAGE = "deepgram_api_key";

export default function PronunciationPage() {
  const [script, setScript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DiffWord[] | null>(null);
  const [stats, setStats] = useState<DiffStats | null>(null);
  const [dgKey, setDgKey] = useState("");
  const [language, setLanguage] = useState<"en-GB" | "en-US">("en-GB");
  const [dgModel, setDgModel] = useState<"nova-2" | "nova-3">("nova-2");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setDgKey(localStorage.getItem(DG_KEY_STORAGE) || "");
    const savedLang = localStorage.getItem("pronunciation_language");
    if (savedLang === "en-US" || savedLang === "en-GB") setLanguage(savedLang);
    const savedModel = localStorage.getItem("pronunciation_model");
    if (savedModel === "nova-2" || savedModel === "nova-3") setDgModel(savedModel);
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const canSubmit = script.trim().length > 0 && audioFile !== null && !loading;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setStats(null);

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      setAudioUrl(null);
    }

    try {
      const formData = new FormData();
      formData.append("audio", audioFile!);
      formData.append("language", language);
      formData.append("model", dgModel);

      const headers: Record<string, string> = {};
      if (dgKey.trim()) headers["x-deepgram-key"] = dgKey.trim();

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Transcription failed (${res.status})`);
      }

      const transcriptWords: TranscriptWord[] = data.words;
      const scriptWords = cleanText(script);
      const diff = diffWords(scriptWords, transcriptWords);
      const diffStats = computeStats(diff);

      const url = URL.createObjectURL(audioFile!);
      audioUrlRef.current = url;
      setAudioUrl(url);

      setResults(diff);
      setStats(diffStats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, audioFile, dgKey, script, language, dgModel]);

  return (
    <div className="py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-3">
          <Mic className="text-accent" size={28} />
          Pronunciation Quality Checker
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Compare your reference script against an AI voiceover using phonetic
          matching (Double Metaphone) to find mispronunciations while ignoring
          valid spelling variations.
        </p>
      </div>

      {/* API Key reminder */}
      {!dgKey.trim() && (
        <Link
          href="/api-keys"
          className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm transition hover:bg-amber-500/10"
        >
          <KeyRound size={16} className="text-amber-400 shrink-0" />
          <p className="text-amber-400">
            Deepgram API key not configured.{" "}
            <span className="underline">Go to API Keys</span> to add it.
          </p>
        </Link>
      )}

      {/* Language & Model Selectors */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <Globe size={16} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">Language:</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {([
              { value: "en-GB" as const, label: "British English" },
              { value: "en-US" as const, label: "American English" },
            ]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  setLanguage(value);
                  localStorage.setItem("pronunciation_language", value);
                }}
                disabled={loading}
                className={`px-4 py-2 text-xs font-medium transition-all ${
                  language === value
                    ? "bg-accent/15 text-accent"
                    : "bg-surface text-text-secondary hover:bg-border/50 hover:text-text-primary"
                } disabled:opacity-50`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Cpu size={16} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">Model:</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {([
              { value: "nova-2" as const, label: "Nova-2" },
              { value: "nova-3" as const, label: "Nova-3" },
            ]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  setDgModel(value);
                  localStorage.setItem("pronunciation_model", value);
                }}
                disabled={loading}
                className={`px-4 py-2 text-xs font-medium transition-all ${
                  dgModel === value
                    ? "bg-accent/15 text-accent"
                    : "bg-surface text-text-secondary hover:bg-border/50 hover:text-text-primary"
                } disabled:opacity-50`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ScriptInput value={script} onChange={setScript} disabled={loading} />
        <AudioUpload file={audioFile} onFileChange={setAudioFile} disabled={loading} />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-background transition hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analysing…
            </>
          ) : (
            <>
              <Mic size={16} />
              Check Pronunciation
            </>
          )}
        </button>

        {loading && (
          <p className="text-xs text-text-secondary">
            Sending audio to Deepgram ({dgModel}, {language})…
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error animate-fade-in">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {results && stats && (
        <DiffResults
          words={results}
          stats={stats}
          audioUrl={audioUrl}
          language={language}
        />
      )}
    </div>
  );
}
