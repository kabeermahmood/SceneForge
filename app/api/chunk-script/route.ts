import { NextRequest, NextResponse } from "next/server";
import { geminiTextToJSON } from "@/lib/gemini";
import {
  buildChunkingPrompt,
  buildActsPrompt,
  buildActChunkingPrompt,
} from "@/lib/prompts";

interface SceneChunk {
  chunk_index: number;
  script_text: string;
  scene_description: string;
  scene_emotion: string;
  characters_present: string[];
}

interface ChunkResponse {
  scenes: SceneChunk[];
}

interface ActResponse {
  acts: {
    act_index: number;
    act_title: string;
    script_text: string;
    scene_count: number;
  }[];
}

const HIERARCHICAL_THRESHOLD = 20;

export async function POST(request: NextRequest) {
  try {
    const { script, chunksCount, apiKey, model } = await request.json();
    const textModel = typeof model === "string" && model ? model : "gemini-2.5-flash";

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

    let allScenes: SceneChunk[];

    if (chunksCount <= HIERARCHICAL_THRESHOLD) {
      // ── SIMPLE MODE: single-call chunking (≤20 scenes) ──
      console.log(`[chunk-script] Simple mode — ${chunksCount} scenes, model: ${textModel}`);
      allScenes = await simpleChunk(script, chunksCount, apiKey, textModel);
    } else {
      // ── HIERARCHICAL MODE: acts → scenes (>20 scenes) ──
      const actCount = Math.min(Math.ceil(chunksCount / 15), 8);
      console.log(
        `[chunk-script] Hierarchical mode — ${chunksCount} scenes across ${actCount} acts, model: ${textModel}`
      );
      allScenes = await hierarchicalChunk(
        script,
        chunksCount,
        actCount,
        apiKey,
        textModel
      );
    }

    return NextResponse.json({ scenes: allScenes });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Script chunking failed";
    return NextResponse.json(
      { error: "chunking_failed", message, retryable: true },
      { status: 500 }
    );
  }
}

async function simpleChunk(
  script: string,
  chunksCount: number,
  apiKey: string,
  textModel: string
): Promise<SceneChunk[]> {
  const prompt = buildChunkingPrompt(script, chunksCount);
  let data: ChunkResponse;

  try {
    data = await geminiTextToJSON<ChunkResponse>(prompt, apiKey, textModel);
  } catch {
    data = await geminiTextToJSON<ChunkResponse>(prompt, apiKey, textModel);
  }

  if (data.scenes.length !== chunksCount) {
    const retryPrompt = `${prompt}\n\nIMPORTANT: You returned ${data.scenes.length} chunks but I need exactly ${chunksCount}. Please try again with exactly ${chunksCount} chunks.`;
    data = await geminiTextToJSON<ChunkResponse>(retryPrompt, apiKey, textModel);
  }

  return data.scenes;
}

async function hierarchicalChunk(
  script: string,
  totalScenes: number,
  actCount: number,
  apiKey: string,
  textModel: string
): Promise<SceneChunk[]> {
  // Phase 1: Split into acts
  const actsPrompt = buildActsPrompt(script, actCount, totalScenes);
  let actsData: ActResponse;

  try {
    actsData = await geminiTextToJSON<ActResponse>(actsPrompt, apiKey, textModel);
  } catch {
    actsData = await geminiTextToJSON<ActResponse>(actsPrompt, apiKey, textModel);
  }

  const acts = actsData.acts;
  console.log(
    `[chunk-script] Got ${acts.length} acts: ${acts.map((a) => `"${a.act_title}" (${a.scene_count} scenes)`).join(", ")}`
  );

  // Validate scene_count sum matches totalScenes
  const sceneSum = acts.reduce((sum, a) => sum + a.scene_count, 0);
  if (sceneSum !== totalScenes) {
    console.log(
      `[chunk-script] Act scene counts sum to ${sceneSum}, expected ${totalScenes}. Redistributing.`
    );
    redistributeSceneCounts(acts, totalScenes);
  }

  // Phase 2: Chunk each act into its scenes (sequentially to avoid rate limits)
  const allScenes: SceneChunk[] = [];
  let runningIndex = 1;

  for (const act of acts) {
    if (act.scene_count <= 0) continue;

    console.log(
      `[chunk-script] Chunking act "${act.act_title}" → ${act.scene_count} scenes (starting at index ${runningIndex})`
    );

    const actPrompt = buildActChunkingPrompt(
      act.script_text,
      act.scene_count,
      runningIndex,
      act.act_title
    );

    let actScenes: ChunkResponse;
    try {
      actScenes = await geminiTextToJSON<ChunkResponse>(actPrompt, apiKey, textModel);
    } catch {
      actScenes = await geminiTextToJSON<ChunkResponse>(actPrompt, apiKey, textModel);
    }

    // Normalize chunk_index to ensure strict sequential ordering
    for (let i = 0; i < actScenes.scenes.length; i++) {
      actScenes.scenes[i].chunk_index = runningIndex + i;
    }

    allScenes.push(...actScenes.scenes);
    runningIndex += actScenes.scenes.length;
  }

  console.log(
    `[chunk-script] Hierarchical chunking complete — ${allScenes.length} total scenes`
  );
  return allScenes;
}

function redistributeSceneCounts(
  acts: { scene_count: number }[],
  totalScenes: number
) {
  const totalWords = acts.reduce(
    (sum, a) =>
      sum +
      ("script_text" in a
        ? (a as { script_text: string }).script_text.split(/\s+/).length
        : 1),
    0
  );

  let assigned = 0;
  for (let i = 0; i < acts.length; i++) {
    const words =
      "script_text" in acts[i]
        ? (acts[i] as unknown as { script_text: string }).script_text.split(
            /\s+/
          ).length
        : 1;
    if (i === acts.length - 1) {
      acts[i].scene_count = totalScenes - assigned;
    } else {
      acts[i].scene_count = Math.max(
        1,
        Math.round((words / totalWords) * totalScenes)
      );
      assigned += acts[i].scene_count;
    }
  }
}
