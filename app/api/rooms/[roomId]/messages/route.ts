import { NextResponse } from "next/server";

const ROOM_IDS = new Set(["sli", "work", "lab"]);

export const runtime = "nodejs";

function baseUrl() {
  return process.env.ROOM_GATEWAY_URL ?? process.env.API_URL ?? null;
}

async function forward(
  request: Request,
  roomId: string,
  method: "GET" | "POST" | "DELETE",
) {
  const base = baseUrl();
  if (!ROOM_IDS.has(roomId)) {
    return NextResponse.json({ error: "ห้องไม่ถูกต้อง" }, { status: 400 });
  }
  if (!base) {
    return NextResponse.json({ messages: [] }, { status: 200 });
  }

  const headers: HeadersInit = {
    "x-silelo-gateway-secret": process.env.ROOM_GATEWAY_SHARED_SECRET ?? "",
  };
  if (method === "POST") {
    headers["content-type"] = "application/json";
  }

  try {
    const upstream = await fetch(
      `${base.replace(/\/$/, "")}/v1/rooms/${roomId}/messages`,
      {
        method,
        headers,
        body: method === "POST" ? await request.text() : undefined,
        signal: AbortSignal.timeout(10_000),
      },
    );
    const body = await upstream.json().catch(() => ({ error: "gateway error" }));
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถอ่านประวัติห้องได้" },
      { status: 502 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  return forward(request, roomId, "GET");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  return forward(request, roomId, "POST");
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  return forward(request, roomId, "DELETE");
}
