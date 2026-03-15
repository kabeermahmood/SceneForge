import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { buildAnimationPromptsPrompt } from "@/lib/prompts";
import type { CharacterBible } from "@/lib/types";

interface AnimationResult {
  chunk_index: number;
  animation_prompt: string;
  camera_movement: string;
  suggested_transition: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script, characterBible, scenes, apiKey, model, secondsPerScene, videoTool } =
      body as {
        script: string;
        characterBible: CharacterBible;
        scenes: {
          chunk_index: number;
          script_text: string;
          scene_description: string;
          scene_emotion: string;
          characters_present: string[];
        }[];
        apiKey: string;
        model: string;
        secondsPerScene: number;
        videoTool?: string;
      };

    if (!script || !characterBible || !scenes?.length || !apiKey) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const selectedModel = model || "gemini-2.5-flash";
    const sps = secondsPerScene || 8;
    const selectedTool = videoTool || "grok";
    const client = getGeminiClient(apiKey);

    const prompt = buildAnimationPromptsPrompt(
      script,
      characterBible,
      scenes,
      sps,
      selectedTool
    );

    const result = await client.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.text || "";
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let parsed: AnimationResult[];
    try {
      parsed = JSON.parse(cleaned) as AnimationResult[];
    } catch {
      console.error(
        "[generate-animation-prompts] JSON parse failed. Raw:",
        text.slice(0, 500)
      );
      return NextResponse.json(
        { message: "Model returned invalid JSON. Try again or use a different model." },
        { status: 500 }
      );
    }

    const resultMap = new Map<number, AnimationResult>();
    for (const item of parsed) {
      resultMap.set(item.chunk_index, item);
    }

    const results: AnimationResult[] = scenes.map((s) => {
      const found = resultMap.get(s.chunk_index);
      return {
        chunk_index: s.chunk_index,
        animation_prompt: found?.animation_prompt || "",
        camera_movement: found?.camera_movement || "",
        suggested_transition: found?.suggested_transition || "Cut",
      };
    });

    return NextResponse.json({ prompts: results });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Animation prompt generation failed";

    if (message.includes("429") || message.includes("RATE_LIMIT")) {
      return NextResponse.json(
        { message: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    console.error("[generate-animation-prompts] Error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
