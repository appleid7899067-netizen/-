import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const gatewayUrl = process.env.ROOM_GATEWAY_URL ?? process.env.API_URL ?? null;
  const sandboxUrl = process.env.SANDBOX_RUNNER_URL ?? null;

  return NextResponse.json({
    gatewayUrl,
    sandboxConfigured: Boolean(sandboxUrl),
    liveModel: "puter",
  });
}
