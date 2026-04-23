import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

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
  dictionaryLocator?: {
    id?: string;
    version_id?: string;
  } | null;
  previousRequestIds?: string[];
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

  const upstreamPayload: Record<string, unknown> = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: body.settings?.stability ?? 0.5,
      similarity_boost: body.settings?.similarity_boost ?? 0.75,
      style: body.settings?.style ?? 0,
      use_speaker_boost: body.settings?.use_speaker_boost ?? true,
    },
  };

  const locator = body.dictionaryLocator;
  if (locator?.id && locator?.version_id) {
    upstreamPayload.pronunciation_dictionary_locators = [
      {
        pronunciation_dictionary_id: locator.id,
        version_id: locator.version_id,
      },
    ];
  }

  const previousIds = (body.previousRequestIds ?? [])
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .slice(-3);
  if (previousIds.length > 0) {
    upstreamPayload.previous_request_ids = previousIds;
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
        body: JSON.stringify(upstreamPayload),
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
    const requestId =
      upstream.headers.get("request-id") ||
      upstream.headers.get("x-request-id") ||
      "";

    const responseHeaders: Record<string, string> = {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    };
    if (requestId) {
      responseHeaders["x-elevenlabs-request-id"] = requestId;
      responseHeaders["Access-Control-Expose-Headers"] =
        "x-elevenlabs-request-id";
    }

    return new Response(audio, {
      status: 200,
      headers: responseHeaders,
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
