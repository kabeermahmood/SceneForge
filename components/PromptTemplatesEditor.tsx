"use client";

import { useState } from "react";
import { FileCode, RotateCcw, Check } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";

const VARIABLE_HINTS: Record<string, string[]> = {
  bible: ["{{script}}"],
  scene_description: ["{{scriptText}}", "{{chunkIndex}}", "{{totalScenes}}", "{{primarySetting}}", "{{overallMood}}"],
  image_prompt: [
    "{{chunkIndex}}", "{{totalScenes}}", "{{sceneDescription}}", "{{sceneEmotion}}",
    "{{artStylePrompt}}", "{{aspectRatio}}", "{{primarySetting}}", "{{overallMood}}", "{{colorPalette}}",
  ],
};

const LABELS: Record<string, string> = {
  bible: "Character Bible Prompt",
  scene_description: "Scene Description Prompt",
  image_prompt: "Image Generation Prompt",
};

export default function PromptTemplatesEditor() {
  const templates = useProjectStore((s) => s.prompt_templates);
  const setPromptTemplates = useProjectStore((s) => s.setPromptTemplates);
  const [saved, setSaved] = useState<string | null>(null);

  const handleSave = (key: "bible" | "scene_description" | "image_prompt", value: string) => {
    setPromptTemplates({ [key]: value || undefined });
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  const handleClear = (key: "bible" | "scene_description" | "image_prompt") => {
    setPromptTemplates({ [key]: undefined });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileCode size={16} className="text-accent" />
        <h3 className="font-heading text-sm font-bold text-text-primary">
          Prompt Templates
        </h3>
      </div>
      <p className="text-[11px] text-text-secondary">
        Override default prompts with custom templates. Use <code className="rounded bg-background px-1 font-mono text-accent">{"{{variable}}"}</code> syntax for dynamic values.
        Leave blank to use the built-in prompt.
      </p>

      {(["bible", "scene_description", "image_prompt"] as const).map((key) => (
        <div key={key} className="space-y-2">
          <label className="flex items-center justify-between text-xs font-medium text-text-primary">
            {LABELS[key]}
            {templates[key] && (
              <button
                onClick={() => handleClear(key)}
                className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-error"
              >
                <RotateCcw size={10} /> Reset to default
              </button>
            )}
          </label>
          <textarea
            value={templates[key] || ""}
            onChange={(e) => handleSave(key, e.target.value)}
            rows={4}
            placeholder="Leave blank for default prompt..."
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-[11px] text-text-primary placeholder:text-text-secondary/30 focus:border-accent focus:outline-none"
          />
          <div className="flex flex-wrap gap-1">
            {VARIABLE_HINTS[key].map((v) => (
              <span key={v} className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] text-accent">
                {v}
              </span>
            ))}
          </div>
          {saved === key && (
            <span className="flex items-center gap-1 text-[10px] text-success">
              <Check size={10} /> Saved
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
