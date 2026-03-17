# SceneForge — Pipeline Input Guide

This document explains how to provide custom inputs at every stage of the SceneForge pipeline, including how to manually generate high-quality scene prompts using external LLMs like Claude.

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Custom Character Bible](#1-custom-character-bible)
3. [Custom Scene Breakdown](#2-custom-scene-breakdown)
4. [Editing Image Prompts (Prompt Review)](#3-editing-image-prompts)
5. [Custom Reference Image](#4-custom-reference-image)
6. [Full Project Import/Export](#5-full-project-importexport)
7. [Prompt Templates](#6-prompt-templates)
8. [Advanced Parameters](#7-advanced-parameters)
9. [Manual Prompt Generation with Claude / ChatGPT](#8-manual-prompt-generation-with-claude--chatgpt)

---

## Pipeline Overview

```
Script Input → Bible Generation → Script Chunking → Prompt Review → Hero Frame → Image Generation → Complete
      ↑               ↑                 ↑                ↑              ↑
   Import          Custom            Custom           Edit all      Upload own
   Project         Bible             Scenes           prompts       ref image
```

Every step marked with ↑ can be bypassed or customized with your own data.

---

## 1. Custom Character Bible

**Bypasses:** AI Character Bible generation  
**Where in the app:** Idle screen → toggle "Custom Bible" → Form Editor or JSON Paste  
**When to use:** You already have established characters with defined appearances, or you want full control over how characters look.

### JSON Format

```json
{
  "characters": [
    {
      "name": "The Dog",
      "type": "animal",
      "species": "golden retriever",
      "appearance": "Warm chestnut brown fur with a lighter cream-colored chest and belly. Bright amber eyes with long eyelashes. Small red collar with a shiny gold tag. Slightly oversized floppy ears that bounce when walking. Medium-sized puppy proportions with a fluffy curved tail.",
      "personality_visual_cues": "Always has a slight head tilt showing curiosity, ears perk up when excited",
      "default_pose": "Sitting upright with tail wagging, head slightly tilted",
      "visual_fingerprint": "warm chestnut brown fur, bright amber eyes, small red collar with gold tag, floppy oversized ears, fluffy curved tail"
    },
    {
      "name": "The Owner",
      "type": "human",
      "species": null,
      "appearance": "Young woman in her mid-20s with shoulder-length dark brown wavy hair. Warm olive skin tone. Wearing a cozy cream-colored oversized sweater and blue jeans. Soft brown eyes with round glasses. Gentle smile with slightly rosy cheeks.",
      "personality_visual_cues": "Soft gentle expressions, often crouching down to pet the dog",
      "default_pose": "Standing with hands on hips or kneeling next to the dog",
      "visual_fingerprint": "dark brown wavy hair, round glasses, cream oversized sweater, warm olive skin"
    }
  ],
  "primary_setting": "A cozy modern apartment with cream-colored walls, a warm brown leather couch, a small potted monstera plant in a terracotta pot, light oak hardwood floors, a large window with sheer white curtains letting in soft natural light",
  "color_palette": ["#F5E6D3", "#8B6F47", "#4A90D9", "#E8B4B8", "#D4C5A9", "#FF6B6B"],
  "overall_mood": "Warm, heartfelt, and gently humorous — a feel-good story about companionship"
}
```

### Field Reference

| Field | Required | Description |
|---|---|---|
| `name` | ✅ | Character label, e.g. "The Dog", "Maya", "The Narrator" |
| `type` | ✅ | One of: `"human"`, `"animal"`, `"object"` |
| `species` | ❌ | For animals only (e.g. `"golden retriever"`). Use `null` for humans/objects |
| `appearance` | ✅ | 50-100 words. Be extremely specific: exact colors, clothing items, body proportions, accessories. This text is injected into every image prompt |
| `personality_visual_cues` | ❌ | How personality shows visually (e.g. "always tilts head") |
| `default_pose` | ❌ | Most common pose in the video |
| `visual_fingerprint` | ✅ | 3-5 comma-separated key features. The MOST important field for consistency. These are enforced in every image. Be color-specific |
| `primary_setting` | ✅ | 30-50 words describing the main location/environment |
| `color_palette` | ✅ | Exactly 6 hex color codes |
| `overall_mood` | ✅ | One sentence emotional tone |

### Tips for Better Results

- **Be obsessively specific with colors.** Not "brown fur" — say "warm chestnut brown fur."
- **Visual fingerprint is king.** These 3-5 features are what the image model checks against for every scene. If the fingerprint is vague, consistency drops.
- **Keep clothing simple.** Complex outfits with many layers cause inconsistency. One or two key garments with specific colors works best.
- **Color palette matters.** Choose warm, cohesive colors. The palette is applied to backgrounds and lighting across all images.

### How to Upload

- **JSON Paste:** Copy the JSON and paste it into the text area, then click "Parse & Save"
- **File Upload:** Save the JSON to a `.json` file, then click "Upload JSON File"
- **Form Editor:** Fill in each field manually using the form UI

---

## 2. Custom Scene Breakdown

**Bypasses:** AI script chunking and scene description generation  
**Where in the app:** Idle screen → toggle "Custom Scenes" → JSON paste or file upload  
**When to use:** You're a storyboard artist with a pre-planned shot list, or you want precise control over what each scene contains.

### JSON Format (Array)

```json
[
  {
    "script_text": "The dog wakes up on his favorite spot on the couch, stretching his little paws and yawning.",
    "scene_description": "Medium shot — The Dog stretches on the brown leather couch, paws extended forward, mouth open in a wide yawn. Soft morning light streams from the window behind him.",
    "scene_emotion": "peaceful",
    "characters_present": ["The Dog"]
  },
  {
    "script_text": "The Owner walks in with a cup of coffee and notices the dog is awake.",
    "scene_description": "Wide shot — The Owner enters from the left holding a steaming mug, looking toward The Dog on the couch with a warm smile. Kitchen light spills from behind her.",
    "scene_emotion": "warm",
    "characters_present": ["The Dog", "The Owner"]
  },
  {
    "script_text": "Sunlight pours through the window, casting golden patterns on the hardwood floor.",
    "scene_description": "Wide establishing shot — Empty room with golden sunlight streaming through sheer curtains, creating warm light patterns on the oak floor. The leather couch is visible in the background.",
    "scene_emotion": "serene",
    "characters_present": ["none"]
  }
]
```

You can also wrap it:

```json
{
  "scenes": [
    { "script_text": "...", "scene_description": "...", "scene_emotion": "...", "characters_present": ["..."] }
  ]
}
```

### CSV Format

```csv
script_text,scene_description,scene_emotion,characters_present
"The dog wakes up stretching","Medium shot — The Dog stretches on couch, paws forward, yawning",peaceful,The Dog
"The Owner walks in with coffee","Wide shot — The Owner enters from left holding mug",warm,The Dog;The Owner
"Sunlight pours through the window","Wide establishing shot — Empty room with golden sunlight",serene,none
```

In CSV, separate multiple characters with `;` (semicolons).

### Field Reference

| Field | Required | Description |
|---|---|---|
| `script_text` | ✅ | The actual script/narration text for this scene |
| `scene_description` | ✅ | Visual composition description (see writing guide below) |
| `scene_emotion` | ❌ | Single word emotion. Defaults to `"neutral"` |
| `characters_present` | ❌ | Array of character names. Must exactly match names in Bible. Use `["none"]` for environment shots |

### How to Write Good Scene Descriptions

A scene description should be **composition-focused** (40-60 words):

- ✅ State which characters are present **by name**
- ✅ Describe what they're **doing** (actions, gestures)
- ✅ Describe **where** in the frame (left, center, foreground)
- ✅ Specify **camera angle** (wide shot, medium, close-up, over-the-shoulder)
- ✅ Describe **lighting** direction and atmosphere
- ❌ Do NOT describe character appearance (the Bible handles that)
- ❌ Do NOT describe the setting in detail (primary_setting handles that)
- ❌ Do NOT add dialogue, speech bubbles, or text

---

## 3. Editing Image Prompts

**Bypasses:** Nothing — this is an edit step for AI-generated prompts  
**Where in the app:** Automatically shown after chunking → "Review Image Prompts" screen  
**When to use:** Always. Review before spending money on image generation.

After scenes are created (either by AI or custom import), SceneForge builds the full image prompt for every scene and pauses for your review. You can edit two things per scene:

1. **Scene Description** — The short composition text (40-60 words)
2. **Full Image Prompt** — The complete text sent to Gemini's image model

The full prompt includes the scene description, character appearances from Bible, art style, color palette, and consistency rules. You can freely rewrite any part.

Click **"Approve Prompts & Generate Hero Frame"** when satisfied.

---

## 4. Custom Reference Image

**Bypasses:** Hero frame AI generation  
**Where in the app:** Hero Review screen → "Upload Your Own Reference Image" button  
**When to use:** You have a character sheet, style reference, or previously generated image you want all scenes to match.

### Accepted Formats

- PNG
- JPEG / JPG
- WebP

Just select the file. It becomes the visual anchor for all remaining scenes. The image should:

- Match the art style you want for the entire project
- Show your main character(s) if possible
- Be high quality (the model uses it as a style reference)

---

## 5. Full Project Import/Export

**Export:** Complete screen → bottom bar → "Full Project" button  
**Import:** Idle screen → header → "Import Project" button  
**When to use:** Resume work on a different machine, share projects, or pre-build everything offline.

### Export Format

```json
{
  "_format": "sceneforge_project_v1",
  "project": {
    "art_style": "cute_minimal",
    "art_style_custom": "",
    "aspect_ratio": "16:9",
    "duration_seconds": 90,
    "seconds_per_scene": 8,
    "processing_mode": "batch",
    "image_model": "gemini-2.5-flash-image",
    "text_model": "gemini-2.5-flash",
    "video_tool": "grok"
  },
  "script": "Your full script text...",
  "character_bible": { },
  "scenes": [
    {
      "chunk_index": 1,
      "script_text": "...",
      "scene_description": "...",
      "scene_emotion": "happy",
      "characters_present": ["The Dog"],
      "generation_prompt": "Full image prompt text...",
      "status": "pending",
      "animation_prompt": null,
      "camera_movement": null,
      "suggested_transition": null
    }
  ],
  "prompt_templates": {
    "bible": null,
    "scene_description": null,
    "image_prompt": null
  },
  "advanced_params": {
    "bible_temperature": 0.4,
    "bible_max_tokens": 4096,
    "chunking_temperature": 0.3,
    "description_temperature": 0.3,
    "description_max_tokens": 1024,
    "max_retries": 3
  }
}
```

### Key Rules

- Must have `"_format": "sceneforge_project_v1"` — the app checks this
- All sections are optional — import only what you need
- If `character_bible` is present, Bible source auto-switches to "Custom"
- If `scenes` is present, Scenes source auto-switches to "Custom"
- **Tip:** Export a project first, edit the JSON, then re-import

---

## 6. Prompt Templates

**Where in the app:** Settings panel → "Prompt Templates" section  
**When to use:** You want to fundamentally change how SceneForge talks to the AI — different instruction style, different output format, different rules.

Templates use `{{variable}}` syntax. Available variables per template:

### Bible Prompt Template

| Variable | Description |
|---|---|
| `{{script}}` | The full script text |

### Scene Description Prompt Template

| Variable | Description |
|---|---|
| `{{scriptText}}` | Script text for this specific scene |
| `{{chunkIndex}}` | Scene number (e.g. 5) |
| `{{totalScenes}}` | Total scene count (e.g. 12) |
| `{{primarySetting}}` | Setting from the Bible |
| `{{overallMood}}` | Mood from the Bible |

### Image Prompt Template

| Variable | Description |
|---|---|
| `{{chunkIndex}}` | Scene number |
| `{{totalScenes}}` | Total scenes |
| `{{sceneDescription}}` | The scene description text |
| `{{sceneEmotion}}` | Single-word emotion |
| `{{artStylePrompt}}` | Art style prompt text |
| `{{aspectRatio}}` | e.g. "16:9" |
| `{{primarySetting}}` | Setting from Bible |
| `{{overallMood}}` | Mood from Bible |
| `{{colorPalette}}` | Comma-separated hex codes |

Leave any template blank to use the built-in default.

---

## 7. Advanced Parameters

**Where in the app:** Settings panel → "Advanced Parameters" section

| Parameter | Default | Range | What It Does |
|---|---|---|---|
| Bible Temperature | 0.4 | 0 – 1 | Higher = more creative character designs. Lower = more literal |
| Bible Max Tokens | 4096 | 1024 – 16384 | Max output length for Bible generation |
| Chunking Temperature | 0.3 | 0 – 1 | Higher = more creative scene splits. Lower = more mechanical |
| Description Temperature | 0.3 | 0 – 1 | Higher = more creative scene descriptions. Lower = more literal |
| Description Max Tokens | 1024 | 256 – 4096 | Max output length per scene description |
| Max API Retries | 3 | 1 – 10 | How many times to retry on API failure |

**Tip:** For production scripts, keep temperatures at 0.3 or below to minimize hallucination. Raise to 0.5+ only for creative/experimental projects.

---

## 8. Manual Prompt Generation with Claude / ChatGPT

You can use an external LLM to generate any part of the pipeline manually, then import the results. This gives you the highest quality control.

### Step 1: Generate a Character Bible with Claude

Paste this prompt into Claude (or ChatGPT):

```
You are an expert animation character designer. Analyze the following script and create a Character Bible.

For each character, provide:
- name: A label (e.g. "The Dog", "Maya")
- type: "human", "animal", or "object"
- species: (for animals only, null otherwise)
- appearance: 50-100 words, extremely specific with colors, clothing, body features
- personality_visual_cues: How personality shows visually
- default_pose: Most common position
- visual_fingerprint: 3-5 comma-separated key features (most critical — be color-specific)

Also determine:
- primary_setting: 30-50 words, specific colors and objects
- color_palette: 6 hex codes (1 background, 2 character, 1 accent, 1 neutral, 1 highlight)
- overall_mood: One sentence

Return as a valid JSON object:
{
  "characters": [...],
  "primary_setting": "...",
  "color_palette": ["#hex1", ...],
  "overall_mood": "..."
}

Here is the script:
---
[PASTE YOUR SCRIPT HERE]
---
```

Copy the JSON output → paste into SceneForge's Custom Bible JSON editor.

### Step 2: Generate Scene Descriptions with Claude

Once you have a Bible, use this prompt to generate scene descriptions:

```
You are an expert animation scene director. I have a script that needs to be split into [NUMBER] scenes for an animated YouTube video.

Here is the Character Bible (these are the ONLY characters that exist):
[PASTE YOUR CHARACTER BIBLE JSON HERE]

Here is the script:
---
[PASTE YOUR SCRIPT HERE]
---

For each scene, return a JSON array:
[
  {
    "script_text": "exact script text for this scene (word for word, no modifications)",
    "scene_description": "40-60 word composition-focused description",
    "scene_emotion": "single word emotion",
    "characters_present": ["exact character names from Bible"]
  }
]

Rules for scene_description:
- State which characters are present by NAME
- Describe what they are DOING (actions, gestures, body language)
- Describe WHERE they are positioned (left, center, foreground, etc.)
- Specify camera angle (wide shot, medium shot, close-up, over-the-shoulder)
- Describe lighting direction and atmosphere
- Do NOT describe character appearance — the Bible handles that
- Do NOT include dialogue or text
- Do NOT invent characters not in the Bible

Rules for characters_present:
- ONLY use exact names from the Bible
- Use ["none"] for environment/atmosphere shots with no characters

Return ONLY the JSON array.
```

Copy the JSON output → paste into SceneForge's Custom Scenes JSON editor.

### Step 3: Generate Full Image Prompts with Claude

This is the most powerful manual step. For each scene, ask Claude to write the complete image generation prompt:

```
You are writing image generation prompts for Gemini's image model. Each prompt generates ONE scene screenshot from a 2D animated video.

Character Bible:
[PASTE YOUR BIBLE JSON]

I need a prompt for Scene [NUMBER] of [TOTAL]:
Script text: "[SCENE SCRIPT TEXT]"
Scene description: "[SCENE DESCRIPTION]"
Emotion: [EMOTION]
Characters in scene: [CHARACTER NAMES]
Art style: [YOUR ART STYLE, e.g. "Cute minimalist 2D illustration with clean outlines, soft warm color palette"]
Aspect ratio: [e.g. 16:9]

Write the prompt following this structure:

1. Opening instruction: "Generate ONE single fullscreen scene screenshot from a 2D animated video"
2. Absolute rules: one image, full bleed, zero text, only listed characters
3. Scene section: scene number, description, emotion
4. Visual style: format, art style, color palette, setting, mood
5. Character blocks: For EACH character in the scene, include:
   - CHARACTER: Name (type, species)
   - Appearance: [full appearance from Bible]
   - Pose: [action in this scene]
   - ⚠️ MUST HAVE: [visual_fingerprint from Bible]
6. Consistency suffix: match appearance exactly, identical rendering across all scenes

The prompt should be 400-600 words. Be very specific. Do not include any appearance details that contradict the Character Bible.
```

You can batch this — ask Claude to generate prompts for all scenes at once. Then paste them into each scene's "Full Image Prompt" field during the Prompt Review stage.

### Step 4: Import Everything at Once

The fastest workflow for full manual control:

1. Generate Bible with Claude → save as `bible.json`
2. Generate scenes with Claude → save as `scenes.json`
3. Combine into a project file:

```json
{
  "_format": "sceneforge_project_v1",
  "project": {
    "art_style": "custom",
    "art_style_custom": "Your art style description here",
    "aspect_ratio": "16:9",
    "duration_seconds": 90,
    "seconds_per_scene": 8,
    "processing_mode": "standard",
    "image_model": "gemini-2.5-flash-image",
    "text_model": "gemini-2.5-flash",
    "video_tool": "grok"
  },
  "script": "Your full script...",
  "character_bible": { /* paste bible.json contents */ },
  "scenes": [ /* paste scenes.json contents */ ]
}
```

4. Import into SceneForge → "Import Project" button
5. Hit "Generate Scenes" → review prompts → generate images

### Tips for Best Results with Manual Prompts

- **Claude tends to produce better scene descriptions than ChatGPT** for this use case because it follows compositional constraints more precisely.
- **Batch your requests.** Ask for all scenes at once rather than one at a time — this gives the LLM context about the full narrative arc.
- **Always include the Character Bible** in your prompt. Without it, the LLM will invent appearance details that conflict with image generation.
- **Review `characters_present` carefully.** The #1 cause of hallucinated characters in images is a wrong name in this field. If a scene is just a landscape, use `["none"]`.
- **Keep scene descriptions at 40-60 words.** Longer descriptions cause the image model to pick and choose which instructions to follow, reducing consistency.
- **Front-load the most important visual information.** Image models weight the beginning of a prompt more heavily.

---

## Quick Reference Table

| Pipeline Step | Custom Input Format | Where to Provide | How to Upload |
|---|---|---|---|
| Character Bible | JSON object | Idle → "Custom Bible" toggle | JSON paste, form, or `.json` file |
| Scene Breakdown | JSON array or CSV | Idle → "Custom Scenes" toggle | JSON paste or `.json`/`.csv` file |
| Image Prompts | Edit existing text | Prompt Review screen (auto) | Inline text editing |
| Hero/Reference Image | PNG, JPEG, or WebP | Hero Review → Upload button | File picker |
| Full Project | JSON (v1 format) | Idle → "Import Project" button | `.json` file |
| Prompt Templates | Text with `{{vars}}` | Settings → Prompt Templates | Inline text editing |
| Advanced Parameters | Sliders | Settings → Advanced Parameters | UI sliders |
