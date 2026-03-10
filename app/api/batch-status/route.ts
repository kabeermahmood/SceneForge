import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { jobName, apiKey } = await request.json();

    if (!jobName || typeof jobName !== "string") {
      return NextResponse.json(
        { error: "invalid_input", message: "jobName is required", retryable: false },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "missing_api_key", message: "Gemini API key is required", retryable: false },
        { status: 400 }
      );
    }

    const genAI = getGeminiClient(apiKey);
    const job = await genAI.batches.get({ name: jobName });

    console.log(`[SceneForge] Poll — Job: ${jobName}, State: ${job.state}`);

    if (job.state === "JOB_STATE_SUCCEEDED" || job.state === "JOB_STATE_PARTIALLY_SUCCEEDED") {
      const images: { key: string; image_base64: string; mime_type: string }[] = [];
      let succeeded = 0;
      let failed = 0;

      if (job.dest?.inlinedResponses) {
        for (let i = 0; i < job.dest.inlinedResponses.length; i++) {
          const inlined = job.dest.inlinedResponses[i];
          const key = `scene-${String(i + 1).padStart(2, "0")}`;
          let foundImage = false;

          if (inlined.response?.candidates?.[0]?.content?.parts) {
            for (const part of inlined.response.candidates[0].content.parts) {
              if (part.inlineData?.data) {
                images.push({
                  key,
                  image_base64: part.inlineData.data,
                  mime_type: part.inlineData.mimeType || "image/png",
                });
                foundImage = true;
                succeeded++;
                break;
              }
            }
          }

          if (!foundImage) {
            failed++;
            images.push({ key, image_base64: "", mime_type: "" });
          }
        }
      }

      console.log(
        `[SceneForge] BATCH COMPLETE — ${succeeded}/${succeeded + failed} images`
      );

      return NextResponse.json({
        status: "complete",
        state: job.state,
        images,
        succeeded,
        failed,
      });
    }

    if (job.state === "JOB_STATE_FAILED") {
      return NextResponse.json({
        status: "failed",
        state: job.state,
        error: job.error?.message || "Batch job failed",
      });
    }

    if (job.state === "JOB_STATE_CANCELLED") {
      return NextResponse.json({
        status: "cancelled",
        state: job.state,
      });
    }

    // Still processing (QUEUED, PENDING, RUNNING)
    return NextResponse.json({
      status: "processing",
      state: job.state,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to check batch status";
    console.error("[SceneForge] Batch status error:", message);
    return NextResponse.json(
      { error: "status_check_failed", message, retryable: true },
      { status: 500 }
    );
  }
}
