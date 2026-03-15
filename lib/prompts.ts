import type { Character, CharacterBible, Scene, TextModelOption } from "./types";

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

/**
 * Phase 1 of hierarchical chunking: split a long script into narrative acts.
 * Each act is a self-contained segment with its own script_text.
 */
export function buildActsPrompt(
  script: string,
  actCount: number,
  totalScenes: number
): string {
  return `You are a professional screenwriter and story structure analyst.

Divide the following script into exactly ${actCount} narrative acts. Each act should:
- Represent a distinct phase of the story (setup, rising action, turning point, climax, resolution, etc.)
- End at a natural story beat — never mid-sentence
- Cover the ENTIRE script with zero gaps or overlaps
- Be labeled with a brief act_title summarizing that segment

For each act, also specify how many scenes it should contain. The total across all acts must equal exactly ${totalScenes} scenes. Distribute scenes proportionally — longer or more eventful acts get more scenes.

Return as a valid JSON object with this EXACT structure:
{
  "acts": [
    {
      "act_index": 1,
      "act_title": "string (2-5 words)",
      "script_text": "string (exact text from the script — copy word for word, no modifications)",
      "scene_count": number
    }
  ]
}

IMPORTANT:
- act_index is sequential starting from 1.
- The concatenation of all script_text fields must exactly equal the full original script.
- The sum of all scene_count fields must equal exactly ${totalScenes}.
- You must return EXACTLY ${actCount} acts.

Return ONLY the raw JSON. No markdown, no backticks, no explanation.

Here is the script:
---
${script}
---`;
}

/**
 * Phase 2 of hierarchical chunking: chunk a single act into scenes.
 * Receives act text and the number of scenes to produce for that act.
 */
export function buildActChunkingPrompt(
  actText: string,
  scenesForAct: number,
  startIndex: number,
  actTitle: string
): string {
  return `You are a video scene planner for animated YouTube videos.

You are working on one act of a larger script. This act is titled "${actTitle}".

Split this act into exactly ${scenesForAct} scene chunks. Each chunk should:
- Represent one distinct visual moment that can be illustrated as a single image
- Be roughly equal in word count (prioritize natural breakpoints)
- End at a natural pause point
- Cover the ENTIRE act text — no words left out

For each chunk, write:
- scene_description: A detailed visual description (50-80 words). Describe: setting/location, characters present, their positions and actions, facial expressions, body language, camera angle, lighting/mood. Do NOT include text, dialogue, or speech bubbles.
- scene_emotion: One dominant emotion (e.g., "curiosity", "loneliness", "warmth", "joy")
- characters_present: Array of character names present in this scene.

Return as a valid JSON object with this EXACT structure:
{
  "scenes": [
    {
      "chunk_index": ${startIndex},
      "script_text": "string (exact text from the act — word for word)",
      "scene_description": "string (50-80 words, visual only)",
      "scene_emotion": "string (single word)",
      "characters_present": ["string"]
    }
  ]
}

IMPORTANT:
- chunk_index starts at ${startIndex} and increments sequentially.
- You must return EXACTLY ${scenesForAct} chunks.
- The combined script_text must cover the ENTIRE act text below.

Return ONLY the raw JSON. No markdown, no backticks, no explanation.

Here is the act text:
---
${actText}
---`;
}

