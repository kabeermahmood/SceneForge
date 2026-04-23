export const ELEVENLABS_KEY_STORAGE = "elevenlabs_api_key";
export const VOICE_SETTINGS_STORAGE = "voicestudio_settings";
export const SELECTED_VOICE_STORAGE = "voicestudio_selected_voice";
export const SELECTED_MODEL_STORAGE = "voicestudio_selected_model";
export const CONCURRENCY_STORAGE = "voicestudio_concurrency";

export const MAX_CHARACTERS = 100000;
export const WARN_CHARACTERS = 50000;
export const SAFE_CHUNK_CHARS = 4500;

export const DEFAULT_CONCURRENCY = 2;
export const FALLBACK_MAX_CONCURRENCY = 2;

// ElevenLabs concurrent-request caps per plan (early 2026).
// One slot is reserved for ad-hoc calls (voice preview, credits refresh, etc.).
export const PLAN_CONCURRENCY: Record<string, number> = {
  free: 2,
  starter: 3,
  creator: 5,
  pro: 10,
  scale: 15,
  business: 15,
  enterprise: 15,
};

export function getMaxConcurrency(tier?: string | null): number {
  if (!tier) return FALLBACK_MAX_CONCURRENCY;
  const key = tier.toLowerCase().trim();
  // Reserve 1 slot of headroom; never go below 1.
  const planCap = PLAN_CONCURRENCY[key] ?? FALLBACK_MAX_CONCURRENCY;
  return Math.max(1, planCap - 1);
}

export interface VoiceLabels {
  accent?: string;
  description?: string;
  age?: string;
  gender?: string;
  use_case?: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  preview_url?: string | null;
  labels?: VoiceLabels;
  description?: string | null;
}

export interface VoicesResponse {
  voices: Voice[];
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
};

export interface ElevenLabsModel {
  id: string;
  label: string;
  description: string;
}

export const ELEVENLABS_MODELS: ElevenLabsModel[] = [
  {
    id: "eleven_multilingual_v2",
    label: "Multilingual v2",
    description: "Highest quality, 29 languages, slower",
  },
  {
    id: "eleven_turbo_v2_5",
    label: "Turbo v2.5",
    description: "Low latency, 32 languages, great quality",
  },
  {
    id: "eleven_flash_v2_5",
    label: "Flash v2.5",
    description: "Ultra-low latency, 32 languages",
  },
  {
    id: "eleven_v3",
    label: "Eleven v3 (alpha)",
    description: "Most expressive, supports audio tags",
  },
];

export const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

export interface Subscription {
  tier: string;
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
  voice_limit: number;
  status: string;
}

export function formatCredits(used: number, limit: number): string {
  const remaining = Math.max(0, limit - used);
  return remaining.toLocaleString();
}
