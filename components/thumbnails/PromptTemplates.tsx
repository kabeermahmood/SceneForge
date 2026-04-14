"use client";

import { useState } from "react";
import { Zap, ChevronDown } from "lucide-react";

interface Template {
  label: string;
  tag: string;
  prompt: string;
  negativePrompt: string;
}

const TEMPLATES: Template[] = [
  {
    label: "YouTube Gaming",
    tag: "Gaming",
    prompt:
      "A dramatic gaming thumbnail with bold neon lighting, an intense character expression in the foreground, glowing particle effects, dark cinematic background with gameplay elements, high contrast vibrant colors, professional esports feel",
    negativePrompt:
      "text, watermark, blurry, low quality, borders, frames, UI elements",
  },
  {
    label: "Cinematic Documentary",
    tag: "Documentary",
    prompt:
      "A cinematic wide-angle establishing shot with dramatic golden hour lighting, rich atmospheric depth, film grain texture, documentary-style composition with rule of thirds, deep shadows and warm highlights, professional color grading",
    negativePrompt:
      "text, watermark, cartoon, anime, illustration, borders",
  },
  {
    label: "Minimalist Product",
    tag: "Product",
    prompt:
      "A clean minimalist product photograph on a seamless white background, soft studio lighting with gentle shadows, sharp focus on the subject, elegant negative space, premium commercial photography feel, subtle reflections",
    negativePrompt:
      "cluttered background, text, watermark, busy patterns, harsh shadows",
  },
  {
    label: "Bold Text Thumbnail",
    tag: "Text-Heavy",
    prompt:
      "A bold eye-catching YouTube thumbnail design with a vibrant gradient background, dramatic lighting from below, a shocked or excited facial expression, shallow depth of field on the background, high saturation pop colors, space reserved for large bold text overlay",
    negativePrompt:
      "actual text, watermark, blurry, dark, muted colors",
  },
  {
    label: "Historical / Vintage",
    tag: "History",
    prompt:
      "A richly detailed historical scene with aged parchment color tones, dramatic chiaroscuro lighting reminiscent of classical oil paintings, period-accurate costumes and architecture, atmospheric fog and dust particles, cinematic depth",
    negativePrompt:
      "modern elements, text, watermark, cartoon style, bright neon colors",
  },
  {
    label: "Tech / Futuristic",
    tag: "Tech",
    prompt:
      "A sleek futuristic technology scene with holographic UI elements, cool blue and cyan neon accents on dark backgrounds, reflective metallic surfaces, clean geometric shapes, sci-fi atmosphere with volumetric lighting, professional tech aesthetic",
    negativePrompt:
      "organic textures, text, watermark, warm colors, vintage style",
  },
];

interface Props {
  onApply: (prompt: string, negativePrompt: string) => void;
  disabled?: boolean;
}

export default function PromptTemplates({ onApply, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-accent transition"
      >
        <Zap size={13} />
        Quick Templates
        <ChevronDown
          size={12}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-fade-in">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => onApply(t.prompt, t.negativePrompt)}
              disabled={disabled}
              className="group rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-all hover:border-accent/50 hover:bg-accent/5 disabled:opacity-40"
            >
              <span className="block text-xs font-semibold text-text-primary group-hover:text-accent transition">
                {t.label}
              </span>
              <span className="mt-0.5 block text-[10px] text-text-secondary line-clamp-2">
                {t.prompt.slice(0, 80)}…
              </span>
              <span className="mt-1 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-semibold text-accent">
                {t.tag}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
