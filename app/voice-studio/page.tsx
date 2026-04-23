"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
  X,
} from "lucide-react";
import Sidebar from "@/components/voice-studio/Sidebar";
import ScriptEditor from "@/components/voice-studio/ScriptEditor";
import CreditsBadge from "@/components/voice-studio/CreditsBadge";
import HistoryList from "@/components/voice-studio/HistoryList";
import PronunciationDictPanel from "@/components/voice-studio/PronunciationDictPanel";
import {
  ELEVENLABS_KEY_STORAGE,
  SELECTED_VOICE_STORAGE,
  SELECTED_MODEL_STORAGE,
  VOICE_SETTINGS_STORAGE,
  CONCURRENCY_STORAGE,
  DEFAULT_VOICE_SETTINGS,
  DEFAULT_MODEL_ID,
  DEFAULT_CONCURRENCY,
  FALLBACK_MAX_CONCURRENCY,
  MAX_CHARACTERS,
  SAFE_CHUNK_CHARS,
  getMaxConcurrency,
  type Voice,
  type VoiceSettings,
  type Subscription,
} from "@/lib/elevenlabs";
import { addHistoryEntry } from "@/lib/voiceHistory";
import { splitScript } from "@/lib/textChunker";
import {
  hashRules,
  loadEnabled,
  loadRules,
  loadSynced,
  saveEnabled,
  saveRules,
  saveSynced,
  type PronunciationRule,
  type SyncedDictState,
} from "@/lib/pronunciationDict";

