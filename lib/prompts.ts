import type { Character, CharacterBible, Scene } from "./types";

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
- visual_fingerprint: The 3-5 most distinctive, non-negotiable visual features that make this character instantly recognizable across all frames. These must be concrete, color-specific attributes (e.g., "warm chestnut brown fur, bright amber eyes, small red collar with gold tag, slightly oversized floppy ears"). These will be enforced in EVERY generated image. Be extremely specific with colors and features.

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
      "default_pose": "string",
      "visual_fingerprint": "string (3-5 key features, comma-separated)"
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
  return `You are a video scene planner. Your ONLY job is to split a script into chunks at natural breakpoints.

Split the following script into exactly ${chunksCount} chunks. Each chunk should:
- Represent one distinct visual moment or idea
- Be roughly equal in word count (prioritize natural breakpoints over exact equality)
- End at a natural pause point (end of sentence or thought)
- Cover the ENTIRE script — no text left out

Return a JSON object with this EXACT structure:
{
  "scenes": [
    {
      "chunk_index": 1,
      "script_text": "string (exact script text — word for word, no modifications)"
    }
  ]
}

IMPORTANT:
- chunk_index is sequential starting from 1.
- The combined script_text of all chunks must equal the ENTIRE original script verbatim.
- You must return EXACTLY ${chunksCount} chunks.
- Do NOT add scene descriptions, emotions, or any other fields — ONLY chunk_index and script_text.

Return ONLY the raw JSON. No markdown, no backticks, no explanation.

Here is the script:
---
${script}
---`;
}

/**
 * Generates a composition-focused visual description for a single scene chunk.
 * Receives the full Character Bible so it knows exactly which characters exist
 * and what they look like — preventing hallucinated characters and appearance details.
 */
export function buildSceneDescriptionPrompt(
  scriptText: string,
  chunkIndex: number,
  totalScenes: number,
  bible: CharacterBible | null,
  neighborContext?: { prev?: string; next?: string }
): string {
  const characters = bible?.characters || [];
  const primarySetting = bible?.primary_setting || "Not specified";
  const overallMood = bible?.overall_mood || "Not specified";

  const rosterBlock = characters.length > 0
    ? characters.map((c) => {
        const fp = c.visual_fingerprint || c.appearance.slice(0, 80);
        return `- ${c.name} (${c.type}): ${fp}`;
      }).join("\n")
    : "No characters defined.";

  const neighborBlock = neighborContext
    ? `\n=== SCENE CONTEXT (for narrative flow — describe ONLY the current scene) ===
${neighborContext.prev ? `Previous scene: "${neighborContext.prev.slice(0, 150).trim()}..."` : "This is the first scene."}
>>> CURRENT SCENE (describe this one):
${neighborContext.next ? `Next scene: "${neighborContext.next.slice(0, 150).trim()}..."` : "This is the last scene."}\n`
    : "";

  return `You are an expert animation scene director. Write a COMPOSITION-FOCUSED description for ONE scene in an animated YouTube video.

=== CONTEXT ===
Scene ${chunkIndex} of ${totalScenes}.
Primary setting: ${primarySetting}
Mood: ${overallMood}

=== CHARACTER ROSTER (these are the ONLY characters that exist in this video) ===
${rosterBlock}

⛔ STRICT RULE: These are the ONLY characters in this video. Do NOT invent, imagine, or reference any character, creature, or figure not listed above. If the script is ambiguous, ONLY use characters from this roster. characters_present MUST only contain names from this exact list.
${neighborBlock}
=== SCRIPT TEXT FOR THIS SCENE ===
${scriptText}

=== YOUR TASK ===
Write a single JSON object:
{
  "scene_description": "string (40-60 words)",
  "scene_emotion": "string (single word)",
  "characters_present": ["string"]
}

Rules for scene_description (40-60 words — COMPOSITION ONLY):
- State which characters from the roster are present by NAME ONLY
- Describe what they are DOING (actions, gestures, body language)
- Describe WHERE they are positioned in the frame (left, center, foreground, etc.)
- Specify camera angle (wide shot, medium shot, close-up, over-the-shoulder, etc.)
- Describe lighting direction and atmosphere
- Do NOT describe character appearance, clothing, colors, or physical features — the Character Bible handles that
- Do NOT describe the setting in detail — primary_setting handles that
- Do NOT include dialogue, text, speech bubbles, or sound effects
- Do NOT invent or add ANY character not in the roster above

Rules for characters_present:
- ONLY use exact character names from the CHARACTER ROSTER above
- If no rostered characters appear in this scene, use ["none"]
- NEVER add a name not in the roster — this causes downstream failures

Return ONLY the raw JSON. No markdown, no backticks, no explanation.`;
}

