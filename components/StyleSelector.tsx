"use client";

import { Save, Trash2 } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { ART_STYLES } from "@/lib/types";

export default function StyleSelector() {
  const artStyle = useProjectStore((s) => s.art_style);
  const setArtStyle = useProjectStore((s) => s.setArtStyle);
  const artStyleCustom = useProjectStore((s) => s.art_style_custom);
  const setArtStyleCustom = useProjectStore((s) => s.setArtStyleCustom);
  const savedCustomStyles = useProjectStore((s) => s.saved_custom_styles);
  const setSavedCustomStyles = useProjectStore((s) => s.setSavedCustomStyles);

  const allStyles = [...ART_STYLES, ...savedCustomStyles];

  const saveCurrentCustom = () => {
    if (!artStyleCustom.trim()) return;
    const id = `saved_${Date.now()}`;
    const label = artStyleCustom.slice(0, 30).trim() + (artStyleCustom.length > 30 ? "..." : "");
    const newStyle = {
      id,
      label,
      description: "Saved custom style",
      prompt_text: artStyleCustom,
    };
    setSavedCustomStyles([...savedCustomStyles, newStyle]);
    setArtStyle(id);
  };

  const deleteSavedStyle = (id: string) => {
    setSavedCustomStyles(savedCustomStyles.filter((s) => s.id !== id));
    if (artStyle === id) setArtStyle("cute_minimal");
  };

  return (
    <div className="w-full">
      <label className="mb-3 block font-heading text-sm font-medium text-text-secondary">
        Art Style
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {allStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => setArtStyle(style.id)}
            className={`group relative rounded-xl border-2 p-4 text-left transition-all ${
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
            {style.id.startsWith("saved_") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSavedStyle(style.id);
                }}
                className="absolute right-2 top-2 hidden rounded p-1 text-error/40 transition-colors hover:bg-error/10 hover:text-error group-hover:block"
              >
                <Trash2 size={12} />
              </button>
            )}
          </button>
        ))}
      </div>

      {artStyle === "custom" && (
        <div className="mt-3 space-y-2">
          <textarea
            value={artStyleCustom}
            onChange={(e) => setArtStyleCustom(e.target.value)}
            placeholder="Describe your desired art style in detail... (e.g., 'Retro pixel art with a synthwave color palette, 16-bit style characters')"
            className="w-full resize-y rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
            style={{ minHeight: "100px" }}
          />
          {artStyleCustom.trim() && (
            <button
              onClick={saveCurrentCustom}
              className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <Save size={12} /> Save This Style
            </button>
          )}
        </div>
      )}
    </div>
  );
}
