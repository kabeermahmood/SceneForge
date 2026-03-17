"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import PromptTemplatesEditor from "./PromptTemplatesEditor";
import AdvancedParamsPanel from "./AdvancedParamsPanel";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [modelList, setModelList] = useState<string[] | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const secondsPerScene = useProjectStore((s) => s.seconds_per_scene);
  const setSecondsPerScene = useProjectStore((s) => s.setSecondsPerScene);

  useEffect(() => {
    const stored = localStorage.getItem("gemini_api_key") || "";
    setApiKey(stored);
  }, [isOpen]);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem("gemini_api_key", val);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-text-primary">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-border hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              Get your free API key
              <ExternalLink size={12} />
            </a>
          </div>

          <div>
            <button
              onClick={async () => {
                if (!apiKey) return;
                setLoadingModels(true);
                try {
                  const res = await fetch("/api/list-models", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ apiKey }),
                  });
                  const data = await res.json();
                  setModelList(data.models || []);
                } catch {
                  setModelList(["Error fetching models"]);
                } finally {
                  setLoadingModels(false);
                }
              }}
              disabled={!apiKey || loadingModels}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              {loadingModels ? "Loading..." : "Test API Key & List Image Models"}
            </button>
            {modelList && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-background p-3">
                {modelList.length === 0 ? (
                  <p className="text-xs text-error">No image-capable models found</p>
                ) : (
                  modelList.map((m, i) => (
                    <p key={i} className="text-[11px] leading-relaxed text-text-secondary font-mono">
                      {m}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Seconds Per Scene
            </label>
            <input
              type="number"
              value={secondsPerScene}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val))
                  setSecondsPerScene(Math.max(5, Math.min(15, val)));
              }}
              min={5}
              max={15}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <p className="mt-2 text-xs text-text-secondary">
              How long each scene image stays on screen. Lower = more images,
              higher = fewer images.
            </p>
          </div>

          <div className="border-t border-border pt-6">
            <PromptTemplatesEditor />
          </div>

          <div className="border-t border-border pt-6">
            <AdvancedParamsPanel />
          </div>
        </div>
      </div>
    </>
  );
}
