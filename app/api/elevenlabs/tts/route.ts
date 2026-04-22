import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

interface TTSBody {
  text?: string;
  voiceId?: string;
  modelId?: string;
  settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-elevenlabs-key")?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "missing_api_key",
        message: "ElevenLabs API key is required.",
      },
      { status: 400 }
    );
  }

  let body: TTSBody;
  try {
    body = (await req.json()) as TTSBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const text = body.text?.trim();
  const voiceId = body.voiceId?.trim();
  const modelId = body.modelId?.trim() || "eleven_multilingual_v2";

  if (!text) {
    return NextResponse.json(
      { error: "missing_text", message: "Script text is required." },
      { status: 400 }
    );
  }
  if (!voiceId) {
    return NextResponse.json(
      { error: "missing_voice", message: "A voice must be selected." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
        voiceId
      )}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: body.settings?.stability ?? 0.5,
            similarity_boost: body.settings?.similarity_boost ?? 0.75,
            style: body.settings?.style ?? 0,
            use_speaker_boost: body.settings?.use_speaker_boost ?? true,
          },
        }),
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      let parsed: { detail?: { message?: string; status?: string } } | null =
        null;
      try {
        parsed = JSON.parse(errText);
      } catch {
        parsed = null;
      }
      return NextResponse.json(
        {
          error: parsed?.detail?.status || "elevenlabs_error",
          message:
            parsed?.detail?.message ||
            errText ||
            `ElevenLabs returned status ${upstream.status}`,
        },
        { status: upstream.status }
      );
    }

    const audio = await upstream.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "network_error",
        message:
          err instanceof Error ? err.message : "Failed to reach ElevenLabs.",
      },
      { status: 502 }
    );
  }
}
