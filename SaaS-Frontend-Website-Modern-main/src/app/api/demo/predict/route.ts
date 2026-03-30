import { jsonProxyResponse, FLASK_BASE } from "@/lib/proxy-flask";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const upstream = await fetch(`${FLASK_BASE}/demo/predict?id=${encodeURIComponent(id || "")}`, {
    method: "POST",
  });
  const text = await upstream.text();
  return jsonProxyResponse(upstream, text);
}

