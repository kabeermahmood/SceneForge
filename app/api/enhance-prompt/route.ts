import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an expert AI image-prompt engineer. The user will give you a rough idea for an image. Your job is to rewrite it into a detailed, professional image-generation prompt that produces stunning results.

Rules:
- Output ONLY the enhanced prompt text, nothing else — no quotes, no preamble, no explanation.
- Keep it under 300 words.
- Include specific details: lighting, composition, color palette, mood, camera angle, texture, style.
- Preserve the user's core intent — do not change the subject matter.
- Use vivid, concrete descriptors rather than vague adjectives.
- End with technical quality keywords (e.g. "high resolution, sharp detail, professional photography").`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const key = apiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Gemini API key is required. Add it in the API Keys page." },
        { status: 401 }
      );
    }

    const genAI = getGeminiClient(key);

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nUser's rough idea:\n${prompt.trim()}` }] },
      ],
      config: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const enhanced = response.text?.trim();

    if (!enhanced) {
      throw new Error("Gemini returned an empty response. Try again.");
    }

    return NextResponse.json({ enhanced });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Prompt enhancement failed";
    console.error("[enhance-prompt] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