export function buildSceneImagePrompt(
  scene: Scene,
  totalScenes: number,
  characterBible: CharacterBible,
  artStylePrompt: string,
  aspectRatio: string
): string {
  // Build per-character fingerprint blocks with emphasis on the most critical identifying features
  const characterBlocks = characterBible.characters.map((c) => {
    const fingerprint = extractFingerprint(c);
    return `
CHARACTER: ${c.name}
- Type: ${c.type}${c.species ? ` (${c.species})` : ""}
- Appearance: ${c.appearance}
- Visual Personality Cues: ${c.personality_visual_cues}
- Default Pose: ${c.default_pose}
⚠️ VISUAL FINGERPRINT — ${c.name} ALWAYS has: ${fingerprint}. This is NON-NEGOTIABLE in every single frame.`;
  });

  const characterDescriptions = characterBlocks.join("\n");

  const paletteStr = characterBible.color_palette.join(", ");

  return `Generate a SINGLE scene screenshot from a 2D animated video. This is ONE continuous image — NOT a comic, NOT panels, NOT framed artwork. Think of it as a direct screenshot from an animated movie playing fullscreen on a TV.

⛔⛔⛔ CRITICAL — READ THIS FIRST ⛔⛔⛔
The #1 rule: generate ONE image with ONE scene. If the output contains more than one panel, frame, or viewpoint, it is IMMEDIATELY REJECTED.

ABSOLUTELY FORBIDDEN — if ANY of these appear the image is invalid:
- TWO OR MORE PANELS stacked vertically, horizontally, or in any grid/comic layout
- MULTIPLE VIEWPOINTS or camera angles combined into one image (e.g. wide shot on top, close-up on bottom)
- SPLIT COMPOSITIONS showing the same character from different angles or at different moments
- STORYBOARD LAYOUTS with 2, 3, or more frames showing a sequence
- COMIC STRIP FORMAT with any kind of panel dividers, gutters, or borders between sections
- Horizontal lines, bars, or dividers splitting the image into sections
- Black outlines, borders, or frames around the scene
- White, cream, or beige margins/padding around the edges
- Vignettes, circular frames, or decorative borders
- Any empty/blank space at any edge

The ONLY acceptable output is: ONE single continuous scene filling 100% of the canvas with ONE camera angle, ONE moment in time, ONE composition. The background extends edge-to-edge like a widescreen movie frame.

=== FORMAT ===
Output: A single ${aspectRatio} image. ONE scene. ONE moment. ONE camera angle. The painted scene extends to every pixel of the canvas — exactly like pausing an animated movie on fullscreen.

=== VISUAL DNA (applies to ALL ${totalScenes} screenshots) ===
Art Style: ${artStylePrompt}
Locked Color Palette: ${paletteStr} — use ONLY these colors and their natural tints/shades.
Overall Mood: ${characterBible.overall_mood}
Primary Setting: ${characterBible.primary_setting}

=== CHARACTER BIBLE ===
${characterDescriptions}

=== SCENE #${scene.chunk_index} of ${totalScenes} ===
Visual Description: ${scene.scene_description}
Emotion/Mood: ${scene.scene_emotion}
Characters Present: ${scene.characters_present.join(", ")}

=== RULES ===
1. SINGLE IMAGE, FULL BLEED: One continuous scene filling 100% of the canvas. The background extends to every edge. If I see any border, frame, margin, or multi-panel layout, the image is rejected.
2. CHARACTER IDENTITY: Every character MUST match their Bible description exactly — same face, eyes, outfit, proportions, distinguishing features. Zero deviation.
3. BACKGROUND: The setting matches the primary setting description. The background fills the entire canvas — no cropping into a smaller area.
4. COLOR DISCIPLINE: Only the specified palette and natural tints. No white/cream backgrounds unless the story explicitly requires it.
5. STYLE LOCK: Identical line weight, shading, and rendering quality across all ${totalScenes} images.
6. ZERO TEXT: No words, numbers, letters, watermarks, speech bubbles, captions, or UI overlays.
7. CONTINUITY: Screenshot ${scene.chunk_index} of ${totalScenes}. Seamless visual continuity across all screenshots.

FINAL REMINDER: Generate EXACTLY ONE image. NOT a comic. NOT panels. NOT a storyboard. ONE single scene, like a movie screenshot. Generate now.`;
}

/**
 * Extracts the 2-3 most distinctive visual features from a character
 * to create a "fingerprint" that reinforces identity across prompts.
 */
function extractFingerprint(character: Character): string {
  const desc = character.appearance.toLowerCase();
  const features: string[] = [];

  // Extract color-specific mentions (strongest anchors)
  const colorPatterns = desc.match(
    /(?:bright |dark |light |warm |deep |soft |pale |vivid )?\w+ (?:fur|hair|eyes|skin|coat|feathers|scales|dress|shirt|jacket|hat|scarf|bow|ribbon|collar|glasses)/g
  );
  if (colorPatterns) {
    features.push(...colorPatterns.slice(0, 3));
  }

  // If we didn't get enough, pull distinctive nouns
  if (features.length < 2) {
    const accessoryPatterns = desc.match(
      /(?:glasses|hat|scarf|bow|ribbon|collar|necklace|bracelet|earring|bandana|cape|apron|backpack|crown|tiara|monocle|patch)/g
    );
    if (accessoryPatterns) {
      features.push(...accessoryPatterns.slice(0, 2));
    }
  }

  if (features.length === 0) {
    const words = character.appearance.split(/[,.;]+/);
    return words.slice(0, 2).map((w) => w.trim()).filter(Boolean).join("; ");
  }

  return features.join(", ");
}