/**
 * Phase 1 of hierarchical chunking: split a long script into narrative acts.
 * Text-only split — descriptions are generated separately.
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
 * Phase 2 of hierarchical chunking: text-only split of a single act into scenes.
 * Receives act text, optional story context from previous acts for continuity.
 */
export function buildActChunkingPrompt(
  actText: string,
  scenesForAct: number,
  startIndex: number,
  actTitle: string,
  previousActSummary?: string
): string {
  const contextBlock = previousActSummary
    ? `\n=== STORY SO FAR ===\n${previousActSummary}\n`
    : "";

  return `You are a video scene planner. Split this act into chunks at natural breakpoints.

This act is titled "${actTitle}".${contextBlock}

Split this act into exactly ${scenesForAct} chunks. Each chunk should:
- Represent one distinct visual moment
- Be roughly equal in word count (prioritize natural breakpoints)
- End at a natural pause point
- Cover the ENTIRE act text — no words left out

Return a JSON object with this EXACT structure:
{
  "scenes": [
    {
      "chunk_index": ${startIndex},
      "script_text": "string (exact text from the act — word for word)"
    }
  ]
}

IMPORTANT:
- chunk_index starts at ${startIndex} and increments sequentially.
- You must return EXACTLY ${scenesForAct} chunks.
- The combined script_text must cover the ENTIRE act text below.
- Do NOT add scene descriptions, emotions, or any other fields — ONLY chunk_index and script_text.

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
  const presentNames = new Set(
    scene.characters_present
      .filter((n) => n.toLowerCase() !== "none")
      .map((n) => n.toLowerCase())
  );

  const relevantCharacters = presentNames.size > 0
    ? characterBible.characters.filter((c) => presentNames.has(c.name.toLowerCase()))
    : [];

  const characterBlocks = relevantCharacters.map((c) => {
    const fingerprint = c.visual_fingerprint || extractFingerprintFallback(c);
    return `CHARACTER: ${c.name} (${c.type}${c.species ? `, ${c.species}` : ""})
Appearance: ${c.appearance}
Pose: ${c.default_pose}
⚠️ MUST HAVE: ${fingerprint}`;
  });

  const isEnvironmentShot = characterBlocks.length === 0;
  const paletteStr = characterBible.color_palette.join(", ");

  return `Generate ONE single fullscreen scene screenshot from a 2D animated video — like pausing an animated movie on a TV.

⛔ ABSOLUTE RULES — violation = immediate rejection:
- ONE image, ONE scene, ONE camera angle. No panels, no comic layouts, no storyboards, no split compositions.
- Full bleed: scene fills 100% of the canvas edge-to-edge. No borders, frames, margins, or empty space.
- ZERO TEXT: No words, letters, numbers, watermarks, speech bubbles, or captions.
${isEnvironmentShot ? "- This is an ENVIRONMENT/ATMOSPHERE shot — do NOT add any characters, people, animals, or figures." : "- ONLY include the characters listed below. Do NOT add any other characters, people, animals, or figures."}

=== PRIORITY RULES ===
- Character appearance: ONLY from the CHARACTER blocks below. Ignore any conflicting appearance details in the scene description.
- Scene composition (who is where, doing what, camera angle): From the scene description below.
- Setting: From the primary_setting below. The scene description may add scene-specific props.

=== SCENE #${scene.chunk_index} of ${totalScenes} ===
${scene.scene_description}
Emotion: ${scene.scene_emotion}

=== VISUAL STYLE ===
Format: Single ${aspectRatio} image, full bleed.
Art Style: ${artStylePrompt}
Palette: ${paletteStr} (use only these colors and natural tints/shades)
Setting: ${characterBible.primary_setting}
Mood: ${characterBible.overall_mood}

=== CHARACTERS IN THIS SCENE ===
${characterBlocks.length > 0 ? characterBlocks.join("\n\n") : "No characters — focus on environment, setting, and atmosphere only."}

=== CONSISTENCY ===
- Every character MUST match their appearance description exactly — same face, colors, outfit, proportions.
- Identical line weight, shading, and rendering quality across all ${totalScenes} images.
- Screenshot ${scene.chunk_index} of ${totalScenes} — maintain seamless visual continuity.

Generate now.`;
}

/**
 * Fallback fingerprint extraction for characters that don't have
 * a visual_fingerprint from the Bible (backward compatibility).
 */
function extractFingerprintFallback(character: Character): string {
  const desc = character.appearance.toLowerCase();
  const features: string[] = [];

  const colorPatterns = desc.match(
    /(?:bright |dark |light |warm |deep |soft |pale |vivid )?\w+ (?:fur|hair|eyes|skin|coat|feathers|scales|dress|shirt|jacket|hat|scarf|bow|ribbon|collar|glasses)/g
  );
  if (colorPatterns) {
    features.push(...colorPatterns.slice(0, 3));
  }

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
