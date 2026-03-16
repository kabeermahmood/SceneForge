export interface Character {
  name: string;
  type: "human" | "animal" | "object";
  species: string | null;
  appearance: string;
  personality_visual_cues: string;
  default_pose: string;
  visual_fingerprint: string;
}

export interface CharacterBible {
  characters: Character[];
  primary_setting: string;
  color_palette: string[];
  overall_mood: string;
}

export interface Scene {
  chunk_index: number;
  script_text: string;
  scene_description: string;
  scene_emotion: string;
  characters_present: string[];
  image_base64: string | null;
  image_mime_type: string | null;
  status: "pending" | "generating" | "completed" | "failed" | "approved";
  generation_prompt: string;
  error_message: string | null;
  animation_prompt: string | null;
  camera_movement: string | null;
  suggested_transition: string | null;
}

export type ProcessingMode = "batch" | "standard";

export interface ImageModelOption {
  id: string;
  label: string;
  description: string;
  supportsBatch: boolean;
  /** Standard API cost per image in USD (1024px) */
  costPerImage: number;
}

export const IMAGE_MODELS: ImageModelOption[] = [
  {
    id: "gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image",
    description: "Best quality, character consistency, production-ready",
    supportsBatch: true,
    costPerImage: 0.039,
  },
  {
    id: "gemini-3.1-flash-image-preview",
    label: "Gemini 3.1 Flash Image (Preview)",
    description: "Newest preview model, experimental",
    supportsBatch: true,
    costPerImage: 0.067,
  },
  {
    id: "gemini-3-pro-image-preview",
    label: "Gemini 3 Pro Image (Preview)",
    description: "Pro-tier quality, higher cost",
    supportsBatch: true,
    costPerImage: 0.134,
  },
  {
    id: "gemini-2.0-flash-exp-image-generation",
    label: "Gemini 2.0 Flash Exp (Free)",
    description: "Lower quality, free tier — great for drafts & testing",
    supportsBatch: false,
    costPerImage: 0,
  },
];

export interface TextModelOption {
  id: string;
  label: string;
  description: string;
  costPer1MTokens: number;
}

export const TEXT_MODELS: TextModelOption[] = [
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash (Free)",
    description: "Free tier, good for testing",
    costPer1MTokens: 0,
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Fast and cheap, good quality",
    costPer1MTokens: 0.15,
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Best quality prompts, higher cost",
    costPer1MTokens: 1.25,
  },
];

export type VideoTool = "grok" | "kling" | "runway";

export interface VideoToolOption {
  id: VideoTool;
  label: string;
  description: string;
}

export const VIDEO_TOOLS: VideoToolOption[] = [
  { id: "grok", label: "Grok (xAI)", description: "Best for 2D animated scenes, strong consistency" },
  { id: "kling", label: "Kling AI", description: "Smooth motion, good for cinematic clips" },
  { id: "runway", label: "Runway Gen-3", description: "Versatile, good lighting and physics" },
];

export interface ProjectState {
  script: string;
  duration_seconds: number;
  art_style: string;
  art_style_custom: string;
  aspect_ratio: "16:9" | "9:16" | "1:1";
  seconds_per_scene: number;
  processing_mode: ProcessingMode;
  standard_concurrency: 1 | 3;
  image_model: string;
  text_model: string;
  video_tool: VideoTool;
  character_bible: CharacterBible | null;
  scenes: Scene[];
  pipeline_stage:
    | "idle"
    | "generating_bible"
    | "chunking"
    | "generating_images"
    | "hero_review"
    | "complete"
    | "error";
  current_scene_index: number;
  error_message: string | null;
  animation_prompts_generated: boolean;
  animation_prompt_model: string;
}

export type ArtStyleOption = {
  id: string;
  label: string;
  description: string;
  prompt_text: string;
};

export const ART_STYLES: ArtStyleOption[] = [
  {
    id: "cute_minimal",
    label: "Cute Minimal",
    description:
      "Clean lines, soft warm colors, minimal backgrounds — like Mindful Paws",
    prompt_text:
      "Cute minimalist 2D illustration with clean outlines, soft warm color palette, simple flat backgrounds, adorable cartoon-style characters with expressive eyes, professional children's animation quality, consistent line weight throughout",
  },
  {
    id: "flat_vector",
    label: "Flat Vector",
    description: "Modern flat design, bold colors, geometric shapes",
    prompt_text:
      "Modern flat vector illustration with bold solid colors, clean geometric shapes, no gradients, minimal shadows, professional graphic design quality, consistent proportions throughout",
  },
  {
    id: "watercolor_storybook",
    label: "Watercolor Storybook",
    description: "Soft edges, watercolor textures, children's book feel",
    prompt_text:
      "Soft watercolor illustration with gentle washes of color, visible paper texture, delicate line work, children's storybook quality, dreamy atmospheric backgrounds, warm and inviting mood",
  },
  {
    id: "anime",
    label: "Anime / Manga",
    description: "Anime-influenced, expressive eyes, dynamic poses",
    prompt_text:
      "Anime-style 2D illustration with large expressive eyes, clean cel-shading, vibrant colors, dynamic composition, Japanese animation quality, detailed hair and clothing",
  },
  {
    id: "realistic",
    label: "Realistic Illustration",
    description: "Semi-realistic digital painting style",
    prompt_text:
      "Semi-realistic digital illustration with detailed rendering, natural lighting, rich textures, professional concept art quality, cinematic composition, photorealistic proportions",
  },
  {
    id: "custom",
    label: "Custom Style",
    description: "Describe your own art style",
    prompt_text: "",
  },
];
