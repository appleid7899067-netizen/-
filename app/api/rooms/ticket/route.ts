import { NextResponse } from "next/server";

const ROOM_IDS = new Set(["sli", "work", "lab"]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    roomId?: unknown;
  } | null;
  const roomId = typeof body?.roomId === "string" ? body.roomId : "";

  if (!ROOM_IDS.has(roomId)) {
    return NextResponse.json({ error: "ห้องไม่ถูกต้อง" }, { status: 400 });
  }

  const gatewayUrl = process.env.ROOM_GATEWAY_URL ?? process.env.API_URL;
  if (!gatewayUrl) {
    return NextResponse.json(
      { error: "ยังไม่ได้เชื่อมต่อ room gateway" },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(
      `${gatewayUrl.replace(/\/$/, "")}/v1/rooms/${roomId}/ticket`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-silelo-gateway-secret": process.env.ROOM_GATEWAY_SHARED_SECRET ?? "",
        },
        body: JSON.stringify({ roomId }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const responseBody = await upstream.json().catch(() => ({ error: "gateway error" }));
    return NextResponse.json(responseBody, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถเชื่อมต่อ room gateway ได้" },
      { status: 502 },
    );
  }
}
