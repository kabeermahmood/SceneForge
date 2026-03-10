import { NextRequest, NextResponse } from "next/server";
import { geminiTextToJSON } from "@/lib/gemini";
import { buildChunkingPrompt } from "@/lib/prompts";

interface ChunkResponse {
  scenes: {
    chunk_index: number;
    script_text: string;
    scene_description: string;
    scene_emotion: string;
    characters_present: string[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { script, chunksCount, apiKey } = await request.json();

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

    if (!chunksCount || typeof chunksCount !== "number" || chunksCount < 4) {
      return NextResponse.json(
        {
          error: "invalid_input",
          message: "chunksCount must be a number >= 4",
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

    const prompt = buildChunkingPrompt(script, chunksCount);
    let data: ChunkResponse;

    try {
      data = await geminiTextToJSON<ChunkResponse>(prompt, apiKey);
    } catch {
      data = await geminiTextToJSON<ChunkResponse>(prompt, apiKey);
    }

    if (data.scenes.length !== chunksCount) {
      const retryPrompt = `${prompt}\n\nIMPORTANT: You returned ${data.scenes.length} chunks but I need exactly ${chunksCount}. Please try again with exactly ${chunksCount} chunks.`;
      data = await geminiTextToJSON<ChunkResponse>(retryPrompt, apiKey);
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Script chunking failed";
    return NextResponse.json(
      { error: "chunking_failed", message, retryable: true },
      { status: 500 }
    );
  }
}
