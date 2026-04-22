"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ShieldCheck,
  CircleDot,
  Save,
} from "lucide-react";

interface KeyConfig {
  id: string;
  label: string;
  storageKey: string;
  description: string;
  getKeyUrl: string;
  getKeyLabel: string;
  provider: string;
}

interface KeyGroup {
  title: string;
  description: string;
  keys: KeyConfig[];
}

const KEY_GROUPS: KeyGroup[] = [
  {
    title: "AI Services",
    description: "Language models for scripts & image generation",
    keys: [
      {
        id: "gemini",
        label: "Google AI (Gemini)",
        storageKey: "gemini_api_key",
        description: "Powers image generation, character bibles, and scene prompts",
        getKeyUrl: "https://aistudio.google.com/apikey",
        getKeyLabel: "Get key",
        provider: "gemini",
      },
    ],
  },
  {
    title: "Image Generation",
    description: "Third-party image generation providers",
    keys: [
      {
        id: "replicate",
        label: "Replicate",
        storageKey: "replicate_api_key",
        description:
          "Required for Nano Banana Pro thumbnail generation",
        getKeyUrl: "https://replicate.com/account/api-tokens",
        getKeyLabel: "Get token",
        provider: "replicate",
      },
    ],
  },
  {
    title: "Speech-to-Text",
    description: "Voice transcription providers",
    keys: [
      {
        id: "deepgram",
        label: "Deepgram",
        storageKey: "deepgram_api_key",
        description: "Required for Pronunciation Checker (nova-2, en-GB)",
        getKeyUrl: "https://console.deepgram.com/signup",
        getKeyLabel: "Get key",
        provider: "deepgram",
      },
    ],
  },
  {
    title: "Voice Synthesis",
    description: "Text-to-speech voiceover providers",
    keys: [
      {
        id: "elevenlabs",
        label: "ElevenLabs",
        storageKey: "elevenlabs_api_key",
        description:
          "Powers Voice Studio TTS generation, voice library, and credit balance",
        getKeyUrl: "https://elevenlabs.io/app/settings/api-keys",
        getKeyLabel: "Get key",
        provider: "elevenlabs",
      },
    ],
  },
];

type TestStatus = "idle" | "testing" | "success" | "error";

interface KeyState {
  value: string;
  visible: boolean;
  copied: boolean;
  testStatus: TestStatus;
  testMessage: string;
  dirty: boolean;
}

