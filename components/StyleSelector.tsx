"use client";

import { useProjectStore } from "@/store/useProjectStore";
import { ART_STYLES } from "@/lib/types";

export default function StyleSelector() {
  const artStyle = useProjectStore((s) => s.art_style);
  const setArtStyle = useProjectStore((s) => s.setArtStyle);
  const artStyleCustom = useProjectStore((s) => s.art_style_custom);
  const setArtStyleCustom = useProjectStore((s) => s.setArtStyleCustom);

  return (
    <div className="w-full">
      <label className="mb-3 block font-heading text-sm font-medium text-text-secondary">
        Art Style
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ART_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => setArtStyle(style.id)}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              artStyle === style.id
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:border-text-secondary/30"
            }`}
          >
            <span className="block font-heading text-sm font-semibold text-text-primary">
              {style.label}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
              {style.description}
            </span>
          </button>
        ))}
      </div>

      {artStyle === "custom" && (
        <textarea
          value={artStyleCustom}
          onChange={(e) => setArtStyleCustom(e.target.value)}
          placeholder="Describe your desired art style in detail... (e.g., 'Retro pixel art with a synthwave color palette, 16-bit style characters')"
          className="mt-3 w-full resize-y rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
          style={{ minHeight: "100px" }}
        />
      )}
    </div>
  );
}
