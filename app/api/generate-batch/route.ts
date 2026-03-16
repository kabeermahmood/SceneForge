import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { scenePrompts, apiKey, model, referenceImage, aspectRatio } = await request.json();
    const imageAspectRatio = typeof aspectRatio === "string" && aspectRatio ? aspectRatio : "16:9";

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

    const hasRef = referenceImage && typeof referenceImage === "object" && referenceImage.data;
    if (hasRef) {
      console.log(
        `[SceneForge] BATCH API — Reference image attached (${Math.round(referenceImage.data.length / 1024)}KB)`
      );
    }

    const inlinedRequests = scenePrompts.map(
      (sp: { key: string; prompt: string }) => {
        const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];

        if (hasRef) {
          parts.push({
            inlineData: {
              mimeType: referenceImage.mimeType || "image/png",
              data: referenceImage.data,
            },
          });
          parts.push({
            text: `[REFERENCE SCREENSHOT ABOVE]: This is Scene 1 from the animated video. Your generated image MUST match this reference exactly — same characters, same art style, same colors, same line weight. Generate a SINGLE fullscreen scene that fills the ENTIRE canvas edge-to-edge. NO borders, NO panels, NO frames, NO margins, NO white space. One continuous scene like a movie screenshot.\n\n${sp.prompt}`,
          });
        } else {
          parts.push({ text: sp.prompt });
        }

        return {
          contents: [{ role: "user" as const, parts }],
          config: {
            responseModalities: ["image", "text"],
            imageConfig: { aspectRatio: imageAspectRatio },
          },
          metadata: { key: sp.key },
        };
      }
    );

    console.log(
      `[SceneForge] BATCH API — Model: ${selectedModel}, Scenes: ${scenePrompts.length}, Ref: ${hasRef ? "yes" : "no"}, Est. cost: ~$${(scenePrompts.length * 0.0195).toFixed(3)}`
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
