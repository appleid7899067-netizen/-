import { NextResponse } from "next/server";
import { getFreeModels } from "@/lib/openrouter/router";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await getFreeModels();
    return NextResponse.json({ models });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch models" },
      { status: 502 }
    );
  }
}
