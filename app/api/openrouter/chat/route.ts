import { NextResponse } from "next/server";
import {
  isAgentMessage,
  withAgentProfile,
} from "@/lib/agent-profile";
import { chatWithEightFallback, getFreeModels } from "@/lib/openrouter/router";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY ยังไม่ได้ตั้งค่า" },
      { status: 500 }
    );
  }

  let body: { messages?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages ต้องเป็น array ที่ไม่ว่าง" },
      { status: 400 }
    );
  }

  const clientMessages = body.messages.filter(isAgentMessage);
  if (clientMessages.length !== body.messages.length) {
    return NextResponse.json(
      { error: "messages มีรูปแบบไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const agentMessages = withAgentProfile(clientMessages);

  try {
    const freeModels = await getFreeModels();
    const candidates = freeModels.map((m) => m.id).slice(0, 8);
    const result = await chatWithEightFallback(agentMessages, {
      apiKey,
      candidates,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 502 }
    );
  }
}
