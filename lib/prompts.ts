import type { CharacterBible, Scene } from "./types";

export function buildCharacterBiblePrompt(script: string): string {
  return `You are an expert animation character designer and story analyst.

Analyze the following script for an animated YouTube video. Identify ALL characters mentioned or implied in the script (humans, animals, objects that act as characters).

For each character, generate a detailed Character Bible entry with:
- name: A name or label for the character (e.g., "The Dog", "The Owner", "The Cat")
- type: "human" | "animal" | "object"
- species: (if animal — e.g., "golden retriever", "tabby cat". null for humans/objects)
- appearance: Extremely detailed physical description (fur color, eye color, hair style, clothing, body type, distinguishing features, accessories). Be VERY specific — this description will be used to regenerate this exact character across 15+ images and it must be precise enough to maintain visual consistency. Include: exact colors (e.g., "warm chestnut brown fur" not just "brown"), specific clothing items with colors, body proportions, and any unique identifying features. Use 50-100 words.
- personality_visual_cues: How their personality shows visually (e.g., "always has a slight head tilt showing curiosity", "ears slightly back showing nervousness")
- default_pose: Their most common pose or position in the video

Also determine:
- primary_setting: The main location/environment of the video. Be very specific with colors and objects (e.g., "a cozy modern apartment with cream-colored walls, a warm brown leather couch, a small potted monstera plant in a terracotta pot, light oak hardwood floors, a large window with sheer white curtains letting in soft natural light"). 30-50 words.
- color_palette: Exactly 6 hex color codes that define the visual palette for the entire video. These should feel warm, cohesive, and match the tone of the script. Include: 1 background color, 2 character colors, 1 accent color, 1 neutral, 1 highlight.
- overall_mood: One sentence describing the emotional tone of the video.

Return your response as a valid JSON object with this EXACT structure:
{
  "characters": [
    {
      "name": "string",
      "type": "human | animal | object",
      "species": "string or null",
      "appearance": "string (50-100 words, extremely detailed)",
      "personality_visual_cues": "string",
      "default_pose": "string"
    }
  ],
  "primary_setting": "string (30-50 words, very specific)",
  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5", "#hex6"],
  "overall_mood": "string"
}

Return ONLY the raw JSON. No markdown formatting, no backticks, no explanation text before or after.

Here is the script to analyze:
---
${script}
---`;
}

export function buildChunkingPrompt(
  script: string,
  chunksCount: number
): string {
  return `You are a video scene planner for animated YouTube videos.

Split the following script into exactly ${chunksCount} scene chunks. Each chunk should:
- Represent one distinct visual moment or idea that can be illustrated as a single image
- Be roughly equal in word count (but prioritize natural breakpoints over exact equality)
- End at a natural pause point (end of sentence or end of a thought)
- Cover the ENTIRE script — no text should be left out

For each chunk, write:
- scene_description: A detailed visual description of what should be illustrated for this scene (50-80 words). Describe: the setting/location, which characters are present, their positions and actions, their facial expressions and body language, the camera angle (wide shot, medium shot, close-up), and the lighting/mood. Do NOT include any text, dialogue, speech bubbles, or words in the scene description — describe ONLY visual elements.
- scene_emotion: The single dominant emotion of this scene (e.g., "curiosity", "loneliness", "warmth", "surprise", "calm", "anxiety", "comfort", "joy")
- characters_present: An array of character names (matching the Character Bible names) that appear in this scene. Use "none" if no characters are present.

Return as a valid JSON object with this EXACT structure:
{
  "scenes": [
    {
      "chunk_index": 1,
      "script_text": "string (the exact script text for this chunk — copy it word for word from the original script)",
      "scene_description": "string (50-80 words, visual only, no text/dialogue)",
      "scene_emotion": "string (single word)",
      "characters_present": ["string"]
    }
  ]
}

IMPORTANT:
- The chunk_index must be sequential starting from 1.
- The combined script_text of all chunks must equal the ENTIRE original script. Do not add, remove, or modify any words.
- You must return EXACTLY ${chunksCount} chunks.

Return ONLY the raw JSON. No markdown, no backticks, no explanation.

Here is the script:
---
${script}
---`;
}

export function buildSceneImagePrompt(
  scene: Scene,
  totalScenes: number,
  characterBible: CharacterBible,
  artStylePrompt: string,
  aspectRatio: string
): string {
  const characterDescriptions = characterBible.characters
    .map(
      (c) => `
CHARACTER: ${c.name}
- Type: ${c.type}${c.species ? ` (${c.species})` : ""}
- Appearance: ${c.appearance}
- Visual Personality Cues: ${c.personality_visual_cues}
- Default Pose: ${c.default_pose}`
    )
    .join("\n");

  return `You are generating illustration #${scene.chunk_index} of ${totalScenes} for an animated YouTube video. ALL images in this series MUST maintain perfect visual consistency in characters, backgrounds, colors, and art style.

=== MANDATORY STYLE RULES ===
Art Style: ${artStylePrompt}
Aspect Ratio: ${aspectRatio}
Color Palette (USE ONLY THESE COLORS AND THEIR SHADES): ${characterBible.color_palette.join(", ")}
Overall Mood: ${characterBible.overall_mood}
Primary Setting: ${characterBible.primary_setting}

=== CHARACTER BIBLE — EVERY character MUST look EXACTLY as described below ===
${characterDescriptions}

=== SCENE #${scene.chunk_index} ===
Visual Description: ${scene.scene_description}
Emotion/Mood: ${scene.scene_emotion}
Characters Present: ${scene.characters_present.join(", ")}

=== CRITICAL CONSISTENCY RULES ===
1. Characters MUST look identical to their Character Bible descriptions above. Do not alter any physical features, clothing, colors, or proportions under any circumstance.
2. The background environment must match the primary setting description. You may adjust camera angle and lighting for the scene's mood, but the core location and objects remain the same.
3. Use ONLY the specified color palette and their natural shades/tints. Do not introduce unrelated colors.
4. Maintain identical line weight, shading style, and rendering quality across this and all other images in the series.
5. Do NOT include any text, words, letters, numbers, watermarks, speech bubbles, captions, or UI elements in the image.
6. The image must look like a single frame from a professional 2D animated video — clean, polished, and production-ready.
7. This is scene ${scene.chunk_index} of ${totalScenes}. Visual continuity with all other scenes is mandatory.

Generate this single illustration now.`;
}
