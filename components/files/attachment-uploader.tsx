"use client";

import { upload } from "@vercel/blob/client";
import {
  AlertCircle,
  Check,
  File,
  FileUp,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type ClipboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  attachmentDeliveryUrl,
  createAttachmentPath,
  formatBytes,
  isImageType,
  type AttachmentManifest,
  type UploadStatus,
  UPLOAD_CONCURRENCY,
  validateAttachmentFiles,
} from "@/lib/attachments";
import { cn } from "@/lib/utils";

export type AttachmentItem = AttachmentManifest & {
  error?: string;
  file: File;
  previewUrl?: string;
  progress: number;
  status: UploadStatus;
};

type UseAttachmentUploaderOptions = {
  scope: string;
  onNotice?: (message: string | null) => void;
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useAttachmentUploader({
  scope,
  onNotice,
}: UseAttachmentUploaderOptions) {
  const [items, setItems] = useState<AttachmentItem[]>([]);
  const itemsRef = useRef<AttachmentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<string[]>([]);
  const activeRef = useRef(0);
  const controllersRef = useRef(new Map<string, AbortController>());
  const pumpRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      for (const controller of controllersRef.current.values()) {
        controller.abort();
      }
    };
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<AttachmentItem>) => {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const uploadOne = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      if (!item) return;

      const controller = new AbortController();
      controllersRef.current.set(id, controller);
      const pathname = createAttachmentPath(scope, item.id, item.name);
      updateItem(id, { pathname, status: "uploading", progress: 0, error: undefined });

      try {
        const result = await upload(pathname, item.file, {
          access: "private",
          abortSignal: controller.signal,
          clientPayload: JSON.stringify({
            attachmentId: item.id,
            roomId: scope,
          }),
          contentType: item.contentType,
          handleUploadUrl: "/api/blob/upload",
          multipart: item.size >= 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            updateItem(id, { progress: Math.round(percentage) });
          },
        });

        updateItem(id, {
          pathname: result.pathname,
          progress: 100,
          status: "uploaded",
        });
      } catch (error) {
        const cancelled = controller.signal.aborted;
        updateItem(id, {
          error: cancelled
            ? "ยกเลิกการอัปโหลดแล้ว"
            : error instanceof Error
              ? error.message
              : "อัปโหลดไม่สำเร็จ",
          status: cancelled ? "cancelled" : "error",
        });
      } finally {
        controllersRef.current.delete(id);
      }
    },
    [scope, updateItem],
  );

  const pump = useCallback(() => {
    while (activeRef.current < UPLOAD_CONCURRENCY && queueRef.current.length > 0) {
      const id = queueRef.current.shift();
      if (!id) break;
      activeRef.current += 1;
      void uploadOne(id).finally(() => {
        activeRef.current -= 1;
        pumpRef.current();
      });
    }
  }, [uploadOne]);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const validation = validateAttachmentFiles(files);
      if (validation.rejected.length > 0) {
        onNotice?.(
          validation.rejected.length === 1
            ? `${validation.rejected[0].name}: ${validation.rejected[0].reason}`
            : `ไม่รับ ${validation.rejected.length} ไฟล์ เพราะเกินขนาดหรือจำนวนที่กำหนด`,
        );
      } else {
        onNotice?.(null);
      }

      const nextItems: AttachmentItem[] = validation.accepted.map((file) => {
        const id = newId();
        return {
          contentType: file.type || "application/octet-stream",
          file,
          id,
          kind: isImageType(file.type) ? "image" : "file",
          name: file.name,
          pathname: "",
          previewUrl: isImageType(file.type) ? URL.createObjectURL(file) : undefined,
          progress: 0,
          size: file.size,
          status: "pending",
        };
      });

      if (nextItems.length === 0) return;
      itemsRef.current = [...itemsRef.current, ...nextItems];
      setItems((current) => [...current, ...nextItems]);
      queueRef.current.push(...nextItems.map((item) => item.id));
      pumpRef.current();
    },
    [onNotice],
  );

  const openPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) addFiles(event.target.files);
      event.target.value = "";
    },
    [addFiles],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
    },
    [addFiles],
  );

  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLElement>) => {
      if (event.clipboardData.files.length > 0) addFiles(event.clipboardData.files);
    },
    [addFiles],
  );

  const remove = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      if (!item) return;
      queueRef.current = queueRef.current.filter((queuedId) => queuedId !== id);
      controllersRef.current.get(id)?.abort();
      if (item.status === "uploaded" && item.pathname) {
        void fetch("/api/blob/delete", {
          body: JSON.stringify({ pathname: item.pathname }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });
      }
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      setItems((current) => current.filter((candidate) => candidate.id !== id));
    },
    [],
  );

  const retry = useCallback(
    (id: string) => {
      updateItem(id, { error: undefined, progress: 0, status: "pending" });
      queueRef.current.push(id);
      pumpRef.current();
    },
    [updateItem],
  );

  const clearUploaded = useCallback(() => {
    for (const item of itemsRef.current) {
      if (item.status === "uploaded") remove(item.id);
    }
  }, [remove]);

  const uploaded = useMemo(
    () =>
      items.filter(
        (item): item is AttachmentItem & { status: "uploaded" } =>
          item.status === "uploaded" && Boolean(item.pathname),
      ),
    [items],
  );
  const busy = useMemo(
    () => items.some((item) => item.status === "pending" || item.status === "uploading"),
    [items],
  );

  return {
    addFiles,
    busy,
    clearUploaded,
    fileInputRef,
    items,
    onDrop,
    onInputChange,
    onPaste,
    openPicker,
    remove,
    retry,
    uploaded,
  };
}

