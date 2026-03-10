"use client";

import { useState } from "react";
import { Package, FileJson, BookOpen, Loader2 } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { calculateSceneTimestamps } from "@/lib/chunker";

export default function DownloadPanel() {
  const scenes = useProjectStore((s) => s.scenes);
  const characterBible = useProjectStore((s) => s.character_bible);
  const duration = useProjectStore((s) => s.duration_seconds);
  const artStyle = useProjectStore((s) => s.art_style);
  const aspectRatio = useProjectStore((s) => s.aspect_ratio);
  const [zipping, setZipping] = useState(false);

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

  return (
    <div className="flex gap-2">
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
  );
}
