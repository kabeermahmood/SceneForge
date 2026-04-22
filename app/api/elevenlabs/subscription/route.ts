import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

  try {
    const upstream = await fetch(
      "https://api.elevenlabs.io/v1/user/subscription",
      {
        headers: { "xi-api-key": apiKey },
        cache: "no-store",
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      return NextResponse.json(
        {
          error: "elevenlabs_error",
          message:
            errText || `ElevenLabs returned status ${upstream.status}`,
        },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
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
