import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

const port = Number(process.env.PORT || 8080);
const secret = process.env.SANDBOX_RUNNER_SHARED_SECRET || "";
const jobs = new Map();
const maxTerminalBytes = 120_000;

const runtimes = {
  node: {
    image: "node:22-bookworm-slim",
    install: (packages) => ["npm", "install", "--no-audit", "--no-fund", ...packages],
    run: (entrypoint) => ["node", entrypoint],
  },
  python: {
    image: "python:3.12-slim",
    install: (packages) => ["python", "-m", "pip", "install", "--no-cache-dir", ...packages],
    run: (entrypoint) => ["python", entrypoint],
  },
  go: {
    image: "golang:1.23-bookworm",
    install: (packages) => ["go", "get", ...packages],
    run: (entrypoint) => ["go", "run", entrypoint],
  },
  rust: {
    image: "rust:1.82-bookworm",
    install: (packages) => ["cargo", "add", ...packages],
    run: (entrypoint) => ["rustc", entrypoint, "-o", "/tmp/silelo-app"],
    afterRun: ["/tmp/silelo-app"],
  },
  java: {
    image: "eclipse-temurin:21-jdk",
    install: (packages) => ["sh", "-c", "true"],
    run: (entrypoint) => ["javac", entrypoint],
    afterRun: (entrypoint) => ["java", basename(entrypoint, ".java")],
  },
  kotlin: {
    image: "zenika/kotlin:2.0-jdk21",
    install: (packages) => ["sh", "-c", "true"],
    run: (entrypoint) => ["kotlinc", entrypoint, "-include-runtime", "-d", "/tmp/silelo-app.jar"],
    afterRun: ["java", "-jar", "/tmp/silelo-app.jar"],
  },
  c: {
    image: "gcc:14",
    install: (packages) => ["sh", "-c", "true"],
    run: (entrypoint) => ["gcc", entrypoint, "-O2", "-o", "/tmp/silelo-app"],
    afterRun: ["/tmp/silelo-app"],
  },
  cpp: {
    image: "gcc:14",
    install: (packages) => ["sh", "-c", "true"],
    run: (entrypoint) => ["g++", entrypoint, "-O2", "-std=c++20", "-o", "/tmp/silelo-app"],
    afterRun: ["/tmp/silelo-app"],
  },
  php: {
    image: "php:8.3-cli",
    install: (packages) => ["sh", "-c", "true"],
    run: (entrypoint) => ["php", entrypoint],
  },
  ruby: {
    image: "ruby:3.3",
    install: (packages) => ["gem", "install", ...packages],
    run: (entrypoint) => ["ruby", entrypoint],
  },
  bash: {
    image: "bash:5.2",
    install: (packages) => ["sh", "-c", "true"],
    run: (entrypoint) => ["bash", entrypoint],
  },
};

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function authorized(request) {
  return !secret || request.headers["x-silelo-runner-secret"] === secret;
}

function validInput(input) {
  return (
    input &&
    typeof input === "object" &&
    runtimes[input.runtime] &&
    typeof input.entrypoint === "string" &&
    /^[a-zA-Z0-9_.-]{1,120}$/.test(input.entrypoint) &&
    ["install", "run", "install-and-run"].includes(input.operation) &&
    Array.isArray(input.packages) &&
    input.packages.length <= 24 &&
    input.packages.every((item) => typeof item === "string" && /^[a-zA-Z0-9@._+:/=-]{1,120}$/.test(item)) &&
    Array.isArray(input.attachments) &&
    input.attachments.length <= 256
  );
}

function appendTerminal(job, chunk) {
  job.terminal = `${job.terminal}${String(chunk)}`.slice(-maxTerminalBytes);
  job.updatedAt = new Date().toISOString();
}

