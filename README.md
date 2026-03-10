# SceneForge

**AI-Powered Script-to-Scene Image Generator for Animated YouTube Videos**

SceneForge takes a video script, analyzes it with Google Gemini, and generates a complete set of visually consistent 2D illustrated scene images — ready for use in animated YouTube videos, shorts, or social media content.

## How It Works

```
Script Input → Character Bible → Scene Chunks → Image Generation → Download
```

1. **Paste your script** — any narration or voiceover text
2. **Choose your style** — pick from 6 art styles or describe your own
3. **SceneForge analyzes your script** — Gemini identifies characters, settings, and mood, then creates a detailed Character Bible
4. **Script is split into scenes** — intelligently chunked at natural breakpoints based on your video duration
5. **Images are generated** — each scene gets a consistent illustration using the Character Bible for visual continuity
6. **Review and download** — browse scenes in Timeline or Storyboard view, regenerate any scene, then download as a ZIP

## Features

- **Character Bible Generation** — detailed character descriptions, color palette, setting, and mood extracted from your script
- **6 Art Styles** — Cute Minimal, Flat Vector, Watercolor Storybook, Anime, Realistic, or Custom
- **3 Aspect Ratios** — 16:9 (YouTube), 9:16 (Shorts/TikTok), 1:1 (Instagram)
- **Visual Consistency** — every image uses the same Character Bible and style rules
- **Progressive Generation** — watch images appear one by one as they're created
- **Timeline & Storyboard Views** — review scenes vertically or in a compact grid with lightbox
- **Per-Scene Actions** — regenerate, edit description & regenerate, approve, or retry failed scenes
- **Batch Downloads** — ZIP of all images, scene map JSON, or character bible JSON
- **Auto-Retry with Backoff** — handles API rate limits gracefully
- **Keyboard Shortcuts** — Ctrl+Enter to generate, Esc to cancel
- **Dark Theme** — polished UI with warm amber accents

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| AI | Google Gemini API (`@google/genai` SDK) |
| State | Zustand |
| Downloads | JSZip + FileSaver.js |
| Icons | Lucide React |
| Fonts | DM Sans + Space Grotesk |

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([get one free here](https://aistudio.google.com/apikey))

### Installation

```bash
cd sceneforge
npm install
```

### Running the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Setting Up Your API Key

1. Click the **Settings** (gear) icon in the top-right corner
2. Paste your Gemini API key
3. The key is stored in your browser's localStorage (never sent to any server except Google's API)

## Project Structure

```
sceneforge/
├── app/
│   ├── layout.tsx                    # Root layout with fonts and metadata
│   ├── page.tsx                      # Main single-page app (form → progress → results)
│   ├── globals.css                   # Tailwind config and dark theme
│   └── api/
│       ├── generate-bible/route.ts   # POST — Character Bible generation
│       ├── chunk-script/route.ts     # POST — Script chunking into scenes
│       ├── generate-scene/route.ts   # POST — Single scene image generation
│       └── list-models/route.ts      # POST — Debug: list available Gemini models
├── components/
│   ├── ScriptInput.tsx               # Textarea with live char/word count
│   ├── DurationInput.tsx             # Video duration input with scene count preview
│   ├── StyleSelector.tsx             # 6-style card grid selector
│   ├── AspectRatioSelector.tsx       # 16:9 / 9:16 / 1:1 toggle
│   ├── SettingsPanel.tsx             # Slide-over for API key and config
│   ├── ProgressTracker.tsx           # 3-step pipeline progress indicator
│   ├── CharacterBible.tsx            # Displays characters, palette, setting, mood
│   ├── SceneCard.tsx                 # Full scene card with image, actions, prompt
│   ├── SceneTimeline.tsx             # Vertical timeline of all scenes
│   ├── StoryboardGrid.tsx            # Compact grid with lightbox
│   ├── DownloadPanel.tsx             # ZIP, scene map, and bible downloads
│   └── ErrorBoundary.tsx             # React error boundary wrapper
├── lib/
│   ├── types.ts                      # TypeScript interfaces and art style constants
│   ├── gemini.ts                     # Gemini API client and JSON helper
│   ├── prompts.ts                    # All 3 prompt builders (bible, chunks, image)
│   ├── chunker.ts                    # Scene count calculator and timestamps
│   └── utils.ts                      # cn(), retryWithBackoff(), sample script
├── store/
│   └── useProjectStore.ts            # Zustand store with full project state
└── .env.local                        # Optional server-side API key
```

## API Routes

### POST `/api/generate-bible`

Analyzes a script and returns a Character Bible with detailed character descriptions, setting, color palette, and mood.

**Body:** `{ script: string, apiKey: string }`
**Response:** `CharacterBible` object

### POST `/api/chunk-script`

Splits a script into N scene chunks with visual descriptions and emotions.

**Body:** `{ script: string, chunksCount: number, apiKey: string }`
**Response:** `{ scenes: Scene[] }`

### POST `/api/generate-scene`

Generates a single scene illustration image.

**Body:** `{ prompt: string, apiKey: string }`
**Response:** `{ image_base64: string, mime_type: string }`

**Models used (in order of preference):**
1. `gemini-2.5-flash-image` — best quality with character consistency
2. `gemini-2.0-flash-exp-image-generation` — fallback

## Image Generation Models

SceneForge automatically tries available models in order. You can check which models your API key has access to by clicking **"Test API Key & List Image Models"** in Settings.

## Configuration

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| Duration | 90s | 30–900s | Total voiceover length |
| Seconds Per Scene | 8s | 5–15s | How long each scene stays on screen |
| Art Style | Cute Minimal | 6 presets + custom | Visual style for all scenes |
| Aspect Ratio | 16:9 | 16:9 / 9:16 / 1:1 | Output image dimensions |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Start generation (when form is filled) |
| `Esc` | Cancel pipeline during generation |

## Rate Limits

Gemini image generation has per-minute rate limits. SceneForge handles this with:
- **6-second delay** between scene image requests
- **Auto-retry** with exponential backoff (10s → 20s → 40s → 80s) on 429 errors
- **Server-side retry** with 20s wait on rate limit responses

If you hit persistent rate limits, increase the "Seconds Per Scene" setting to reduce the total number of images generated.

## License

MIT
