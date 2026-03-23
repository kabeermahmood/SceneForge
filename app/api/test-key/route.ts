import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();

    if (!apiKey || !provider) {
      return NextResponse.json(
        { valid: false, error: "Provider and API key required." },
        { status: 400 }
      );
    }

    if (provider === "gemini") {
      const genAI = getGeminiClient(apiKey);
      const result = await genAI.models.list();
      let count = 0;
      for await (const _ of result) {
        count++;
        if (count >= 1) break;
      }
      return NextResponse.json({ valid: true, message: `Connected — ${count > 0 ? "models available" : "no models found"}` });
    }

    if (provider === "deepgram") {
      const res = await fetch("https://api.deepgram.com/v1/projects", {
        headers: { Authorization: `Token ${apiKey}` },
      });
      if (res.ok) {
        return NextResponse.json({ valid: true, message: "Connected — key is valid" });
      }
      const err = await res.text();
      return NextResponse.json({ valid: false, error: `Deepgram returned ${res.status}: ${err}` });
    }

    return NextResponse.json(
      { valid: false, error: `Unknown provider: ${provider}` },
      { status: 400 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : "Test failed" },
      { status: 500 }
    );
  }
}
