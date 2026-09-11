import { NextResponse } from "next/server";
import { SANDBOX_RUNTIMES } from "@/lib/sandbox";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    connected: Boolean(process.env.SANDBOX_RUNNER_URL),
    runtimes: SANDBOX_RUNTIMES,
  });
}
