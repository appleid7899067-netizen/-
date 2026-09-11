export const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
export const MAX_BATCH_FILES = 256;
export const MAX_IMAGE_FILES = 200;
export const UPLOAD_CONCURRENCY = 3;

export type AttachmentKind = "image" | "file";
export type UploadStatus =
  | "pending"
  | "uploading"
  | "uploaded"
  | "error"
  | "cancelled";

export type AttachmentManifest = {
  contentType: string;
  id: string;
  kind: AttachmentKind;
  name: string;
  pathname: string;
  size: number;
};

export function isImageType(contentType: string) {
  return contentType.toLowerCase().startsWith("image/");
}

export function safeAttachmentName(name: string) {
  const basename = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = basename
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 120);

  return cleaned || "file";
}

export function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "room";
}

export function createAttachmentPath(
  roomId: string,
  attachmentId: string,
  fileName: string,
) {
  return `silelo/attachments/${safePathSegment(roomId)}/${safePathSegment(attachmentId)}-${safeAttachmentName(fileName)}`;
}

export function attachmentDeliveryUrl(pathname: string) {
  return `/api/blob/file?pathname=${encodeURIComponent(pathname)}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function validateAttachmentFiles(files: File[]) {
  const imageCount = files.filter((file) => isImageType(file.type)).length;
  const accepted: File[] = [];
  const rejected: Array<{ name: string; reason: string }> = [];

  if (files.length > MAX_BATCH_FILES) {
    return {
      accepted: [],
      rejected: files.map((file) => ({
        name: file.name,
        reason: `เลือกได้ไม่เกิน ${MAX_BATCH_FILES} ไฟล์ต่อชุด`,
      })),
    };
  }

  if (imageCount > MAX_IMAGE_FILES) {
    return {
      accepted: [],
      rejected: files.map((file) => ({
        name: file.name,
        reason: `รองรับรูปภาพได้สูงสุด ${MAX_IMAGE_FILES} รูปต่อชุด`,
      })),
    };
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      rejected.push({
        name: file.name,
        reason: `ไฟล์ใหญ่เกิน ${formatBytes(MAX_FILE_SIZE_BYTES)}`,
      });
      continue;
    }
    accepted.push(file);
  }

  return { accepted, rejected };
}

export function attachmentManifestLabel(attachment: AttachmentManifest) {
  return `${attachment.name} (${formatBytes(attachment.size)})`;
}

export function hasPendingUploads(
  items: Array<{ status: UploadStatus }>,
) {
  return items.some(
    (item) => item.status === "pending" || item.status === "uploading",
  );
}

export function isAttachmentManifest(value: unknown): value is AttachmentManifest {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.pathname === "string" &&
    typeof item.contentType === "string" &&
    typeof item.size === "number" &&
    (item.kind === "image" || item.kind === "file")
  );
}
