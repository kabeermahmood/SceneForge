"use client";

import { useState } from "react";
import { Package, FileJson, BookOpen, Loader2, Film, Download, ChevronDown } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { calculateSceneTimestamps } from "@/lib/chunker";
import { TEXT_MODELS } from "@/lib/types";

export default function DownloadPanel() {
  const scenes = useProjectStore((s) => s.scenes);
  const script = useProjectStore((s) => s.script);
  const characterBible = useProjectStore((s) => s.character_bible);
  const duration = useProjectStore((s) => s.duration_seconds);
  const artStyle = useProjectStore((s) => s.art_style);
  const aspectRatio = useProjectStore((s) => s.aspect_ratio);
  const secondsPerScene = useProjectStore((s) => s.seconds_per_scene);
  const animGenerated = useProjectStore((s) => s.animation_prompts_generated);
  const animModel = useProjectStore((s) => s.animation_prompt_model);
  const setAnimModel = useProjectStore((s) => s.setAnimationPromptModel);
  const setAnimGenerated = useProjectStore((s) => s.setAnimationPromptsGenerated);
  const updateScene = useProjectStore((s) => s.updateScene);

  const [zipping, setZipping] = useState(false);
  const [generatingAnim, setGeneratingAnim] = useState(false);
  const [animError, setAnimError] = useState<string | null>(null);
  const [clipDuration, setClipDuration] = useState(8);

  const completedScenes = scenes.filter(
    (s) => s.status === "completed" || s.status === "approved"
  );

  const downloadZip = async () => {
    if (completedScenes.length === 0) return;
    setZipping(true);

    try {
      const JSZip = (await import("jszip")).default;
      const { saveAs } = await import("file-saver");
      const zip = new JSZip();

      completedScenes.forEach((scene) => {
        if (!scene.image_base64) return;
        const padded = String(scene.chunk_index).padStart(2, "0");
        const byteChars = atob(scene.image_base64);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteArray[i] = byteChars.charCodeAt(i);
        }
        const ext =
          scene.image_mime_type === "image/jpeg" ? "jpg" : "png";
        zip.file(`scene_${padded}.${ext}`, byteArray);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "sceneforge_images.zip");
    } catch (err) {
      console.error("ZIP generation failed:", err);
    } finally {
      setZipping(false);
    }
  };

  const downloadSceneMap = () => {
    const timestamps = calculateSceneTimestamps(scenes.length, duration);
    const data = {
      project: {
        total_scenes: scenes.length,
        duration_seconds: duration,
        art_style: artStyle,
        aspect_ratio: aspectRatio,
      },
      character_bible: characterBible,
      scenes: scenes.map((scene, i) => ({
        scene_number: scene.chunk_index,
        timestamp_start: timestamps[i]?.start,
        timestamp_end: timestamps[i]?.end,
        script_text: scene.script_text,
        scene_description: scene.scene_description,
        scene_emotion: scene.scene_emotion,
        characters_present: scene.characters_present,
        image_filename: `scene_${String(scene.chunk_index).padStart(2, "0")}.png`,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sceneforge_scene_map.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBible = () => {
    if (!characterBible) return;
    const blob = new Blob([JSON.stringify(characterBible, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sceneforge_character_bible.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateAnimationPrompts = async () => {
    if (!characterBible || !script) return;
    const apiKey = localStorage.getItem("gemini_api_key") || "";
    if (!apiKey) return;

    setGeneratingAnim(true);
    setAnimError(null);

    try {
      const scenePayload = scenes.map((s) => ({
        chunk_index: s.chunk_index,
        script_text: s.script_text,
        scene_description: s.scene_description,
        scene_emotion: s.scene_emotion,
        characters_present: s.characters_present,
      }));

      const res = await fetch("/api/generate-animation-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          characterBible,
          scenes: scenePayload,
          apiKey,
          model: animModel,
          secondsPerScene: clipDuration,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setAnimError(err.message || "Failed to generate animation prompts");
        return;
      }

      const data = await res.json();
      const prompts = data.prompts as {
        chunk_index: number;
        animation_prompt: string;
        camera_movement: string;
        suggested_transition: string;
      }[];

      for (let i = 0; i < scenes.length; i++) {
        const match = prompts.find((p) => p.chunk_index === scenes[i].chunk_index);
        if (match) {
          updateScene(i, {
            animation_prompt: match.animation_prompt,
            camera_movement: match.camera_movement,
            suggested_transition: match.suggested_transition,
          });
        }
      }

      setAnimGenerated(true);
    } catch (err: unknown) {
      setAnimError(err instanceof Error ? err.message : "Network error");
    } finally {
      setGeneratingAnim(false);
    }
  };

  const downloadAnimationPrompts = () => {
    const timestamps = calculateSceneTimestamps(scenes.length, duration);
    const modelLabel = TEXT_MODELS.find((m) => m.id === animModel)?.label || animModel;

    let txt = `SCENEFORGE — ANIMATION PROMPTS\n`;
    txt += `Generated with: ${modelLabel}\n`;
    txt += `Total scenes: ${scenes.length} | Duration: ${duration}s | ${clipDuration}s per clip\n`;
    txt += `========================================\n\n`;

    scenes.forEach((scene, i) => {
      const ts = timestamps[i];
      const padded = String(scene.chunk_index).padStart(2, "0");
      const hasImage = scene.image_base64 && (scene.status === "completed" || scene.status === "approved");

      txt += `SCENE ${scene.chunk_index} | ${ts?.start || "?"} — ${ts?.end || "?"} | scene_${padded}.png\n`;
      txt += `────────────────────────────────────────\n`;
      txt += `Script: "${scene.script_text}"\n`;
      txt += `Emotion: ${scene.scene_emotion}\n`;
      if (!hasImage) {
        txt += `⚠ IMAGE NOT GENERATED\n`;
      }
      txt += `\nANIMATION PROMPT (paste into video generator\nalong with the scene image):\n\n`;
      txt += `${scene.animation_prompt || "[No animation prompt generated]"}\n\n`;
      txt += `Camera: ${scene.camera_movement || "N/A"}\n`;
      txt += `Transition: ${scene.suggested_transition || "Cut"}\n`;
      txt += `========================================\n\n`;
    });

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sceneforge_animation_prompts.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedTextModel = TEXT_MODELS.find((m) => m.id === animModel);

  return (
    <div className="space-y-3">
      {/* Row 1: Image downloads */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={downloadZip}
          disabled={completedScenes.length === 0 || zipping}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {zipping ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Package size={14} />
          )}
          Download {completedScenes.length}/{scenes.length} Images (ZIP)
        </button>

        <button
          onClick={downloadSceneMap}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          <FileJson size={14} />
          Scene Map
        </button>

        <button
          onClick={downloadBible}
          disabled={!characterBible}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <BookOpen size={14} />
          Character Bible
        </button>
      </div>

      {/* Row 2: Animation prompts */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2.5">
        <Film size={14} className="shrink-0 text-accent" />

        {/* Model selector */}
        <div className="relative">
          <select
            value={animModel}
            onChange={(e) => {
              setAnimModel(e.target.value);
              if (animGenerated) setAnimGenerated(false);
            }}
            className="appearance-none rounded-md border border-border bg-surface py-1.5 pl-2.5 pr-7 text-[11px] font-medium text-text-primary transition-colors hover:border-accent focus:border-accent focus:outline-none"
          >
            {TEXT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary" />
        </div>

        {/* Clip duration selector */}
        <div className="relative">
          <select
            value={clipDuration}
            onChange={(e) => {
              setClipDuration(Number(e.target.value));
              if (animGenerated) setAnimGenerated(false);
            }}
            className="appearance-none rounded-md border border-border bg-surface py-1.5 pl-2.5 pr-7 text-[11px] font-medium text-text-primary transition-colors hover:border-accent focus:border-accent focus:outline-none"
          >
            <option value={6}>6s clips</option>
            <option value={8}>8s clips</option>
            <option value={10}>10s clips</option>
          </select>
          <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary" />
        </div>

        {selectedTextModel && (
          <span className="text-[10px] text-text-secondary/60">
            {selectedTextModel.costPer1MTokens > 0
              ? `~$${selectedTextModel.costPer1MTokens}/1M tokens`
              : "Free"}
          </span>
        )}

        {!animGenerated ? (
          <button
            onClick={generateAnimationPrompts}
            disabled={generatingAnim || !characterBible}
            className="flex items-center gap-1.5 rounded-lg bg-accent/90 px-3 py-1.5 text-[11px] font-bold text-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generatingAnim ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Film size={12} />
            )}
            {generatingAnim ? "Generating..." : "Generate Animation Prompts"}
          </button>
        ) : (
          <button
            onClick={downloadAnimationPrompts}
            className="flex items-center gap-1.5 rounded-lg bg-success/90 px-3 py-1.5 text-[11px] font-bold text-background transition-colors hover:bg-success"
          >
            <Download size={12} />
            Download Animation Prompts (.txt)
          </button>
        )}

        {animError && (
          <span className="text-[10px] text-error">{animError}</span>
        )}
      </div>
    </div>
  );
}
