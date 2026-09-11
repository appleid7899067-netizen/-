"use client";

import { useState } from "react";
import useSWR from "swr";
import { Box, ExternalLink, Loader2, Play, Square, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AttachmentManifest } from "@/lib/attachments";
import {
  SANDBOX_RUNTIMES,
  type SandboxJob,
  type SandboxOperation,
  type SandboxRuntimeId,
} from "@/lib/sandbox";
import { cn } from "@/lib/utils";

function errorMessage(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

type RuntimeConfig = {
  connected: boolean;
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(errorMessage(body.error, "อ่านสถานะ sandbox ไม่สำเร็จ"));
  }
  return body as SandboxJob;
};

const configFetcher = async (url: string) => {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(errorMessage(body.error, "อ่านสถานะ sandbox ไม่สำเร็จ"));
  }
  return body as RuntimeConfig;
};

type RuntimePanelProps = {
  attachments: AttachmentManifest[];
  roomId: string;
  workspaceId: string;
};

function terminalLabel(job?: SandboxJob) {
  if (!job) return "ยังไม่มีการรัน";
  if (job.status === "completed") return "รันเสร็จแล้ว";
  if (job.status === "failed") return "รันไม่สำเร็จ";
  if (job.status === "cancelled") return "ยกเลิกแล้ว";
  return job.status === "installing" ? "กำลังติดตั้งแพ็กเกจ" : "กำลังรันใน sandbox";
}

export function RuntimePanel({
  attachments,
  roomId,
  workspaceId,
}: RuntimePanelProps) {
  const [runtime, setRuntime] = useState<SandboxRuntimeId>("node");
  const [entrypoint, setEntrypoint] = useState("index.js");
  const [packages, setPackages] = useState("");
  const [runnerError, setRunnerError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [connectionOverride, setConnectionOverride] = useState<boolean | null>(null);
  const selectedRuntime = SANDBOX_RUNTIMES.find((item) => item.id === runtime);
  const { data: runtimeConfig } = useSWR<RuntimeConfig>(
    "/api/sandbox/config",
    configFetcher,
    { revalidateOnFocus: false },
  );
  const runtimeConnected = connectionOverride ?? runtimeConfig?.connected ?? null;

  const { data: job, mutate } = useSWR<SandboxJob>(
    jobId ? `/api/sandbox/jobs/${jobId}` : null,
    fetcher,
    {
      refreshInterval: (current) =>
        current?.status === "completed" ||
        current?.status === "failed" ||
        current?.status === "cancelled"
          ? 0
          : 900,
      revalidateOnFocus: false,
    },
  );

  const startJob = async (operation: SandboxOperation) => {
    if (runtimeConnected !== true) {
      setRunnerError("ยังไม่ได้เชื่อมต่อ sandbox runner");
      return;
    }

    setStarting(true);
    setRunnerError(null);
    try {
      const response = await fetch("/api/sandbox/jobs", {
        body: JSON.stringify({
          attachments,
          entrypoint,
          operation,
          packages: packages
            .split(/[\s,]+/)
            .map((item) => item.trim())
            .filter(Boolean),
          roomId,
          runtime,
          workspaceId,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(errorMessage(body.error, "เริ่ม sandbox ไม่สำเร็จ"));
      }
      setJobId(body.id);
      setConnectionOverride(true);
    } catch (error) {
      setConnectionOverride(false);
      setRunnerError(error instanceof Error ? error.message : "sandbox runner ไม่พร้อม");
    } finally {
      setStarting(false);
    }
  };

  const stopJob = async () => {
    if (!jobId) return;
    await fetch(`/api/sandbox/jobs/${jobId}`, { method: "DELETE" }).catch(() => undefined);
    await mutate();
  };

  return (
    <aside className="flex min-h-0 flex-col border-t border-border bg-card/35 lg:border-l lg:border-t-0">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Box aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Sandbox runtime</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              รันโค้ดจริงใน runner ของคุณ ไม่ใช้ runtime ของ Vercel เป็นหลัก
            </p>
          </div>
        </div>
        <span
          className={cn(
            "mt-1 size-2 shrink-0 rounded-full",
            runtimeConnected === true ? "bg-emerald-500" : runtimeConnected === false ? "bg-destructive" : "bg-muted-foreground/50",
          )}
          title={runtimeConnected === true ? "runner connected" : runtimeConnected === false ? "runner unavailable" : "runner status unknown"}
        />
      </div>

      <div className="space-y-4 overflow-y-auto p-4">
        <label className="block space-y-1.5 text-xs font-medium">
          ภาษา / runtime
          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => {
              const nextRuntime = event.target.value as SandboxRuntimeId;
              setRuntime(nextRuntime);
              const next = SANDBOX_RUNTIMES.find((item) => item.id === nextRuntime);
              if (next) setEntrypoint(next.entrypoint);
            }}
            value={runtime}
          >
            {SANDBOX_RUNTIMES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} · {item.version}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5 text-xs font-medium">
          entrypoint
          <Input
            aria-label="sandbox entrypoint"
            onChange={(event) => setEntrypoint(event.target.value)}
            value={entrypoint}
          />
        </label>

        <label className="block space-y-1.5 text-xs font-medium">
          packages <span className="font-normal text-muted-foreground">(คั่นด้วยช่องว่างหรือ comma)</span>
          <Input
            aria-label="sandbox packages"
            onChange={(event) => setPackages(event.target.value)}
            placeholder={runtime === "node" ? "zod lodash" : runtime === "python" ? "requests fastapi" : "เว้นว่างได้"}
            value={packages}
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Button
            disabled={starting || !selectedRuntime || runtimeConnected !== true}
            onClick={() => void startJob("install")}
            size="sm"
            type="button"
            variant="outline"
          >
            {starting ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Terminal aria-hidden="true" />}
            ติดตั้ง
          </Button>
          <Button
            disabled={starting || !selectedRuntime || runtimeConnected !== true}
            onClick={() => void startJob("install-and-run")}
            size="sm"
            type="button"
          >
            {starting ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Play aria-hidden="true" />}
            ติดตั้งและรัน
          </Button>
        </div>

        {runtimeConnected === false ? (
          <p className="rounded-xl border border-dashed border-border bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
            ยังไม่ได้เชื่อมต่อ sandbox runner ภายนอก Vercel จึงยังติดตั้งหรือรันโค้ดไม่ได้
          </p>
        ) : null}
        {job ? (
          <div className="space-y-3 rounded-2xl border border-border bg-background/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">{terminalLabel(job)}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{job.id}</p>
              </div>
              {job.status === "running" || job.status === "installing" ? (
                <Button aria-label="หยุด sandbox" onClick={() => void stopJob()} size="icon" variant="ghost">
                  <Square aria-hidden="true" className="size-3.5" />
                </Button>
              ) : null}
            </div>
            <pre className="max-h-48 overflow-auto rounded-xl bg-muted p-3 font-mono text-[11px] leading-5 text-foreground">
              {job.terminal || "กำลังรอ output จาก runner..."}
            </pre>
            {job.previewUrl ? (
              <a
                className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                href={job.previewUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden="true" className="size-3.5" />
                เปิด preview
              </a>
            ) : null}
            {job.error ? <p className="text-xs text-destructive">{job.error}</p> : null}
          </div>
        ) : null}
        {runnerError ? <p className="text-xs leading-5 text-destructive">{runnerError}</p> : null}
        {attachments.length > 0 ? (
          <p className="text-[11px] leading-5 text-muted-foreground">
            ไฟล์พร้อมใช้ใน workspace: {attachments.length} รายการ
          </p>
        ) : null}
      </div>
    </aside>
  );
}
