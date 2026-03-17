"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2, AlertTriangle, Check, Upload } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import type { CharacterBible, Character } from "@/lib/types";

const EMPTY_CHARACTER: Character = {
  name: "",
  type: "human",
  species: null,
  appearance: "",
  personality_visual_cues: "",
  default_pose: "",
  visual_fingerprint: "",
};

function validateBible(bible: unknown): bible is CharacterBible {
  if (!bible || typeof bible !== "object") return false;
  const b = bible as Record<string, unknown>;
  if (!Array.isArray(b.characters) || b.characters.length === 0) return false;
  if (typeof b.primary_setting !== "string") return false;
  if (!Array.isArray(b.color_palette)) return false;
  if (typeof b.overall_mood !== "string") return false;
  for (const c of b.characters) {
    if (!c || typeof c !== "object") return false;
    const ch = c as Record<string, unknown>;
    if (typeof ch.name !== "string" || !ch.name) return false;
    if (!["human", "animal", "object"].includes(ch.type as string)) return false;
    if (typeof ch.appearance !== "string" || !ch.appearance) return false;
  }
  return true;
}

export default function CustomBibleEditor() {
  const bibleSource = useProjectStore((s) => s.bible_source);
  const setBibleSource = useProjectStore((s) => s.setBibleSource);
  const characterBible = useProjectStore((s) => s.character_bible);
  const setCharacterBible = useProjectStore((s) => s.setCharacterBible);

  const [mode, setMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>(
    characterBible?.characters ?? [{ ...EMPTY_CHARACTER }]
  );
  const [setting, setSetting] = useState(characterBible?.primary_setting ?? "");
  const [palette, setPalette] = useState(
    characterBible?.color_palette?.join(", ") ?? "#F5E6D3, #8B6F47, #4A90D9, #E8B4B8, #D4C5A9, #FF6B6B"
  );
  const [mood, setMood] = useState(characterBible?.overall_mood ?? "");

  if (bibleSource !== "custom") return null;

  const addCharacter = () => setCharacters([...characters, { ...EMPTY_CHARACTER }]);
  const removeCharacter = (i: number) => setCharacters(characters.filter((_, idx) => idx !== i));
  const updateChar = (i: number, field: keyof Character, value: string | null) =>
    setCharacters(characters.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const saveFromForm = () => {
    const bible: CharacterBible = {
      characters,
      primary_setting: setting,
      color_palette: palette.split(",").map((s) => s.trim()).filter(Boolean),
      overall_mood: mood,
    };
    if (!validateBible(bible)) return;
    setCharacterBible(bible);
  };

  const saveFromJson = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonText);
      if (!validateBible(parsed)) {
        setJsonError("Invalid structure. Needs: characters[], primary_setting, color_palette[], overall_mood");
        return;
      }
      setCharacterBible(parsed);
      setCharacters(parsed.characters);
      setSetting(parsed.primary_setting);
      setPalette(parsed.color_palette.join(", "));
      setMood(parsed.overall_mood);
    } catch {
      setJsonError("Invalid JSON — please check your syntax");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setJsonText(text);
      setMode("json");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const formValid =
    characters.length > 0 &&
    characters.every((c) => c.name && c.appearance) &&
    setting.length > 0 &&
    mood.length > 0;

  return (
    <div className="space-y-4 rounded-xl border-2 border-accent/30 bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-text-primary">
          <BookOpen size={16} className="text-accent" />
          Custom Character Bible
        </h3>
        <button
          onClick={() => setBibleSource("ai")}
          className="text-xs text-text-secondary hover:text-accent"
        >
          Switch to AI-Generated
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg bg-background p-1">
        <button
          onClick={() => setMode("form")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            mode === "form" ? "bg-accent text-background" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Form Editor
        </button>
        <button
          onClick={() => setMode("json")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            mode === "json" ? "bg-accent text-background" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          JSON Paste
        </button>
      </div>

      {mode === "form" ? (
        <div className="space-y-4">
          {characters.map((char, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Character {i + 1}</span>
                {characters.length > 1 && (
                  <button onClick={() => removeCharacter(i)} className="text-error/60 hover:text-error">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={char.name}
                  onChange={(e) => updateChar(i, "name", e.target.value)}
                  placeholder="Name (e.g. The Dog)"
                  className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
                />
                <select
                  value={char.type}
                  onChange={(e) => updateChar(i, "type", e.target.value)}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="human">Human</option>
                  <option value="animal">Animal</option>
                  <option value="object">Object</option>
                </select>
              </div>
              {char.type === "animal" && (
                <input
                  value={char.species ?? ""}
                  onChange={(e) => updateChar(i, "species", e.target.value || null)}
                  placeholder="Species (e.g. golden retriever)"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
                />
              )}
              <textarea
                value={char.appearance}
                onChange={(e) => updateChar(i, "appearance", e.target.value)}
                placeholder="Detailed appearance (50-100 words: fur color, clothing, eye color, distinguishing features...)"
                rows={3}
                className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
              />
              <input
                value={char.visual_fingerprint}
                onChange={(e) => updateChar(i, "visual_fingerprint", e.target.value)}
                placeholder="Visual fingerprint (3-5 key features, comma-separated)"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
              />
              <input
                value={char.default_pose}
                onChange={(e) => updateChar(i, "default_pose", e.target.value)}
                placeholder="Default pose"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
              />
              <input
                value={char.personality_visual_cues}
                onChange={(e) => updateChar(i, "personality_visual_cues", e.target.value)}
                placeholder="Personality visual cues"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
              />
            </div>
          ))}

          <button
            onClick={addCharacter}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <Plus size={14} /> Add Character
          </button>

          <div className="space-y-2">
            <textarea
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="Primary setting (30-50 words: describe the main environment/location)"
              rows={2}
              className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
            />
            <input
              value={palette}
              onChange={(e) => setPalette(e.target.value)}
              placeholder="Color palette (6 hex codes, comma-separated)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
            />
            <input
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Overall mood (e.g. warm, nostalgic, playful)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
            />
          </div>

          <button
            onClick={saveFromForm}
            disabled={!formValid}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-xs font-bold text-background transition-all hover:bg-accent-hover disabled:opacity-40"
          >
            <Check size={14} />
            Save Character Bible
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent">
              <Upload size={14} />
              Upload JSON File
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setJsonError(null); }}
            rows={12}
            placeholder='{"characters":[{"name":"The Dog","type":"animal","species":"golden retriever","appearance":"...","personality_visual_cues":"...","default_pose":"...","visual_fingerprint":"..."}],"primary_setting":"...","color_palette":["#hex1","#hex2","#hex3","#hex4","#hex5","#hex6"],"overall_mood":"..."}'
            className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 font-mono text-xs text-text-primary placeholder:text-text-secondary/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          {jsonError && (
            <div className="flex items-center gap-2 text-xs text-error">
              <AlertTriangle size={12} /> {jsonError}
            </div>
          )}
          <button
            onClick={saveFromJson}
            disabled={!jsonText.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-xs font-bold text-background transition-all hover:bg-accent-hover disabled:opacity-40"
          >
            <Check size={14} />
            Parse & Save
          </button>
        </div>
      )}

      {characterBible && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
          <Check size={14} />
          Character Bible loaded — {characterBible.characters.length} character{characterBible.characters.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
