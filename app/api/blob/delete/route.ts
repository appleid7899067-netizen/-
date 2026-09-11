import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

const ATTACHMENT_PATH = /^silelo\/attachments\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+-[a-zA-Z0-9._-]+$/;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { pathname?: unknown } | null;
  const pathname = typeof body?.pathname === "string" ? body.pathname : "";
  if (!ATTACHMENT_PATH.test(pathname) || pathname.includes("..")) {
    return NextResponse.json({ error: "ไฟล์ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    await del(pathname);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[v0] Blob delete error", error);
    return NextResponse.json({ error: "ลบไฟล์ไม่สำเร็จ" }, { status: 500 });
  }
}
