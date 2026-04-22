"use client";

import { useEffect, useRef, useState } from "react";
import {
  KeyRound,
  Loader2,
  RefreshCw,
  Mic2,
  Settings2,
  ChevronDown,
  Play,
  Pause,
  Cpu,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  ELEVENLABS_KEY_STORAGE,
  ELEVENLABS_MODELS,
  type Voice,
  type VoiceSettings,
} from "@/lib/elevenlabs";
import PronunciationDictSection from "./PronunciationDictSection";

interface SidebarProps {
  hasApiKey: boolean;
  voices: Voice[];
  voicesLoading: boolean;
  voicesError: string | null;
  onRefreshVoices: () => void;
  selectedVoiceId: string;
  onSelectVoice: (id: string) => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  settings: VoiceSettings;
  onSettingsChange: (next: VoiceSettings) => void;
  disabled: boolean;
  dictEnabled: boolean;
  onDictToggle: (next: boolean) => void;
  dictRuleCount: number;
  onOpenDict: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const {
    hasApiKey,
    voices,
    voicesLoading,
    voicesError,
    onRefreshVoices,
    selectedVoiceId,
    onSelectVoice,
    selectedModelId,
    onSelectModel,
    settings,
    onSettingsChange,
    disabled,
    dictEnabled,
    onDictToggle,
    dictRuleCount,
    onOpenDict,
  } = props;

  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        voiceMenuRef.current &&
        !voiceMenuRef.current.contains(e.target as Node)
      ) {
        setVoiceMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePreview = (voice: Voice) => {
    if (!voice.preview_url) return;
    if (previewingId === voice.voice_id) {
      audioRef.current?.pause();
      setPreviewingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(voice.preview_url);
    audio.onended = () => setPreviewingId(null);
    audio.onerror = () => setPreviewingId(null);
    audioRef.current = audio;
    void audio.play();
    setPreviewingId(voice.voice_id);
  };

  const selectedVoice = voices.find((v) => v.voice_id === selectedVoiceId);

  return (
    <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
      {/* API key block */}
      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
          <KeyRound size={12} className="text-accent" />
          API Key
        </div>
        <div className="mt-3">
          {hasApiKey ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <span className="font-mono tracking-widest text-text-secondary">
                ••••••••••••••••
              </span>
              <Link
                href="/api-keys"
                className="text-xs font-medium text-accent hover:underline"
              >
                Edit
              </Link>
            </div>
          ) : (
            <Link
              href="/api-keys"
              className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>
                Add ElevenLabs key in <span className="underline">API Keys</span>
              </span>
            </Link>
          )}
          <input
            type="hidden"
            name={ELEVENLABS_KEY_STORAGE}
            value={hasApiKey ? "set" : ""}
            readOnly
          />
        </div>
      </section>

      {/* Voice template selector */}
      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-text-secondary">
          <span className="flex items-center gap-2">
            <Mic2 size={12} className="text-accent" />
            Voice Template
          </span>
          <button
            onClick={onRefreshVoices}
            disabled={!hasApiKey || voicesLoading}
            title="Refresh voice list"
            className="rounded p-1 text-text-secondary transition hover:bg-border/50 hover:text-text-primary disabled:opacity-40"
          >
            {voicesLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
          </button>
        </div>

        <div className="relative mt-3" ref={voiceMenuRef}>
          <button
            onClick={() => setVoiceMenuOpen((o) => !o)}
            disabled={disabled || !hasApiKey || voices.length === 0}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="truncate">
              {selectedVoice?.name ||
                (voicesLoading
                  ? "Loading voices…"
                  : voices.length === 0
                    ? "No voices available"
                    : "Select a voice")}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-text-secondary transition ${
                voiceMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {voiceMenuOpen && voices.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
              {voices.map((voice) => (
                <div
                  key={voice.voice_id}
                  className={`flex items-center gap-2 border-b border-border/50 px-3 py-2 last:border-b-0 ${
                    voice.voice_id === selectedVoiceId
                      ? "bg-accent/10"
                      : "hover:bg-border/30"
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectVoice(voice.voice_id);
                      setVoiceMenuOpen(false);
                    }}
                    className="flex flex-1 flex-col items-start text-left"
                  >
                    <span className="text-sm text-text-primary">
                      {voice.name}
                    </span>
                    {voice.labels &&
                      Object.keys(voice.labels).length > 0 && (
                        <span className="text-[10px] uppercase tracking-wide text-text-secondary">
                          {[
                            voice.labels.gender,
                            voice.labels.age,
                            voice.labels.accent,
                            voice.labels.use_case,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      )}
                  </button>
                  {voice.preview_url && (
                    <button
                      onClick={() => togglePreview(voice)}
                      title="Preview voice"
                      className="rounded-full p-1.5 text-text-secondary hover:bg-accent/15 hover:text-accent"
                    >
                      {previewingId === voice.voice_id ? (
                        <Pause size={12} />
                      ) : (
                        <Play size={12} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {voicesError && (
          <p className="mt-2 text-xs text-error">{voicesError}</p>
        )}
      </section>

      {/* Model selector */}
      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
          <Cpu size={12} className="text-accent" />
          Model
        </div>
        <div className="mt-3 space-y-1.5">
          {ELEVENLABS_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectModel(m.id)}
              disabled={disabled}
              className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                selectedModelId === m.id
                  ? "border-accent/50 bg-accent/10 text-text-primary"
                  : "border-border bg-background text-text-secondary hover:border-accent/30 hover:text-text-primary"
              } disabled:opacity-50`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.label}</span>
                {selectedModelId === m.id && (
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-text-secondary">
                {m.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Voice settings (collapsible) */}
      <section className="rounded-2xl border border-border bg-surface">
        <button
          onClick={() => setSettingsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-secondary">
            <Settings2 size={12} className="text-accent" />
            Voice Settings
          </span>
          <ChevronDown
            size={14}
            className={`text-text-secondary transition ${
              settingsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {settingsOpen && (
          <div className="space-y-4 border-t border-border px-4 py-4">
            <Slider
              label="Stability"
              value={settings.stability}
              onChange={(v) =>
                onSettingsChange({ ...settings, stability: v })
              }
              hint="Lower = more variable, higher = more consistent"
              disabled={disabled}
            />
            <Slider
              label="Similarity"
              value={settings.similarity_boost}
              onChange={(v) =>
                onSettingsChange({ ...settings, similarity_boost: v })
              }
              hint="How closely the AI sticks to the original voice"
              disabled={disabled}
            />
            <Slider
              label="Style"
              value={settings.style}
              onChange={(v) => onSettingsChange({ ...settings, style: v })}
              hint="Exaggerates the voice's style. Higher = slower"
              disabled={disabled}
            />
            <label className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Speaker Boost</span>
              <input
                type="checkbox"
                checked={settings.use_speaker_boost}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    use_speaker_boost: e.target.checked,
                  })
                }
                disabled={disabled}
                className="h-4 w-4 cursor-pointer accent-[var(--color-accent)] disabled:opacity-50"
              />
            </label>
          </div>
        )}
      </section>

      {/* Pronunciation dictionary */}
      <PronunciationDictSection
        enabled={dictEnabled}
        onToggle={onDictToggle}
        ruleCount={dictRuleCount}
        onManage={onOpenDict}
        disabled={disabled}
        v3Warning={selectedModelId === "eleven_v3"}
      />
    </aside>
  );
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
}

function Slider({ label, value, onChange, hint, disabled }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-accent">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full cursor-pointer accent-[var(--color-accent)] disabled:opacity-50"
      />
      {hint && (
        <p className="text-[10px] leading-snug text-text-secondary">{hint}</p>
      )}
    </div>
  );
}