export default function VoiceStudioPage() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);

  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [settings, setSettings] = useState<VoiceSettings>(
    DEFAULT_VOICE_SETTINGS
  );

  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const [historyTick, setHistoryTick] = useState(0);
  const [creditsTick, setCreditsTick] = useState(0);

  const [dictRules, setDictRules] = useState<PronunciationRule[]>([]);
  const [dictEnabled, setDictEnabled] = useState(false);
  const [dictSynced, setDictSynced] = useState<SyncedDictState | null>(null);
  const [dictPanelOpen, setDictPanelOpen] = useState(false);

  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const cancelledRef = useRef(false);

  const [concurrency, setConcurrency] = useState<number>(DEFAULT_CONCURRENCY);
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [planMaxConcurrency, setPlanMaxConcurrency] = useState<number>(
    FALLBACK_MAX_CONCURRENCY
  );

  useEffect(() => {
    const key = localStorage.getItem(ELEVENLABS_KEY_STORAGE)?.trim() || "";
    setHasApiKey(key.length > 0);

    const savedVoice = localStorage.getItem(SELECTED_VOICE_STORAGE) || "";
    if (savedVoice) setSelectedVoiceId(savedVoice);

    const savedModel = localStorage.getItem(SELECTED_MODEL_STORAGE);
    if (savedModel) setSelectedModelId(savedModel);

    const savedSettings = localStorage.getItem(VOICE_SETTINGS_STORAGE);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Partial<VoiceSettings>;
        setSettings({ ...DEFAULT_VOICE_SETTINGS, ...parsed });
      } catch {
        // ignore corrupt settings
      }
    }

    setDictRules(loadRules());
    setDictEnabled(loadEnabled());
    setDictSynced(loadSynced());

    const savedConcurrency = localStorage.getItem(CONCURRENCY_STORAGE);
    if (savedConcurrency) {
      const parsed = parseInt(savedConcurrency, 10);
      if (!Number.isNaN(parsed) && parsed >= 1) setConcurrency(parsed);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const fetchVoices = useCallback(async () => {
    const key = localStorage.getItem(ELEVENLABS_KEY_STORAGE)?.trim();
    if (!key) {
      setVoicesError("Add your ElevenLabs API key to load voices.");
      return;
    }
    setVoicesLoading(true);
    setVoicesError(null);
    try {
      const res = await fetch("/api/elevenlabs/voices", {
        headers: { "x-elevenlabs-key": key },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load voices");
      }
      const list = (data.voices ?? []) as Voice[];
      setVoices(list);
      if (list.length > 0) {
        setSelectedVoiceId((current) => {
          if (current && list.some((v) => v.voice_id === current)) {
            return current;
          }
          const first = list[0].voice_id;
          localStorage.setItem(SELECTED_VOICE_STORAGE, first);
          return first;
        });
      }
    } catch (err: unknown) {
      setVoicesError(
        err instanceof Error ? err.message : "Failed to load voices"
      );
    } finally {
      setVoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasApiKey) void fetchVoices();
  }, [hasApiKey, fetchVoices]);

  const persistSettings = (next: VoiceSettings) => {
    setSettings(next);
    localStorage.setItem(VOICE_SETTINGS_STORAGE, JSON.stringify(next));
  };

  const persistVoice = (id: string) => {
    setSelectedVoiceId(id);
    localStorage.setItem(SELECTED_VOICE_STORAGE, id);
  };

  const persistModel = (id: string) => {
    setSelectedModelId(id);
    localStorage.setItem(SELECTED_MODEL_STORAGE, id);
  };

  const persistConcurrency = (n: number) => {
    const safe = Math.max(1, Math.min(n, planMaxConcurrency));
    setConcurrency(safe);
    localStorage.setItem(CONCURRENCY_STORAGE, String(safe));
  };

  const handleSubscriptionLoaded = useCallback(
    (sub: Subscription) => {
      setPlanTier(sub.tier ?? null);
      const max = getMaxConcurrency(sub.tier);
      setPlanMaxConcurrency(max);
      // Clamp the user's saved choice down if their plan can't sustain it.
      setConcurrency((current) => {
        if (current > max) {
          localStorage.setItem(CONCURRENCY_STORAGE, String(max));
          return max;
        }
        return current;
      });
    },
    []
  );

  const handleDictToggle = (next: boolean) => {
    setDictEnabled(next);
    saveEnabled(next);
  };

  const handleDictSave = (next: PronunciationRule[]) => {
    setDictRules(next);
    saveRules(next);
    if (next.length === 0) {
      setDictSynced(null);
      saveSynced(null);
    }
  };

  const ensureDictionary = useCallback(async (): Promise<{
    id: string;
    version_id: string;
  } | null> => {
    if (!dictEnabled) return null;
    if (dictRules.length === 0) return null;
    if (selectedModelId === "eleven_v3") return null;

    const currentHash = hashRules(dictRules);
    if (
      dictSynced &&
      dictSynced.hash === currentHash &&
      dictSynced.id &&
      dictSynced.version_id
    ) {
      return { id: dictSynced.id, version_id: dictSynced.version_id };
    }

    const key = localStorage.getItem(ELEVENLABS_KEY_STORAGE)?.trim();
    if (!key) return null;

    const res = await fetch("/api/elevenlabs/dictionary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-elevenlabs-key": key,
      },
      body: JSON.stringify({ rules: dictRules }),
    });
    const data = await res.json();
    if (!res.ok || !data?.id || !data?.version_id) {
      throw new Error(
        data?.message || "Failed to sync pronunciation dictionary."
      );
    }

    const synced: SyncedDictState = {
      id: data.id,
      version_id: data.version_id,
      hash: currentHash,
      syncedAt: Date.now(),
    };
    setDictSynced(synced);
    saveSynced(synced);
    return { id: synced.id, version_id: synced.version_id };
  }, [dictEnabled, dictRules, dictSynced, selectedModelId]);

  const trimmed = script.trim();
  const overLimit = script.length > MAX_CHARACTERS;
  const canGenerate =
    hasApiKey &&
    trimmed.length > 0 &&
    !overLimit &&
    selectedVoiceId.length > 0 &&
    !generating;

  const generate = useCallback(async () => {
    if (!canGenerate) return;
    const key = localStorage.getItem(ELEVENLABS_KEY_STORAGE)?.trim();
    if (!key) {
      setError("ElevenLabs API key is missing.");
      return;
    }

    cancelledRef.current = false;
    setGenerating(true);
    setError(null);
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
      setResultUrl(null);
    }

    const chunks = splitScript(trimmed, SAFE_CHUNK_CHARS);
    if (chunks.length === 0) {
      setGenerating(false);
      setError("Script is empty after trimming.");
      return;
    }
    setProgress({ current: 0, total: chunks.length });

    try {
      let dictionaryLocator: { id: string; version_id: string } | null = null;
      try {
        dictionaryLocator = await ensureDictionary();
      } catch (dictErr: unknown) {
        throw new Error(
          dictErr instanceof Error
            ? `Pronunciation dictionary: ${dictErr.message}`
            : "Failed to sync pronunciation dictionary."
        );
      }

      const total = chunks.length;
      const audioBuffers: ArrayBuffer[] = new Array(total);
      const effectiveConcurrency = Math.max(
        1,
        Math.min(concurrency, planMaxConcurrency, total)
      );

      const fetchChunk = async (
        index: number,
        previousRequestIds: string[]
      ): Promise<string | null> => {
        const res = await fetch("/api/elevenlabs/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-elevenlabs-key": key,
          },
          body: JSON.stringify({
            text: chunks[index],
            voiceId: selectedVoiceId,
            modelId: selectedModelId,
            settings,
            dictionaryLocator,
            previousRequestIds,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const baseMsg =
            data?.message || `Generation failed (${res.status})`;
          throw new Error(
            total > 1
              ? `Part ${index + 1} of ${total}: ${baseMsg}`
              : baseMsg
          );
        }

        audioBuffers[index] = await res.arrayBuffer();
        return res.headers.get("x-elevenlabs-request-id");
      };

      let completed = 0;
      const bumpProgress = () => {
        completed += 1;
        setProgress({ current: completed, total });
      };

      if (effectiveConcurrency === 1) {
        // Sequential path — chain previous_request_ids for prosodic continuity.
        const requestIds: string[] = [];
        for (let i = 0; i < total; i++) {
          if (cancelledRef.current) {
            throw new Error("Generation cancelled.");
          }
          const id = await fetchChunk(i, requestIds.slice(-3));
          if (id) requestIds.push(id);
          bumpProgress();
        }
      } else {
        // Parallel worker pool — no prosody chain (each chunk starts cold).
        let nextIndex = 0;
        const worker = async () => {
          while (true) {
            if (cancelledRef.current) return;
            const i = nextIndex++;
            if (i >= total) return;
            await fetchChunk(i, []);
            bumpProgress();
          }
        };

        try {
          await Promise.all(
            Array.from({ length: effectiveConcurrency }, () => worker())
          );
        } catch (poolErr) {
          // Stop other workers ASAP and surface the first error.
          cancelledRef.current = true;
          throw poolErr;
        }
      }

      if (cancelledRef.current) {
        throw new Error("Generation cancelled.");
      }

      const blob = new Blob(audioBuffers, { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);

      const voice = voices.find((v) => v.voice_id === selectedVoiceId);
      await addHistoryEntry({
        voiceId: selectedVoiceId,
        voiceName: voice?.name || "Unknown voice",
        modelId: selectedModelId,
        scriptPreview:
          trimmed.slice(0, 140) + (trimmed.length > 140 ? "…" : ""),
        mimeType: "audio/mpeg",
        blob,
      });
      setHistoryTick((t) => t + 1);
      setCreditsTick((t) => t + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
      setProgress(null);
      cancelledRef.current = false;
    }
  }, [
    canGenerate,
    trimmed,
    selectedVoiceId,
    selectedModelId,
    settings,
    voices,
    ensureDictionary,
    concurrency,
    planMaxConcurrency,
  ]);

  const cancelGeneration = useCallback(() => {
    if (!generating) return;
    cancelledRef.current = true;
  }, [generating]);

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `voicestudio_${Date.now()}.mp3`;
    a.click();
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-3">
            <AudioLines className="text-accent" size={28} />
            Voice Studio
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Beta
            </span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Generate state-of-the-art voiceovers with ElevenLabs.
          </p>
        </div>
        {hasApiKey && (
          <CreditsBadge
            refreshSignal={creditsTick}
            onLoaded={handleSubscriptionLoaded}
          />
        )}
      </div>

      {/* Layout */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Sidebar
          hasApiKey={hasApiKey}
          voices={voices}
          voicesLoading={voicesLoading}
          voicesError={voicesError}
          onRefreshVoices={() => void fetchVoices()}
          selectedVoiceId={selectedVoiceId}
          onSelectVoice={persistVoice}
          selectedModelId={selectedModelId}
          onSelectModel={persistModel}
          settings={settings}
          onSettingsChange={persistSettings}
          disabled={generating}
          dictEnabled={dictEnabled}
          onDictToggle={handleDictToggle}
          dictRuleCount={dictRules.length}
          onOpenDict={() => setDictPanelOpen(true)}
          concurrency={concurrency}
          onConcurrencyChange={persistConcurrency}
          planMaxConcurrency={planMaxConcurrency}
          planTier={planTier}
        />

        <div className="space-y-4">
          <ScriptEditor
            value={script}
            onChange={setScript}
            disabled={generating}
          />

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-error/70 hover:text-error"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <button
            onClick={() => void generate()}
            disabled={!canGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-background transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {progress && progress.total > 1
                  ? `Generating part ${Math.max(progress.current, 1)} of ${progress.total}…`
                  : "Generating speech…"}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Speech
              </>
            )}
          </button>

          {generating && progress && (
            <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>
                  {progress.total > 1 ? (
                    <>
                      Stitching <span className="font-medium text-text-primary">{progress.total}</span> parts
                      {" "}&middot;{" "}
                      <span className="font-medium text-text-primary">
                        {progress.current}
                      </span>{" "}
                      done
                    </>
                  ) : (
                    "Synthesizing audio…"
                  )}
                </span>
                <button
                  onClick={cancelGeneration}
                  disabled={cancelledRef.current}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text-secondary transition hover:border-error/50 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                  title="Stop after current part"
                >
                  <X size={11} />
                  Cancel
                </button>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{
                    width: `${
                      progress.total > 0
                        ? Math.min(
                            100,
                            (progress.current / progress.total) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {resultUrl && (
            <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Latest Generation
                </h2>
                <button
                  onClick={downloadResult}
                  className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
                >
                  <Download size={12} />
                  Download MP3
                </button>
              </div>
              <audio
                controls
                src={resultUrl}
                className="w-full"
                preload="metadata"
              />
            </section>
          )}

          <HistoryList refreshSignal={historyTick} />
        </div>
      </div>

      <PronunciationDictPanel
        isOpen={dictPanelOpen}
        onClose={() => setDictPanelOpen(false)}
        rules={dictRules}
        onSave={handleDictSave}
        synced={dictSynced}
      />
    </div>
  );
}
