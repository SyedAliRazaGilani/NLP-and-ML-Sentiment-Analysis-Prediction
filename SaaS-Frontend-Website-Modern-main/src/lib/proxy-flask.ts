import { NextResponse } from "next/server";

const FLASK_BASE = process.env.FLASK_BASE_URL || "http://127.0.0.1:5000";

/** Ensures the client always gets JSON (never empty body with Content-Type: json). */
export function jsonProxyResponse(upstream: Response, bodyText: string) {
  const trimmed = bodyText.trim();
  if (!trimmed) {
    return NextResponse.json(
      {
        error: `Backend returned empty response (HTTP ${upstream.status}). Start the Flask API (e.g. python -m flask --app api run --host 127.0.0.1 --port 5000) or set FLASK_BASE_URL.`,
      },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  }
  try {
    JSON.parse(trimmed);
  } catch {
    return NextResponse.json(
      {
        error: `Backend returned non-JSON (HTTP ${upstream.status}). ${trimmed.slice(0, 240)}`,
      },
      { status: 502 }
    );
  }
  return new NextResponse(trimmed, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export { FLASK_BASE };
