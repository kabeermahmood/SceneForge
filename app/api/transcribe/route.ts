import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface TranscribeResponse {
  transcript: string;
  words: { word: string; start: number; end: number; confidence: number }[];
}

export async function POST(req: NextRequest) {
  try {
    const apiKey =
      req.headers.get("x-deepgram-key") || process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Deepgram API key not configured. Set DEEPGRAM_API_KEY in .env or provide it in the UI." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "en-GB";
    const model = (formData.get("model") as string) || "nova-2";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const deepgramUrl = new URL("https://api.deepgram.com/v1/listen");
    deepgramUrl.searchParams.set("model", model);
    deepgramUrl.searchParams.set("language", language);
    deepgramUrl.searchParams.set("punctuate", "false");
    deepgramUrl.searchParams.set("utterances", "false");

    const dgResponse = await fetch(deepgramUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": audioFile.type || "audio/mpeg",
      },
      body: audioBuffer,
    });

    if (!dgResponse.ok) {
      const errText = await dgResponse.text();
      console.error("[transcribe] Deepgram error:", dgResponse.status, errText);
      return NextResponse.json(
        { error: `Deepgram API error (${dgResponse.status}): ${errText}` },
        { status: dgResponse.status }
      );
    }

    const dgData = await dgResponse.json();

    const alt = dgData?.results?.channels?.[0]?.alternatives?.[0];
    if (!alt) {
      return NextResponse.json(
        { error: "No transcription results returned from Deepgram." },
        { status: 502 }
      );
    }

    const result: TranscribeResponse = {
      transcript: alt.transcript ?? "",
      words: (alt.words ?? []).map((w: DeepgramWord) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
      })),
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[transcribe] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
