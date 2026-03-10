import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { scenePrompts, apiKey, model } = await request.json();

    if (!Array.isArray(scenePrompts) || scenePrompts.length === 0) {
      return NextResponse.json(
        { error: "invalid_input", message: "scenePrompts array is required", retryable: false },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "missing_api_key", message: "Gemini API key is required", retryable: false },
        { status: 400 }
      );
    }

    const selectedModel = model && typeof model === "string" ? model : "gemini-2.5-flash-image";
    const genAI = getGeminiClient(apiKey);

    const inlinedRequests = scenePrompts.map(
      (sp: { key: string; prompt: string }) => ({
        contents: [{ role: "user" as const, parts: [{ text: sp.prompt }] }],
        config: {
          responseModalities: ["image", "text"],
        },
        metadata: { key: sp.key },
      })
    );

    console.log(
      `[SceneForge] BATCH API — Model: ${selectedModel}, Scenes: ${scenePrompts.length}, Est. cost: ~$${(scenePrompts.length * 0.0195).toFixed(3)}`
    );

    const batchJob = await genAI.batches.create({
      model: selectedModel,
      src: inlinedRequests,
    });

    console.log(
      `[SceneForge] BATCH API — Job: ${batchJob.name}, State: ${batchJob.state}`
    );

    return NextResponse.json({
      jobName: batchJob.name,
      state: batchJob.state,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Batch creation failed";
    console.error("[SceneForge] BATCH API — Error:", message);
    return NextResponse.json(
      { error: "batch_failed", message, retryable: true },
      { status: 500 }
    );
  }
}