type AttachmentQueueProps = {
  compact?: boolean;
  items: AttachmentItem[];
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
};

export function AttachmentQueue({
  compact = false,
  items,
  onCancel,
  onRemove,
  onRetry,
}: AttachmentQueueProps) {
  if (items.length === 0) return null;

  return (
    <div
      aria-label="คิวไฟล์แนบ"
      className={cn(
        "flex gap-2 overflow-x-auto pb-1",
        compact ? "max-w-full" : "flex-wrap",
      )}
      role="list"
    >
      {items.map((item) => {
        const isWorking = item.status === "pending" || item.status === "uploading";
        return (
          <div
            className={cn(
              "group relative flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-2 py-2",
              compact ? "w-44" : "w-56",
            )}
            key={item.id}
            role="listitem"
          >
            {item.kind === "image" ? (
              <img
                alt={item.name}
                className="size-10 shrink-0 rounded-lg bg-muted object-cover"
                src={
                  item.status === "uploaded" && item.pathname
                    ? attachmentDeliveryUrl(item.pathname)
                    : item.previewUrl
                }
              />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <File aria-hidden="true" className="size-5" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{item.name}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {item.status === "uploaded"
                  ? `${formatBytes(item.size)} · พร้อมใช้`
                  : item.status === "error" || item.status === "cancelled"
                    ? item.error
                    : `${item.progress}% · ${formatBytes(item.size)}`}
              </span>
              {isWorking ? (
                <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${Math.max(item.progress, 4)}%` }}
                  />
                </span>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-0.5">
              {item.status === "uploaded" ? (
                <Check aria-hidden="true" className="size-4 text-primary" />
              ) : item.status === "error" || item.status === "cancelled" ? (
                <button
                  aria-label={`ลองอัปโหลด ${item.name} อีกครั้ง`}
                  className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onRetry(item.id)}
                  type="button"
                >
                  <RotateCcw aria-hidden="true" className="size-3.5" />
                </button>
              ) : (
                <button
                  aria-label={`ยกเลิกการอัปโหลด ${item.name}`}
                  className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onCancel(item.id)}
                  type="button"
                >
                  <Loader2
                    aria-hidden="true"
                    className={cn("size-3.5", item.status === "uploading" && "animate-spin")}
                  />
                </button>
              )}
              <button
                aria-label={`ลบไฟล์ ${item.name}`}
                className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => onRemove(item.id)}
                type="button"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AttachmentPickerButton({
  disabled = false,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label="แนบไฟล์หรือรูปภาพ"
      className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <FileUp aria-hidden="true" className="size-4" />
    </button>
  );
}

export function AttachmentDropHint() {
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <ImageIcon aria-hidden="true" className="size-3.5" />
      ทุกไฟล์ไม่เกิน 200MB · รูปได้ถึง 200 รูปต่อชุด
    </span>
  );
}

export function AttachmentError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle aria-hidden="true" className="size-3.5" />
      {message}
    </p>
  );
}
