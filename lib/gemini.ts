import { GoogleGenAI } from "@google/genai";

export function getGeminiClient(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key is required");
  return new GoogleGenAI({ apiKey: key });
}

export interface TextGenOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 3000;
const MAX_TOKEN_CEILING = 131072;

function getModelTokenBudget(model: string, requested?: number): number {
  if (requested) return requested;
  if (model.includes("2.5-pro")) return 65536;
  if (model.includes("2.5-flash")) return 16384;
  return 8192;
}

export async function geminiTextToJSON<T>(
  prompt: string,
  apiKey?: string,
  model: string = "gemini-2.5-flash",
  options?: TextGenOptions
): Promise<T> {
  const genAI = getGeminiClient(apiKey);

  const config: Record<string, unknown> = {};
  config.maxOutputTokens = getModelTokenBudget(model, options?.maxOutputTokens);
  if (options?.temperature !== undefined) config.temperature = options.temperature;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await genAI.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config,
      });

      const candidate = result.candidates?.[0];
      const finishReason = candidate?.finishReason as string | undefined;

      if (finishReason === "SAFETY" || finishReason === "BLOCKED") {
        throw new Error(`Response blocked by safety filters (${finishReason}). Try rephrasing the script.`);
      }

      if (finishReason === "MAX_TOKENS") {
        const currentMax = (config.maxOutputTokens as number) || 8192;
        const nextMax = Math.min(currentMax * 2, MAX_TOKEN_CEILING);
        config.maxOutputTokens = nextMax;
        console.warn(`[gemini] MAX_TOKENS hit (budget was ${currentMax}) — increasing to ${nextMax} for next attempt`);
        throw new Error(`Gemini output truncated (finishReason: MAX_TOKENS, budget: ${currentMax}). Doubling token budget.`);
      }

      const text = result.text || "";
      if (!text.trim()) {
        const reason = finishReason ? ` (finishReason: ${finishReason})` : "";
        throw new Error(`Gemini returned an empty response${reason}. The model may be overloaded — retrying.`);
      }

      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      if (!cleaned) {
        throw new Error("Gemini response contained only markdown fences with no JSON content.");
      }

      try {
        return JSON.parse(cleaned) as T;
      } catch (parseErr) {
        const preview = cleaned.length > 200 ? cleaned.slice(0, 200) + "..." : cleaned;
        throw new Error(`Invalid JSON from Gemini (${(parseErr as Error).message}). Response preview: ${preview}`);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[gemini] Attempt ${attempt}/${MAX_RETRIES} failed (model: ${model}): ${lastError.message}`);

      const isSafetyBlock = lastError.message.includes("blocked by safety");
      if (isSafetyBlock) throw lastError;

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * attempt;
        console.log(`[gemini] Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("geminiTextToJSON failed after all retries");
}
