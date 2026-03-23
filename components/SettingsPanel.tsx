"use client";

import { X, KeyRound } from "lucide-react";
import Link from "next/link";
import { useProjectStore } from "@/store/useProjectStore";
import PromptTemplatesEditor from "./PromptTemplatesEditor";
import AdvancedParamsPanel from "./AdvancedParamsPanel";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const secondsPerScene = useProjectStore((s) => s.seconds_per_scene);
  const setSecondsPerScene = useProjectStore((s) => s.setSecondsPerScene);

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
          <Link
            href="/api-keys"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm transition hover:border-accent hover:bg-accent/5"
          >
            <KeyRound size={18} className="text-accent" />
            <div>
              <p className="font-medium text-text-primary">API Keys</p>
              <p className="text-xs text-text-secondary">
                Manage all your API keys in one place
              </p>
            </div>
          </Link>

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
