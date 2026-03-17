"use client";

import { useState } from "react";
import { Eye, EyeOff, Play, ChevronDown, ChevronUp, Download, SkipForward, FileText } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";

interface PromptReviewProps {
  onApprove: () => void;
  onSkipToComplete: () => void;
}

export default function PromptReview({ onApprove, onSkipToComplete }: PromptReviewProps) {
  const scenes = useProjectStore((s) => s.scenes);
  const updateScene = useProjectStore((s) => s.updateScene);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);

  const downloadPrompts = () => {
    const txt = scenes
      .map((scene) => {
        const prompt = scene.generation_prompt.replace(/\n\s*\n/g, "\n");
        return `Scene ${scene.chunk_index}\n${prompt}`;
      })
      .join("\n\n\n");

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sceneforge_image_prompts.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadScriptMap = () => {
    const txt = scenes
      .map((scene) => `Scene ${scene.chunk_index}\n${scene.script_text}`)
      .join("\n\n\n");

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sceneforge_script_map.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-text-primary">
            Review Image Prompts
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            These prompts will be sent to the image model. Edit any prompt before generating.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadScriptMap}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <FileText size={14} />
            Script Map (.txt)
          </button>
          <button
            onClick={downloadPrompts}
            className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          >
            <Download size={14} />
            Prompts (.txt)
          </button>
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            {showAll ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAll ? "Collapse All" : "Expand All"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {scenes.map((scene, i) => {
          const isOpen = showAll || expandedIdx === i;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-border bg-surface transition-all"
            >
              <button
                onClick={() => setExpandedIdx(isOpen && !showAll ? null : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                    {scene.chunk_index}
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    {scene.scene_description.slice(0, 80)}
                    {scene.scene_description.length > 80 ? "..." : ""}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp size={14} className="shrink-0 text-text-secondary" />
                ) : (
                  <ChevronDown size={14} className="shrink-0 text-text-secondary" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-border px-4 py-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                      Scene Description
                    </label>
                    <textarea
                      value={scene.scene_description}
                      onChange={(e) => updateScene(i, { scene_description: e.target.value })}
                      rows={2}
                      className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                      Full Image Prompt
                    </label>
                    <textarea
                      value={scene.generation_prompt}
                      onChange={(e) => updateScene(i, { generation_prompt: e.target.value })}
                      rows={8}
                      className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-[11px] leading-relaxed text-text-primary focus:border-accent focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-text-secondary/60">
                      {scene.generation_prompt.length} characters
                    </p>
                  </div>

                  <div className="flex gap-4 text-[11px] text-text-secondary">
                    <span>
                      Emotion: <strong className="text-text-primary">{scene.scene_emotion}</strong>
                    </span>
                    <span>
                      Characters:{" "}
                      <strong className="text-text-primary">
                        {scene.characters_present.join(", ") || "none"}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onSkipToComplete}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-accent/30 bg-surface py-4 text-sm font-bold text-accent transition-all hover:border-accent hover:bg-accent/5"
        >
          <SkipForward size={18} />
          Skip to Animation Prompts
        </button>
        <button
          onClick={onApprove}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-4 text-sm font-bold text-background transition-all hover:bg-accent-hover active:scale-[0.99]"
        >
          <Play size={18} />
          Generate Images
        </button>
      </div>
      <p className="text-center text-xs text-text-secondary/60">
        Use &quot;Skip to Animation Prompts&quot; if you plan to generate images with an external tool
      </p>
    </div>
  );
}