async function downloadAttachments(job, workspace) {
  for (const attachment of job.input.attachments) {
    if (!attachment.sourceUrl || typeof attachment.name !== "string") continue;
    const response = await fetch(attachment.sourceUrl, {
      headers: { "x-silelo-runner-secret": secret },
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok || !response.body) throw new Error(`ดาวน์โหลด ${attachment.name} ไม่สำเร็จ`);
    const safeName = basename(attachment.name).replace(/[^a-zA-Z0-9._-]+/g, "-") || "file";
    const target = join(workspace, safeName);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(target, buffer);
  }
}

function dockerArgs(runtime, workspace, command, allowNetwork) {
  return [
    "run",
    "--rm",
    "--name",
    `silelo-job-${runtime.id}-${randomUUID().slice(0, 8)}`,
    "--cpus=1",
    "--memory=768m",
    "--pids-limit=128",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--read-only",
    "--tmpfs",
    "/tmp:rw,nosuid,nodev,size=128m",
    allowNetwork ? "--network=bridge" : "--network=none",
    "-v",
    `${workspace}:/workspace:rw`,
    "-w",
    "/workspace",
    runtime.image,
    ...command,
  ];
}

function runDocker(job, runtime, workspace, command, phase, allowNetwork) {
  return new Promise((resolve) => {
    job.status = phase;
    const child = spawn("docker", dockerArgs(runtime, workspace, command, allowNetwork), {
      stdio: ["ignore", "pipe", "pipe"],
    });
    job.child = child;
    child.stdout.on("data", (chunk) => appendTerminal(job, chunk));
    child.stderr.on("data", (chunk) => appendTerminal(job, chunk));
    child.on("error", (error) => {
      appendTerminal(job, `\nrunner error: ${error.message}\n`);
      resolve(127);
    });
    child.on("close", (code) => {
      job.child = null;
      resolve(code ?? 1);
    });
  });
}

async function executeJob(job) {
  const workspace = await mkdtemp(join(tmpdir(), "silelo-workspace-"));
  try {
    await downloadAttachments(job, workspace);
    const runtime = runtimes[job.input.runtime];
    if (job.input.operation === "install" || job.input.operation === "install-and-run") {
      const installCode = await runDocker(
        job,
        { ...runtime, id: job.input.runtime },
        workspace,
        runtime.install(job.input.packages),
        "installing",
        true,
      );
      if (installCode !== 0) throw new Error(`ติดตั้งแพ็กเกจจบด้วย exit code ${installCode}`);
    }
    if (job.input.operation === "run" || job.input.operation === "install-and-run") {
      const runCode = await runDocker(
        job,
        { ...runtime, id: job.input.runtime },
        workspace,
        runtime.run(job.input.entrypoint),
        "running",
        false,
      );
      if (runCode !== 0) throw new Error(`โปรแกรมจบด้วย exit code ${runCode}`);
      if (runtime.afterRun) {
        const afterRun = typeof runtime.afterRun === "function"
          ? runtime.afterRun(job.input.entrypoint)
          : runtime.afterRun;
        await runDocker(
          job,
          { ...runtime, id: job.input.runtime },
          workspace,
          afterRun,
          "running",
          false,
        );
      }
    }
    job.status = "completed";
    job.exitCode = 0;
  } catch (error) {
    job.status = job.status === "cancelled" ? "cancelled" : "failed";
    job.exitCode = job.status === "cancelled" ? null : 1;
    job.error = error instanceof Error ? error.message : "sandbox job failed";
    appendTerminal(job, `\n${job.error}\n`);
  } finally {
    job.updatedAt = new Date().toISOString();
    await rm(workspace, { force: true, recursive: true });
  }
}

const server = createServer(async (request, response) => {
  if (!authorized(request)) return json(response, 401, { error: "unauthorized" });
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "GET" && url.pathname === "/health") {
    return json(response, 200, { service: "sandbox-runner", status: "ok" });
  }
  if (request.method === "POST" && url.pathname === "/v1/jobs") {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    try {
      const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!validInput(input)) return json(response, 400, { error: "invalid job input" });
      const id = randomUUID();
      const job = {
        id,
        input,
        runtime: input.runtime,
        status: "queued",
        terminal: "",
        updatedAt: new Date().toISOString(),
      };
      jobs.set(id, job);
      void executeJob(job);
      return json(response, 202, {
        id,
        runtime: job.runtime,
        status: job.status,
        terminal: job.terminal,
        updatedAt: job.updatedAt,
      });
    } catch {
      return json(response, 400, { error: "invalid json" });
    }
  }

  const match = url.pathname.match(/^\/v1\/jobs\/([a-zA-Z0-9-]+)$/);
  if (match) {
    const job = jobs.get(match[1]);
    if (!job) return json(response, 404, { error: "job not found" });
    if (request.method === "DELETE") {
      job.status = "cancelled";
      job.child?.kill("SIGKILL");
      job.updatedAt = new Date().toISOString();
      return json(response, 200, { id: job.id, status: job.status, terminal: job.terminal, updatedAt: job.updatedAt });
    }
    if (request.method === "GET") {
      return json(response, 200, {
        error: job.error,
        exitCode: job.exitCode,
        id: job.id,
        previewUrl: null,
        runtime: job.runtime,
        status: job.status,
        terminal: job.terminal,
        updatedAt: job.updatedAt,
      });
    }
  }

  return json(response, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`SILELO sandbox runner listening on :${port}`);
});
