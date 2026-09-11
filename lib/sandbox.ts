import type { AttachmentManifest } from "@/lib/attachments";

export const SANDBOX_RUNTIMES = [
  { id: "node", label: "Node.js", version: "22", entrypoint: "index.js" },
  { id: "python", label: "Python", version: "3.12", entrypoint: "main.py" },
  { id: "go", label: "Go", version: "1.23", entrypoint: "main.go" },
  { id: "rust", label: "Rust", version: "1.82", entrypoint: "main.rs" },
  { id: "java", label: "Java", version: "21", entrypoint: "Main.java" },
  { id: "kotlin", label: "Kotlin", version: "2.0", entrypoint: "Main.kt" },
  { id: "c", label: "C", version: "GCC 14", entrypoint: "main.c" },
  { id: "cpp", label: "C++", version: "G++ 14", entrypoint: "main.cpp" },
  { id: "php", label: "PHP", version: "8.3", entrypoint: "index.php" },
  { id: "ruby", label: "Ruby", version: "3.3", entrypoint: "main.rb" },
  { id: "bash", label: "Bash", version: "5", entrypoint: "main.sh" },
] as const;

export type SandboxRuntimeId = (typeof SANDBOX_RUNTIMES)[number]["id"];
export type SandboxOperation = "install" | "run" | "install-and-run";

export type SandboxJobInput = {
  attachments: AttachmentManifest[];
  entrypoint: string;
  operation: SandboxOperation;
  packages: string[];
  roomId: string;
  runtime: SandboxRuntimeId;
  workspaceId: string;
};

export type SandboxJobStatus =
  | "queued"
  | "installing"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type SandboxJob = {
  error?: string;
  exitCode?: number | null;
  id: string;
  previewUrl?: string | null;
  runtime: SandboxRuntimeId;
  status: SandboxJobStatus;
  terminal: string;
  updatedAt: string;
};

export function isSandboxRuntimeId(value: unknown): value is SandboxRuntimeId {
  return SANDBOX_RUNTIMES.some((runtime) => runtime.id === value);
}

export function getRuntime(runtimeId: SandboxRuntimeId) {
  return SANDBOX_RUNTIMES.find((runtime) => runtime.id === runtimeId) ?? SANDBOX_RUNTIMES[0];
}

export function sanitizePackageName(value: string) {
  return value.trim().slice(0, 120);
}

export function isSafeEntrypoint(value: string) {
  return (
    value.length > 0 &&
    value.length <= 120 &&
    !value.includes("..") &&
    !value.includes("/") &&
    !value.includes("\\") &&
    /^[a-zA-Z0-9_.-]+$/.test(value)
  );
}
