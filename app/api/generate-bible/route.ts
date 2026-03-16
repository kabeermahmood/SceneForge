import { NextRequest, NextResponse } from "next/server";
import { geminiTextToJSON } from "@/lib/gemini";
import { buildCharacterBiblePrompt } from "@/lib/prompts";
import type { CharacterBible } from "@/lib/types";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const { script, apiKey, model } = await request.json();

    if (!script || typeof script !== "string" || script.length < 100) {
      return NextResponse.json(
        {
          error: "invalid_input",
          message: "Script must be at least 100 characters",
          retryable: false,
        },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        {
          error: "missing_api_key",
          message: "Gemini API key is required",
          retryable: false,
        },
        { status: 400 }
      );
    }

    const prompt = buildCharacterBiblePrompt(script);

    const textModel = typeof model === "string" && model ? model : "gemini-2.5-flash";

    const bible = await geminiTextToJSON<CharacterBible>(prompt, apiKey, textModel, {
      maxOutputTokens: 4096,
      temperature: 0.4,
    });

    for (const character of bible.characters) {
      if (!character.visual_fingerprint) {
        character.visual_fingerprint = "";
      }
    }

    return NextResponse.json(bible);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Character Bible generation failed";
    return NextResponse.json(
      { error: "generation_failed", message, retryable: true },
      { status: 500 }
    );
  }
}
