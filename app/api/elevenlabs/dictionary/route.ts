import { NextRequest, NextResponse } from "next/server";

interface IncomingRule {
  from?: string;
  to?: string;
}

interface DictBody {
  rules?: IncomingRule[];
  name?: string;
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

  let body: DictBody;
  try {
    body = (await req.json()) as DictBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const rules = (body.rules ?? [])
    .map((r) => ({
      from: (r.from || "").trim(),
      to: (r.to || "").trim(),
    }))
    .filter((r) => r.from.length > 0 && r.to.length > 0);

  if (rules.length === 0) {
    return NextResponse.json(
      {
        error: "no_rules",
        message: "At least one valid rule is required.",
      },
      { status: 400 }
    );
  }

  const dictName =
    body.name?.trim() || `voicestudio_${Date.now().toString(36)}`;

  try {
    const upstream = await fetch(
      "https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-rules",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: dictName,
          rules: rules.map((r) => ({
            type: "alias",
            string_to_replace: r.from,
            alias: r.to,
          })),
        }),
      }
    );

    const text = await upstream.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!upstream.ok) {
      const detail =
        (data as { detail?: { message?: string; status?: string } })?.detail;
      return NextResponse.json(
        {
          error: detail?.status || "elevenlabs_error",
          message:
            detail?.message ||
            (typeof data === "string" ? data : null) ||
            `ElevenLabs returned status ${upstream.status}`,
        },
        { status: upstream.status }
      );
    }

    const parsed = data as { id?: string; version_id?: string };
    if (!parsed?.id || !parsed?.version_id) {
      return NextResponse.json(
        {
          error: "invalid_response",
          message: "ElevenLabs response did not include id and version_id.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      id: parsed.id,
      version_id: parsed.version_id,
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
