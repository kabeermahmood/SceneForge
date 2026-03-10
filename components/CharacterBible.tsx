"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { User, PawPrint, Box } from "lucide-react";

const typeIcons = {
  human: User,
  animal: PawPrint,
  object: Box,
};

export default function CharacterBible() {
  const bible = useProjectStore((s) => s.character_bible);

  if (!bible) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <h3 className="font-heading text-lg font-bold text-text-primary">
        Character Bible
      </h3>

      {/* Characters */}
      <div className="grid gap-4 sm:grid-cols-2">
        {bible.characters.map((char, i) => {
          const Icon = typeIcons[char.type] || User;
          return (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
                  <Icon size={16} className="text-accent" />
                </div>
                <div>
                  <span className="font-heading text-sm font-bold text-text-primary">
                    {char.name}
                  </span>
                  <span className="ml-2 rounded-full bg-border px-2 py-0.5 text-[10px] font-medium uppercase text-text-secondary">
                    {char.type}
                    {char.species ? ` · ${char.species}` : ""}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-xs leading-relaxed text-text-secondary">
                <p>
                  <span className="font-medium text-text-primary">
                    Appearance:{" "}
                  </span>
                  {char.appearance}
                </p>
                <p>
                  <span className="font-medium text-text-primary">
                    Visual Cues:{" "}
                  </span>
                  {char.personality_visual_cues}
                </p>
                <p>
                  <span className="font-medium text-text-primary">
                    Default Pose:{" "}
                  </span>
                  {char.default_pose}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Setting */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h4 className="mb-2 font-heading text-sm font-bold text-text-primary">
          Primary Setting
        </h4>
        <p className="text-xs leading-relaxed text-text-secondary">
          {bible.primary_setting}
        </p>
      </div>

      {/* Color Palette */}
      <div>
        <h4 className="mb-3 font-heading text-sm font-bold text-text-primary">
          Color Palette
        </h4>
        <div className="flex gap-3">
          {bible.color_palette.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className="h-10 w-10 rounded-lg border border-border"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] font-mono text-text-secondary">
                {color}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h4 className="mb-2 font-heading text-sm font-bold text-text-primary">
          Overall Mood
        </h4>
        <p className="text-xs italic text-text-secondary">
          {bible.overall_mood}
        </p>
      </div>
    </div>
  );
}
