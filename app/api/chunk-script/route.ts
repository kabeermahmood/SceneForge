import { NextRequest, NextResponse } from "next/server";
import { geminiTextToJSON } from "@/lib/gemini";
import {
  buildChunkingPrompt,
  buildActsPrompt,
  buildActChunkingPrompt,
  buildSceneDescriptionPrompt,
} from "@/lib/prompts";
import type { CharacterBible } from "@/lib/types";

export const maxDuration = 300;

interface TextChunk {
  chunk_index: number;
  script_text: string;
}

interface TextChunkResponse {
  scenes: TextChunk[];
}

interface SceneChunk {
  chunk_index: number;
  script_text: string;
  scene_description: string;
  scene_emotion: string;
  characters_present: string[];
}

interface DescriptionResponse {
  scene_description: string;
  scene_emotion: string;
  characters_present: string[];
}

interface ActData {
  act_index: number;
  act_title: string;
  script_text: string;
  scene_count: number;
}

interface ActResponse {
  acts: ActData[];
}

const HIERARCHICAL_THRESHOLD = 20;
const DESCRIPTION_CONCURRENCY = 3;
const MAX_SCENES_PER_ACT = 8;
const MAX_ACTS = 12;

export async function POST(request: NextRequest) {
  try {
    const { script, chunksCount, apiKey, model, characterBible } = await request.json();
    const textModel = typeof model === "string" && model ? model : "gemini-2.5-flash";

    if (!script || typeof script !== "string" || script.length < 100) {
      return NextResponse.json(
        { error: "invalid_input", message: "Script must be at least 100 characters", retryable: false },
        { status: 400 }
      );
    }

    if (!chunksCount || typeof chunksCount !== "number" || chunksCount < 4) {
      return NextResponse.json(
        { error: "invalid_input", message: "chunksCount must be a number >= 4", retryable: false },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "missing_api_key", message: "Gemini API key is required", retryable: false },
        { status: 400 }
      );
    }

    const bible: CharacterBible | null = characterBible || null;

    let textChunks: TextChunk[];

    if (chunksCount <= HIERARCHICAL_THRESHOLD) {
      console.log(`[chunk-script] Simple mode — ${chunksCount} scenes, model: ${textModel}`);
      textChunks = await splitText(script, chunksCount, apiKey, textModel);
    } else {
      const actCount = Math.min(Math.ceil(chunksCount / MAX_SCENES_PER_ACT), MAX_ACTS);
      console.log(`[chunk-script] Hierarchical mode — ${chunksCount} scenes across ${actCount} acts, model: ${textModel}`);
      textChunks = await hierarchicalSplit(script, chunksCount, actCount, apiKey, textModel);
    }

    console.log(`[chunk-script] Text split complete — ${textChunks.length} chunks. Generating descriptions...`);

    const allScenes = await enrichWithDescriptions(
      textChunks,
      textChunks.length,
      bible,
      apiKey,
      textModel
    );

    return NextResponse.json({ scenes: allScenes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Script chunking failed";
    console.error("[chunk-script] Fatal error:", message);
    return NextResponse.json(
      { error: "chunking_failed", message, retryable: true },
      { status: 500 }
    );
  }
}

async function splitText(
  script: string,
  chunksCount: number,
  apiKey: string,
  textModel: string
): Promise<TextChunk[]> {
  const prompt = buildChunkingPrompt(script, chunksCount);

  let data = await geminiTextToJSON<TextChunkResponse>(prompt, apiKey, textModel, {
    temperature: 0.3,
  });

  if (data.scenes.length !== chunksCount) {
    console.log(`[chunk-script] Got ${data.scenes.length} chunks instead of ${chunksCount}, retrying with emphasis...`);
    const retryPrompt = `${prompt}\n\nIMPORTANT: You returned ${data.scenes.length} chunks but I need exactly ${chunksCount}. Please try again with exactly ${chunksCount} chunks.`;
    data = await geminiTextToJSON<TextChunkResponse>(retryPrompt, apiKey, textModel, {
      temperature: 0.2,
    });
  }

  return data.scenes;
}

async function splitActChunks(
  actText: string,
  sceneCount: number,
  startIndex: number,
  actTitle: string,
  previousActSummary: string | undefined,
  apiKey: string,
  textModel: string
): Promise<TextChunk[]> {
  const actPrompt = buildActChunkingPrompt(
    actText,
    sceneCount,
    startIndex,
    actTitle,
    previousActSummary
  );

  try {
    const actChunks = await geminiTextToJSON<TextChunkResponse>(actPrompt, apiKey, textModel, {
      temperature: 0.3,
    });

    for (let i = 0; i < actChunks.scenes.length; i++) {
      actChunks.scenes[i].chunk_index = startIndex + i;
    }
    return actChunks.scenes;
  } catch (err) {
    const isMaxTokens = err instanceof Error && (
      err.message.includes("MAX_TOKENS") || err.message.includes("output truncated")
    );

    if (isMaxTokens && sceneCount > 4) {
      console.log(`[chunk-script] Act "${actTitle}" too large (${sceneCount} scenes) — sub-splitting into halves`);

      const sentences = actText.match(/[^.!?]+[.!?]+/g) || [actText];
      const midSentence = Math.ceil(sentences.length / 2);
      const firstHalf = sentences.slice(0, midSentence).join("").trim();
      const secondHalf = sentences.slice(midSentence).join("").trim();

      const firstCount = Math.ceil(sceneCount / 2);
      const secondCount = sceneCount - firstCount;

      const firstChunks = await splitActChunks(
        firstHalf, firstCount, startIndex,
        `${actTitle} (Part 1)`, previousActSummary,
        apiKey, textModel
      );

      const secondStart = startIndex + firstChunks.length;
      const secondChunks = await splitActChunks(
        secondHalf, secondCount, secondStart,
        `${actTitle} (Part 2)`, previousActSummary,
        apiKey, textModel
      );

      return [...firstChunks, ...secondChunks];
    }

    throw err;
  }
}

async function hierarchicalSplit(
  script: string,
  totalScenes: number,
  actCount: number,
  apiKey: string,
  textModel: string
): Promise<TextChunk[]> {
  const actsPrompt = buildActsPrompt(script, actCount, totalScenes);

  const actsData = await geminiTextToJSON<ActResponse>(actsPrompt, apiKey, textModel, {
    temperature: 0.3,
  });

  const acts = actsData.acts;
  console.log(
    `[chunk-script] Got ${acts.length} acts: ${acts.map((a) => `"${a.act_title}" (${a.scene_count} scenes)`).join(", ")}`
  );

  const sceneSum = acts.reduce((sum, a) => sum + a.scene_count, 0);
  if (sceneSum !== totalScenes) {
    console.log(`[chunk-script] Act scene counts sum to ${sceneSum}, expected ${totalScenes}. Redistributing.`);
    redistributeSceneCounts(acts, totalScenes);
  }

  enforcePerActCap(acts, totalScenes);

  const allChunks: TextChunk[] = [];
  let runningIndex = 1;
  let previousActSummary = "";

  for (const act of acts) {
    if (act.scene_count <= 0) continue;

    console.log(`[chunk-script] Splitting act "${act.act_title}" → ${act.scene_count} chunks (starting at index ${runningIndex})`);

    const chunks = await splitActChunks(
      act.script_text,
      act.scene_count,
      runningIndex,
      act.act_title,
      previousActSummary || undefined,
      apiKey,
      textModel
    );

    allChunks.push(...chunks);
    runningIndex += chunks.length;

    const actWords = act.script_text.split(/\s+/).length;
    previousActSummary += `Act "${act.act_title}" (${actWords} words, ${act.scene_count} scenes): ${act.script_text.slice(0, 150).trim()}...\n`;
  }

  console.log(`[chunk-script] Hierarchical split complete — ${allChunks.length} total chunks`);
  return allChunks;
}

async function enrichWithDescriptions(
  chunks: TextChunk[],
  totalScenes: number,
  bible: CharacterBible | null,
  apiKey: string,
  textModel: string
): Promise<SceneChunk[]> {
  const validNames = new Set(
    (bible?.characters || []).map((c) => c.name.toLowerCase())
  );

  const results: SceneChunk[] = chunks.map((c) => ({
    chunk_index: c.chunk_index,
    script_text: c.script_text,
    scene_description: "",
    scene_emotion: "",
    characters_present: [],
  }));

  for (let i = 0; i < chunks.length; i += DESCRIPTION_CONCURRENCY) {
    const batch = chunks.slice(i, i + DESCRIPTION_CONCURRENCY);

    const promises = batch.map(async (chunk, batchIdx) => {
      const idx = i + batchIdx;

      const neighborContext = {
        prev: chunks[idx - 1]?.script_text,
        next: chunks[idx + 1]?.script_text,
      };

      const prompt = buildSceneDescriptionPrompt(
        chunk.script_text,
        chunk.chunk_index,
        totalScenes,
        bible,
        neighborContext
      );

      const desc = await geminiTextToJSON<DescriptionResponse>(prompt, apiKey, textModel, {
        maxOutputTokens: 1024,
        temperature: 0.3,
      });

      results[idx].scene_description = desc.scene_description;
      results[idx].scene_emotion = desc.scene_emotion;

      const sanitized = (desc.characters_present || []).filter(
        (name) => name.toLowerCase() === "none" || validNames.has(name.toLowerCase())
      );
      results[idx].characters_present = sanitized.length > 0 ? sanitized : ["none"];
    });

    await Promise.all(promises);
    console.log(`[chunk-script] Descriptions generated: ${Math.min(i + DESCRIPTION_CONCURRENCY, chunks.length)}/${chunks.length}`);
  }

  return results;
}

function redistributeSceneCounts(
  acts: { scene_count: number; script_text?: string }[],
  totalScenes: number
) {
  const totalWords = acts.reduce(
    (sum, a) => sum + (a.script_text ? a.script_text.split(/\s+/).length : 1),
    0
  );

  let assigned = 0;
  for (let i = 0; i < acts.length; i++) {
    const words = acts[i].script_text ? acts[i].script_text!.split(/\s+/).length : 1;
    if (i === acts.length - 1) {
      acts[i].scene_count = totalScenes - assigned;
    } else {
      acts[i].scene_count = Math.max(1, Math.round((words / totalWords) * totalScenes));
      assigned += acts[i].scene_count;
    }
  }
}

function enforcePerActCap(acts: ActData[], totalScenes: number) {
  const cap = MAX_SCENES_PER_ACT + 2;
  let overflow = 0;

  for (const act of acts) {
    if (act.scene_count > cap) {
      overflow += act.scene_count - cap;
      act.scene_count = cap;
    }
  }

  if (overflow > 0) {
    const underCap = acts.filter((a) => a.scene_count < cap);
    for (const act of underCap) {
      if (overflow <= 0) break;
      const room = cap - act.scene_count;
      const add = Math.min(room, overflow);
      act.scene_count += add;
      overflow -= add;
    }

    const currentSum = acts.reduce((s, a) => s + a.scene_count, 0);
    if (currentSum !== totalScenes) {
      const diff = totalScenes - currentSum;
      acts[acts.length - 1].scene_count += diff;
    }

    console.log(`[chunk-script] Enforced per-act cap of ${cap}: ${acts.map((a) => a.scene_count).join(", ")}`);
  }
}
