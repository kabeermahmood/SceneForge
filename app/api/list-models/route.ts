import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 });
    }

    const genAI = getGeminiClient(apiKey);
    const result = await genAI.models.list();

    const models: string[] = [];
    for await (const model of result) {
      if (
        model.name?.includes("flash") ||
        model.name?.includes("image") ||
        model.name?.includes("imagen") ||
        model.name?.includes("banana")
      ) {
        models.push(
          `${model.name} | methods: ${model.supportedActions?.join(", ") || "N/A"}`
        );
      }
    }

    return NextResponse.json({ models: models.sort() });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list models" },
      { status: 500 }
    );
  }
}
