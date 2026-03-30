import { jsonProxyResponse, FLASK_BASE } from "@/lib/proxy-flask";

export async function POST(req: Request) {
  const body = await req.text();
  const upstream = await fetch(`${FLASK_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await upstream.text();
  return jsonProxyResponse(upstream, text);
}