export function buildAnimationPromptsPrompt(
  script: string,
  bible: CharacterBible,
  scenes: { chunk_index: number; script_text: string; scene_description: string; scene_emotion: string; characters_present: string[] }[],
  secondsPerScene: number,
  videoTool: string = "grok"
): string {
  const sceneList = scenes.map((s) => {
    const scriptExcerpt = s.script_text.length > 250 ? s.script_text.slice(0, 250) + "..." : s.script_text;
    return `Scene ${s.chunk_index}:
  Script: "${scriptExcerpt}"
  Visual: ${s.scene_description}
  Emotion: ${s.scene_emotion}
  Characters: ${s.characters_present.join(", ") || "none"}`;
  }).join("\n\n");

  const toolName = videoTool === "kling" ? "Kling AI" : videoTool === "runway" ? "Runway" : "Grok (xAI)";
  const fps = secondsPerScene <= 6 ? "24fps" : "30fps";

  return `You are a professional cinematographer and animation director. You write image-to-video prompts for ${toolName}. The user will upload a still 2D animated scene image and paste your prompt to generate a ${secondsPerScene}-second video clip.

CRITICAL: ${toolName} processes the FIRST 20-30 words most heavily. Front-load the most important motion and subject action. Never waste the opening on boilerplate.

=== CHARACTER REFERENCE ===
${bible.characters.map((c) => `- ${c.name}: ${c.appearance.slice(0, 120)}`).join("\n")}
Setting: ${bible.primary_setting}

=== SCRIPT CONTEXT ===
${script.length > 2500 ? script.slice(0, 2500) + "\n...[truncated]" : script}

=== SCENES ===
${sceneList}

=== PROMPT STRUCTURE (MANDATORY) ===
Every animation_prompt MUST follow this exact layered structure in order:

LAYER 1 — SUBJECT ACTION (first 5-10 words, most critical):
Start with the primary character action using precise, specific verbs.
GOOD: "Golden retriever puppy tilts head right, ears perking up"
BAD: "The dog moves" / "Character animates" / "Scene comes alive"
Use verbs like: tilts, turns, reaches, leans, steps, lifts, lowers, glances, blinks, nods, wags, twitches, shifts, exhales, shrugs, gestures, recoils, embraces.

LAYER 2 — CAMERA (filmmaking vocabulary):
Use professional terms: slow dolly-in, gentle pan left, static wide shot, tracking shot, push-in, pull-back, tilt up, handheld drift, over-the-shoulder, rack focus.
Include: "${fps}, shallow depth of field" for dramatic scenes OR "${fps}, deep focus" for wide establishing shots.

LAYER 3 — PHYSICS & ENVIRONMENT (what else moves):
Describe secondary motion driven by physics — not random motion:
- Hair/fur sways gently with head movement
- Fabric settles after character turns
- Dust motes drift through light beam
- Leaves rustle from wind, water ripples, candle flickers
- Shadows shift as light source changes
- Steam rises, breath visible in cold air
Every moving element must have a CAUSE (wind, gravity, character action).

LAYER 4 — CONSISTENCY SUFFIX (always end with this):
End every prompt with: "Maintain character consistency, stable proportions, do not morph. 2D animated style, consistent line weight and color palette throughout the ${secondsPerScene}-second clip."

=== PACING RULES (match to scene emotion) ===
- JOY / EXCITEMENT: Quick character actions, energetic camera (tracking, push-in), lively environment. Multiple small movements.
- SADNESS / REFLECTION: Slow, deliberate single action. Static or very slow dolly. Minimal environment motion. Let stillness breathe.
- TENSION / SUSPENSE: Slow creeping camera (dolly-in or tilt), character frozen then sudden micro-movement (eye shift, hand clench). Background darkens slightly.
- WONDER / CURIOSITY: Character looks around slowly, wide-eyed. Gentle pan or tilt to reveal. Floating particles, soft light shifts.
- ANGER / CONFLICT: Sharp character gestures, fast camera push-in, environment reacts (objects rattle, shadows deepen).
- WARMTH / LOVE: Slow approach or lean-in, soft-focus background, gentle ambient glow shift. Tender small gesture (hand touch, smile forming).
- SURPRISE: Start static for 1-2 seconds, then sudden quick action. Camera holds then rapid push-in or pull-back.

=== ANTI-ARTIFACT RULES ===
- NEVER describe character appearance, colors, or art style in the prompt (the image provides this)
- NEVER use negative phrasing ("no blur", "don't change"). Use positive: "sharp focus", "stable proportions"
- NEVER request more than 2-3 distinct character actions per ${secondsPerScene}-second clip (causes jitter)
- NEVER leave motion unanchored — every movement must have a physical cause
- Keep total motion restrained and intentional — less is more for quality
- Characters should stay inside the camera frame throughout the clip

=== OUTPUT FORMAT ===
Return a JSON array. Each element:
{
  "chunk_index": <number>,
  "animation_prompt": "<string, 60-120 words, structured as Layer 1-4 above>",
  "camera_movement": "<string, professional camera direction, e.g. 'Slow dolly-in, 35mm lens, ${fps}, shallow depth of field'>",
  "suggested_transition": "<string, e.g. 'Crossfade 0.5s', 'Hard cut', 'Match cut on motion', 'Fade to black 1s', 'Whip pan transition'>"
}

Return ONLY the raw JSON array. No markdown. No backticks. No explanation.`;
}