function initialKeyState(): KeyState {
  return {
    value: "",
    visible: false,
    copied: false,
    testStatus: "idle",
    testMessage: "",
    dirty: false,
  };
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<Record<string, KeyState>>({});
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    const loaded: Record<string, KeyState> = {};
    for (const group of KEY_GROUPS) {
      for (const k of group.keys) {
        loaded[k.id] = {
          ...initialKeyState(),
          value: localStorage.getItem(k.storageKey) || "",
        };
      }
    }
    setKeys(loaded);
  }, []);

  const updateKey = (id: string, patch: Partial<KeyState>) => {
    setKeys((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const configuredCount = Object.values(keys).filter(
    (k) => k.value.trim().length > 0
  ).length;
  const totalCount = KEY_GROUPS.reduce((s, g) => s + g.keys.length, 0);

  const handleSave = useCallback(() => {
    for (const group of KEY_GROUPS) {
      for (const k of group.keys) {
        const state = keys[k.id];
        if (state) {
          localStorage.setItem(k.storageKey, state.value.trim());
          updateKey(k.id, { dirty: false });
        }
      }
    }
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }, [keys]);

  const handleTest = useCallback(
    async (config: KeyConfig) => {
      const state = keys[config.id];
      if (!state?.value.trim()) return;

      updateKey(config.id, { testStatus: "testing", testMessage: "" });

      try {
        const res = await fetch("/api/test-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: config.provider,
            apiKey: state.value.trim(),
          }),
        });
        const data = await res.json();

        if (data.valid) {
          updateKey(config.id, {
            testStatus: "success",
            testMessage: data.message,
          });
        } else {
          updateKey(config.id, {
            testStatus: "error",
            testMessage: data.error || "Key validation failed",
          });
        }
      } catch {
        updateKey(config.id, {
          testStatus: "error",
          testMessage: "Network error — could not reach server",
        });
      }
    },
    [keys]
  );

  const handleCopy = (id: string) => {
    const val = keys[id]?.value;
    if (!val) return;
    navigator.clipboard.writeText(val);
    updateKey(id, { copied: true });
    setTimeout(() => updateKey(id, { copied: false }), 1500);
  };

  const hasDirty = Object.values(keys).some((k) => k.dirty);

  if (Object.keys(keys).length === 0) return null;

  return (
    <div className="py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-3">
            <KeyRound className="text-accent" size={28} />
            API Keys
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure your service integrations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
            <CircleDot
              size={10}
              className={configuredCount > 0 ? "text-success" : "text-text-secondary"}
            />
            <span className="text-text-secondary">
              {configuredCount}/{totalCount} configured
            </span>
          </span>

          <button
            onClick={handleSave}
            disabled={!hasDirty}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              saveFlash
                ? "bg-success/20 text-success border border-success/30"
                : hasDirty
                  ? "bg-accent text-background hover:bg-accent-hover"
                  : "bg-surface text-text-secondary border border-border cursor-default opacity-60"
            }`}
          >
            {saveFlash ? (
              <>
                <Check size={16} />
                Saved
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Key Groups */}
      <div className="grid gap-6 lg:grid-cols-2">
        {KEY_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-border bg-surface overflow-hidden"
          >
            {/* Group Header */}
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                  <ShieldCheck size={18} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">
                    {group.title}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {group.description}
                  </p>
                </div>
              </div>
              {/* Status dots */}
              <div className="flex gap-1.5 pt-1">
                {group.keys.map((k) => (
                  <span
                    key={k.id}
                    className={`h-2.5 w-2.5 rounded-full ${
                      keys[k.id]?.value.trim()
                        ? keys[k.id]?.testStatus === "success"
                          ? "bg-success"
                          : keys[k.id]?.testStatus === "error"
                            ? "bg-error"
                            : "bg-accent"
                        : "bg-text-secondary/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Keys */}
            <div className="divide-y divide-border">
              {group.keys.map((config) => {
                const state = keys[config.id];
                if (!state) return null;

                return (
                  <div key={config.id} className="px-5 py-4 space-y-3">
                    {/* Label row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            state.value.trim() ? "bg-success" : "bg-text-secondary/30"
                          }`}
                        />
                        <span className="text-sm font-medium text-text-primary">
                          {config.label}
                        </span>
                      </div>
                      <a
                        href={config.getKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        {config.getKeyLabel}
                        <ExternalLink size={11} />
                      </a>
                    </div>

                    {/* Input row */}
                    <div className="flex gap-2">
                      <input
                        type={state.visible ? "text" : "password"}
                        value={state.value}
                        onChange={(e) =>
                          updateKey(config.id, {
                            value: e.target.value,
                            dirty: true,
                            testStatus: "idle",
                            testMessage: "",
                          })
                        }
                        placeholder={`Enter your ${config.label} key…`}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tracking-wide"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          updateKey(config.id, { visible: !state.visible })
                        }
                        title={state.visible ? "Hide" : "Show"}
                        className="rounded-lg border border-border p-2 text-text-secondary hover:text-text-primary transition"
                      >
                        {state.visible ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(config.id)}
                        title="Copy"
                        className="rounded-lg border border-border p-2 text-text-secondary hover:text-text-primary transition"
                      >
                        {state.copied ? (
                          <Check size={16} className="text-success" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTest(config)}
                        disabled={
                          !state.value.trim() ||
                          state.testStatus === "testing"
                        }
                        className="rounded-lg bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition disabled:opacity-40"
                      >
                        {state.testStatus === "testing" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Test"
                        )}
                      </button>
                    </div>

                    {/* Description + test result */}
                    <p className="text-xs text-text-secondary">
                      {config.description}
                    </p>

                    {state.testMessage && (
                      <p
                        className={`text-xs ${
                          state.testStatus === "success"
                            ? "text-success"
                            : "text-error"
                        }`}
                      >
                        {state.testMessage}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-text-secondary text-center">
        Keys are stored locally in your browser and never sent to our servers.
        They are only used to call the respective provider APIs directly.
      </p>
    </div>
  );
}
