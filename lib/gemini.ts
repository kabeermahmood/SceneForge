import { GoogleGenAI } from "@google/genai";

export function getGeminiClient(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key is required");
  return new GoogleGenAI({ apiKey: key });
}

export async function geminiTextToJSON<T>(
  prompt: string,
  apiKey?: string
): Promise<T> {
  const genAI = getGeminiClient(apiKey);

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = result.text || "";
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleaned) as T;
}
