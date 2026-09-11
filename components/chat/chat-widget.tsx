"use client";

import {
  Bot,
  ChevronDown,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AttachmentError,
  AttachmentPickerButton,
  AttachmentQueue,
  useAttachmentUploader,
} from "@/components/files/attachment-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { attachmentManifestLabel } from "@/lib/attachments";
import { withAgentProfile, type AgentMessage } from "@/lib/agent-profile";
import { streamPuterChat } from "@/lib/puter-ai";
import { cn } from "@/lib/utils";

function getPuterErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "ยังตอบไม่ได้ในตอนนี้ ลองใหม่อีกครั้งหลังจากตรวจสอบ Puter login";
}

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    busy: attachmentsBusy,
    clearUploaded,
    fileInputRef,
    items: attachmentItems,
    onInputChange,
    onPaste,
    openPicker,
    remove,
    retry,
    uploaded: uploadedAttachments,
  } = useAttachmentUploader({ onNotice: setNotice, scope: "widget" });

  useEffect(() => {
    let mounted = true;
    void Promise.resolve(window.puter?.auth.isSignedIn())
      .then((signedIn) => {
        if (!mounted) return;
        setIsAuthenticated(Boolean(signedIn));
        setAuthChecked(true);
      })
      .catch(() => {
        if (mounted) setAuthChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const signIn = async () => {
    setError(null);
    if (!window.puter) {
      setError("ไม่พบ Puter SDK ในหน้านี้");
      return;
    }
    try {
      await window.puter.auth.signIn();
      setIsAuthenticated(true);
    } catch (signInError) {
      setError(getPuterErrorMessage(signInError));
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if ((!text && uploadedAttachments.length === 0) || isTyping || attachmentsBusy) return;
    if (!isAuthenticated) {
      setError("เข้าสู่ระบบ Puter ก่อนเริ่มคุยกับ TEMPLATE OS Copilot");
      return;
    }

    const attachmentText = uploadedAttachments.length
      ? `ไฟล์แนบใน workspace:\n${uploadedAttachments
          .map(attachmentManifestLabel)
          .join("\n")}`
      : "";
    const content = [text, attachmentText].filter(Boolean).join("\n\n");
    const nextMessages = [...messages, { content, role: "user" as const }];
    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setIsTyping(true);

    try {
      const responseText = await streamPuterChat(
        withAgentProfile(nextMessages),
        () => undefined,
      );
      setMessages((current) => [
        ...current,
        { content: responseText, role: "assistant" },
      ]);
      clearUploaded();
    } catch (chatError) {
      setError(getPuterErrorMessage(chatError));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      event.keyCode !== 229
    ) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="TEMPLATE OS Copilot chat"
          className="flex h-[min(680px,calc(100dvh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-background/95 shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">TEMPLATE OS Copilot</p>
                <p className="text-xs text-muted-foreground">
                  {isAuthenticated ? "Puter พร้อมใช้งาน" : "ต้องเข้าสู่ระบบ Puter"}
                </p>
              </div>
            </div>
            <Button
              aria-label="ปิดหน้าต่างแชท"
              onClick={() => setOpen(false)}
              size="icon"
              variant="ghost"
            >
              <X aria-hidden="true" />
            </Button>
          </header>

          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
            onPaste={onPaste}
          >
            {!authChecked ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                กำลังตรวจสอบ Puter login...
              </div>
            ) : null}
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/60 p-4 text-sm leading-6 text-muted-foreground">
                <p className="font-medium text-foreground">คุยกับ TEMPLATE OS Copilot ได้ทันที</p>
                <p className="mt-1">
                  ใช้โปรไฟล์กลางของ TEMPLATE OS ผ่าน Puter AI และแนบไฟล์เข้า workspace ได้
                </p>
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div
                className={cn(
                  "flex items-start gap-2",
                  message.role === "user" && "justify-end",
                )}
                key={`${message.role}-${index}`}
              >
                {message.role !== "user" ? (
                  <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Bot aria-hidden="true" className="size-4" />
                  </span>
                ) : null}
                <div
                  className={cn(
                    "max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {message.content}
                </div>
                {message.role === "user" ? (
                  <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <User aria-hidden="true" className="size-4" />
                  </span>
                ) : null}
              </div>
            ))}
            {isTyping ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                TEMPLATE OS Copilot กำลังคิดจาก Puter...
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          {error ? (
            <div className="border-t border-border px-4 py-2 text-xs text-destructive" role="alert">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground" role="status">
              {notice}
            </div>
          ) : null}
          <AttachmentQueue
            compact
            items={attachmentItems}
            onCancel={remove}
            onRemove={remove}
            onRetry={retry}
          />
          <form
            className="border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <input
              accept="*/*"
              className="sr-only"
              multiple
              onChange={onInputChange}
              ref={fileInputRef}
              type="file"
            />
            <div className="flex items-center gap-1 rounded-2xl border border-input bg-card p-1">
              <AttachmentPickerButton disabled={isTyping} onClick={openPicker} />
              <Input
                aria-label="พิมพ์ข้อความถึง TEMPLATE OS Copilot"
                className="h-10 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
                disabled={isTyping}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ถาม TEMPLATE OS Copilot..."
                value={draft}
              />
              <Button
                aria-label="ส่งข้อความ"
                disabled={(!draft.trim() && uploadedAttachments.length === 0) || isTyping || attachmentsBusy}
                size="icon"
                type="submit"
              >
                <Send aria-hidden="true" />
              </Button>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <Paperclip aria-hidden="true" className="size-3" />
              <FileText aria-hidden="true" className="size-3" />
              {pathname === "/rooms" ? "ใช้ workspace ของห้องแชทด้านหลัง" : "แนบไฟล์เข้า workspace ได้"}
            </p>
          </form>
        </section>
      ) : (
        <Button
          aria-expanded={open}
          aria-label="เปิด TEMPLATE OS Copilot"
          className="size-14 rounded-2xl shadow-xl shadow-primary/20"
          onClick={() => setOpen(true)}
          size="icon"
        >
          <MessageCircle aria-hidden="true" className="size-6" />
        </Button>
      )}
    </div>
  );
}
