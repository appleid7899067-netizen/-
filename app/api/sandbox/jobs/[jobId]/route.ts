import { NextResponse } from "next/server";

export const runtime = "nodejs";

function runnerUrl() {
  return process.env.SANDBOX_RUNNER_URL ?? null;
}

async function proxy(request: Request, jobId: string, method: "GET" | "DELETE") {
  const base = runnerUrl();
  if (!base || !/^[a-zA-Z0-9_-]{1,80}$/.test(jobId)) {
    return NextResponse.json(
      { error: "sandbox runner ยังไม่พร้อมใช้งาน" },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(
      `${base.replace(/\/$/, "")}/v1/jobs/${encodeURIComponent(jobId)}`,
      {
        method,
        headers: {
          "x-silelo-runner-secret": process.env.SANDBOX_RUNNER_SHARED_SECRET ?? "",
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
    const body = await upstream.json().catch(() => ({ error: "runner error" }));
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถอ่านสถานะ sandbox ได้" },
      { status: 502 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  return proxy(request, jobId, "GET");
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  return proxy(request, jobId, "DELETE");
}
