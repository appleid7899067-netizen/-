import { NextResponse } from "next/server";
import { isAttachmentManifest } from "@/lib/attachments";
import {
  isSafeEntrypoint,
  isSandboxRuntimeId,
  type SandboxJobInput,
} from "@/lib/sandbox";

export const runtime = "nodejs";

const PACKAGE_PATTERN = /^[a-zA-Z0-9@._+:/=-]+$/;

function runnerUrl() {
  return process.env.SANDBOX_RUNNER_URL ?? null;
}

function validInput(value: unknown): value is SandboxJobInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return (
    typeof input.roomId === "string" &&
    typeof input.workspaceId === "string" &&
    typeof input.entrypoint === "string" &&
    isSafeEntrypoint(input.entrypoint) &&
    isSandboxRuntimeId(input.runtime) &&
    (input.operation === "install" ||
      input.operation === "run" ||
      input.operation === "install-and-run") &&
    Array.isArray(input.packages) &&
    input.packages.length <= 24 &&
    input.packages.every(
      (item) => typeof item === "string" && item.length <= 120 && PACKAGE_PATTERN.test(item),
    ) &&
    Array.isArray(input.attachments) &&
    input.attachments.length <= 256 &&
    input.attachments.every(isAttachmentManifest)
  );
}

export async function POST(request: Request) {
  const base = runnerUrl();
  if (!base) {
    return NextResponse.json(
      { error: "ยังไม่ได้เชื่อมต่อ sandbox runner" },
      { status: 503 },
    );
  }

  const input = await request.json().catch(() => null);
  if (!validInput(input)) {
    return NextResponse.json({ error: "คำสั่ง sandbox ไม่ถูกต้อง" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const payload = {
    ...input,
    attachments: input.attachments.map((attachment) => ({
      ...attachment,
      sourceUrl: `${origin}/api/blob/file?pathname=${encodeURIComponent(attachment.pathname)}`,
    })),
  };

  try {
    const upstream = await fetch(`${base.replace(/\/$/, "")}/v1/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-silelo-runner-secret": process.env.SANDBOX_RUNNER_SHARED_SECRET ?? "",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    const body = await upstream.json().catch(() => ({ error: "runner error" }));
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถเชื่อมต่อ sandbox runner ได้" },
      { status: 502 },
    );
  }
}
