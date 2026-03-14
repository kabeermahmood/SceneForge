import { NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { scriptText, currentDescription, characterBible, userGuidance, apiKey, model } =
      await request.json();
    const textModel = typeof model === "string" && model ? model : "gemini-2.5-flash";

    if (!scriptText || !characterBible || !apiKey) {
      return NextResponse.json(
        { message: "Missing required fields: scriptText, characterBible, apiKey" },
        { status: 400 }
      );
    }

    const client = getGeminiClient(apiKey);

    const characterSummary = characterBible.characters
      .map(
        (c: { name: string; appearance: string; type: string }) =>
          `${c.name} (${c.type}): ${c.appearance}`
      )
      .join("\n");

    const guidanceBlock = userGuidance?.trim()
      ? `\nThe user has specific guidance for improving this description:\n"${userGuidance.trim()}"\nIncorporate their feedback while keeping the description visually rich and detailed.\n`
      : "";

    const previousBlock = currentDescription?.trim()
      ? `\nThe current description (which needs improvement) is:\n"${currentDescription.trim()}"\nWrite a COMPLETELY NEW description — do not copy phrases from the old one.\n`
      : "";

    const prompt = `You are an expert animation scene director. Write a vivid, detailed VISUAL description (60-90 words) for a single scene in an animated YouTube video.

This description will be used to generate ONE image — a single frame/screenshot from the animation. Focus ONLY on what the viewer sees:
- Setting/location details (background, objects, lighting, time of day)
- Which characters are present and their exact positions
- Character body language, facial expressions, actions
- Camera angle/framing (close-up, wide shot, over-the-shoulder, etc.)
- Mood conveyed through colors and lighting

DO NOT include dialogue, speech bubbles, sound effects, or any text.

=== CHARACTERS ===
${characterSummary}

=== PRIMARY SETTING ===
${characterBible.primary_setting}
${previousBlock}${guidanceBlock}
=== SCRIPT TEXT FOR THIS SCENE ===
${scriptText}

Return ONLY the scene description as plain text. No JSON, no markdown, no labels. Just the 60-90 word visual description.`;

    const result = await client.models.generateContent({
      model: textModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const description = (result.text || "").trim();

    if (!description || description.length < 20) {
      return NextResponse.json(
        { message: "AI returned an empty or unusable description" },
        { status: 500 }
      );
    }

    return NextResponse.json({ description });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to regenerate description";
    console.error("[regenerate-description]", message);

    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { message: "Rate limited — please wait a moment and try again" },
        { status: 429 }
      );
    }

    return NextResponse.json({ message }, { status: 500 });
  }
}
