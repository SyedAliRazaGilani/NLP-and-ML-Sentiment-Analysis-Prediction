import { NextResponse } from "next/server";

const FLASK_BASE_URL = process.env.FLASK_BASE_URL || "http://127.0.0.1:5000";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const upstream = await fetch(`${FLASK_BASE_URL}/demo/download?id=${encodeURIComponent(id)}`);
  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "text/csv",
      "Content-Disposition": upstream.headers.get("content-disposition") || "attachment; filename=DemoReviews.csv",
    },
  });
}

