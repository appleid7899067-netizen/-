import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
const PATHNAME_PATTERN = /^silelo\/attachments\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+-[a-zA-Z0-9._-]+$/;

export const runtime = "nodejs";

function isValidClientPayload(value: string | null) {
  if (!value) return false;
  try {
    const payload = JSON.parse(value) as Record<string, unknown>;
    return (
      typeof payload.roomId === "string" &&
      typeof payload.attachmentId === "string" &&
      payload.roomId.length <= 80 &&
      payload.attachmentId.length <= 80
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    if (
      body.type === "blob.generate-client-token" &&
      (!PATHNAME_PATTERN.test(body.payload.pathname) ||
        !isValidClientPayload(body.payload.clientPayload))
    ) {
      return NextResponse.json({ error: "เส้นทางไฟล์ไม่ถูกต้อง" }, { status: 400 });
    }

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!PATHNAME_PATTERN.test(pathname) || !isValidClientPayload(clientPayload)) {
          throw new Error("Invalid attachment upload scope");
        }

        return {
          access: "private",
          allowedContentTypes: undefined,
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          tokenPayload: clientPayload,
          validUntil: Date.now() + 10 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[v0] Blob upload token error", error);
    return NextResponse.json(
      { error: "ไม่สามารถเตรียมการอัปโหลดไฟล์ได้" },
      { status: 400 },
    );
  }
}
