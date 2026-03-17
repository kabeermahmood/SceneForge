"use client";

import { useState } from "react";
import { LayoutList, Upload, AlertTriangle, Check, Trash2 } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import type { Scene } from "@/lib/types";

interface RawScene {
  script_text: string;
  scene_description: string;
  scene_emotion?: string;
  characters_present?: string[];
}

function validateScenes(data: unknown): data is RawScene[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.every(
    (s) =>
      s &&
      typeof s === "object" &&
      typeof (s as Record<string, unknown>).script_text === "string" &&
      typeof (s as Record<string, unknown>).scene_description === "string"
  );
}

function rawToScene(raw: RawScene, index: number): Scene {
  return {
    chunk_index: index + 1,
    script_text: raw.script_text,
    scene_description: raw.scene_description,
    scene_emotion: raw.scene_emotion || "neutral",
    characters_present: raw.characters_present || [],
    image_base64: null,
    image_mime_type: null,
    status: "pending",
    generation_prompt: "",
    error_message: null,
    animation_prompt: null,
    camera_movement: null,
    suggested_transition: null,
  };
}

export default function CustomScenesImport() {
  const scenesSource = useProjectStore((s) => s.scenes_source);
  const setScenesSource = useProjectStore((s) => s.setScenesSource);
  const scenes = useProjectStore((s) => s.scenes);
  const setScenes = useProjectStore((s) => s.setScenes);

  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (scenesSource !== "custom") return null;

  const handleParse = () => {
    setError(null);
    try {
      const parsed = JSON.parse(jsonText);
      const arr = Array.isArray(parsed) ? parsed : parsed.scenes;
      if (!validateScenes(arr)) {
        setError(
          'Invalid format. Expected an array of objects with at least "script_text" and "scene_description".'
        );
        return;
      }
      setScenes(arr.map(rawToScene));
    } catch {
      setError("Invalid JSON — please check your syntax");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;

      if (file.name.endsWith(".csv")) {
        parseCsv(text);
      } else {
        setJsonText(text);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseCsv = (text: string) => {
    setError(null);
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      setError("CSV must have a header row and at least one data row");
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const scriptIdx = headers.indexOf("script_text");
    const descIdx = headers.indexOf("scene_description");
    if (scriptIdx === -1 || descIdx === -1) {
      setError('CSV must have columns: "script_text", "scene_description"');
      return;
    }
    const emotionIdx = headers.indexOf("scene_emotion");
    const charsIdx = headers.indexOf("characters_present");

    const parsed: RawScene[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (!cols[scriptIdx]) continue;
      parsed.push({
        script_text: cols[scriptIdx],
        scene_description: cols[descIdx] || "",
        scene_emotion: emotionIdx !== -1 ? cols[emotionIdx] : undefined,
        characters_present: charsIdx !== -1 ? cols[charsIdx]?.split(";").map((s) => s.trim()) : undefined,
      });
    }
    if (parsed.length === 0) {
      setError("No valid scene rows found in CSV");
      return;
    }
    setScenes(parsed.map(rawToScene));
  };

  return (
    <div className="space-y-4 rounded-xl border-2 border-accent/30 bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-text-primary">
          <LayoutList size={16} className="text-accent" />
          Custom Scene Breakdown
        </h3>
        <button
          onClick={() => {
            setScenesSource("ai");
            setScenes([]);
          }}
          className="text-xs text-text-secondary hover:text-accent"
        >
          Switch to AI Chunking
        </button>
      </div>

      <p className="text-xs text-text-secondary">
        Import your own scene breakdown via JSON or CSV. Each scene needs at least{" "}
        <code className="rounded bg-background px-1 py-0.5 font-mono text-accent">script_text</code> and{" "}
        <code className="rounded bg-background px-1 py-0.5 font-mono text-accent">scene_description</code>.
      </p>

      <div className="flex gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent">
          <Upload size={14} />
          Upload JSON / CSV
          <input type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
        </label>
        {scenes.length > 0 && (
          <button
            onClick={() => setScenes([])}
            className="flex items-center gap-1 rounded-lg border border-error/30 px-3 py-2 text-xs text-error/60 transition-colors hover:bg-error/5 hover:text-error"
          >
            <Trash2 size={12} /> Clear Scenes
          </button>
        )}
      </div>

      <textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          setError(null);
        }}
        rows={8}
        placeholder='[{"script_text":"...","scene_description":"...","scene_emotion":"happy","characters_present":["The Dog"]}]'
        className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 font-mono text-xs text-text-primary placeholder:text-text-secondary/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
      />

      {error && (
        <div className="flex items-center gap-2 text-xs text-error">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      <button
        onClick={handleParse}
        disabled={!jsonText.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-xs font-bold text-background transition-all hover:bg-accent-hover disabled:opacity-40"
      >
        <Check size={14} /> Parse & Load Scenes
      </button>

      {scenes.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
          <Check size={14} />
          {scenes.length} scene{scenes.length !== 1 ? "s" : ""} loaded — ready for image generation
        </div>
      )}
    </div>
  );
}
