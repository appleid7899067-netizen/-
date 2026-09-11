import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

const ATTACHMENT_PATH = /^silelo\/attachments\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+-[a-zA-Z0-9._-]+$/;

export const runtime = "nodejs";

function safeFileName(pathname: string) {
  const name = pathname.split("/").pop() ?? "download";
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "download";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.searchParams.get("pathname");

  if (!pathname || !ATTACHMENT_PATH.test(pathname) || pathname.includes("..")) {
    return NextResponse.json({ error: "ไฟล์ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });

    if (!result) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-cache",
        },
      });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Cache-Control": "private, no-cache",
        "Content-Disposition": `inline; filename="${safeFileName(pathname)}"`,
        "Content-Type": result.blob.contentType,
        ETag: result.blob.etag,
      },
    });
  } catch (error) {
    console.error("[v0] Blob file delivery error", error);
    return NextResponse.json(
      { error: "ไม่สามารถเปิดไฟล์ได้" },
      { status: 500 },
    );
  }
}
