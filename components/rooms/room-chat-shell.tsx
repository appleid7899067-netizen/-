"use client";

import {
  ArrowLeft,
  Bot,
  Cable,
  Check,
  Hash,
  Loader2,
  MoreHorizontal,
  Send,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  AttachmentError,
  AttachmentPickerButton,
  AttachmentQueue,
  useAttachmentUploader,
} from "@/components/files/attachment-uploader";
import { RuntimePanel } from "@/components/rooms/runtime-panel";
import { Button } from "@/components/ui/button";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Input } from "@/components/ui/input";
import { brand, rooms } from "@/lib/brand";
import {
  attachmentManifestLabel,
  hasPendingUploads,
  type AttachmentManifest,
} from "@/lib/attachments";
import { withAgentProfile, type AgentMessage } from "@/lib/agent-profile";
import { streamPuterChat } from "@/lib/puter-ai";
import {
  isRoomGatewayEvent,
  toWebSocketUrl,
  type GatewayStatus,
} from "@/lib/room-gateway";
import { cn } from "@/lib/utils";

type RoomId = "sli" | "work" | "lab";
type MessageRole = "assistant" | "user";

type RoomMessage = {
  author: string;
  id: string;
  initials: string;
  role: MessageRole;
  text: string;
  time: string;
};

type RoomDefinition = (typeof rooms)[number] & { id: RoomId };

type GatewayConfig = {
  gatewayUrl: string | null;
  liveModel: string;
  sandboxConfigured: boolean;
};

type RoomTicketResponse = { ticket?: string };

type HistoryResponse = { messages?: RoomMessage[] } | RoomMessage[];

const roomCatalog: RoomDefinition[] = [
  { ...rooms[0], id: "sli" },
  { ...rooms[1], id: "work" },
  { ...rooms[2], id: "lab" },
];

const emptyMessages: Record<RoomId, RoomMessage[]> = {
  lab: [],
  sli: [],
  work: [],
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "request failed");
  return body;
};

const ticketFetcher = async ([url, roomId]: [string, RoomId]) => {
  const response = await fetch(url, {
    body: JSON.stringify({ roomId }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "room gateway unavailable");
  return body as RoomTicketResponse;
};

function normalizeRoomId(value: string | null): RoomId {
  if (value === "work" || value === "lab") return value;
  return "sli";
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function gatewayLabel(status: GatewayStatus) {
  if (status === "connected") return "room gateway connected";
  if (status === "connecting" || status === "checking") return "กำลังเชื่อมต่อ gateway";
  if (status === "standalone") return "standalone · Puter live model";
  if (status === "error") return "gateway unavailable";
  return "gateway disconnected";
}

function ActivityIcon({ roomId }: { roomId: RoomId }) {
  if (roomId === "work") return <Zap aria-hidden="true" />;
  if (roomId === "lab") return <Check aria-hidden="true" />;
  return <Sparkles aria-hidden="true" />;
}

function RoomBadge({ room }: { room: RoomDefinition }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-xl border border-[color:var(--room-accent)]/35 bg-[color:var(--room-accent)]/10 text-sm font-semibold text-[color:var(--room-accent)]"
      style={{ "--room-accent": room.accent } as React.CSSProperties}
    >
      {room.label.slice(0, 1)}
    </span>
  );
}

function toAgentMessages(messages: RoomMessage[]): AgentMessage[] {
  return messages.map((message) => ({
    content: message.text,
    role: message.role,
  }));
}

type RoomComposerProps = {
  disabled: boolean;
  onAttachmentsChange: (attachments: AttachmentManifest[]) => void;
  onSend: (text: string, attachments: AttachmentManifest[]) => Promise<boolean>;
  roomId: RoomId;
  roomName: string;
};

function RoomComposer({
  disabled,
  onAttachmentsChange,
  onSend,
  roomId,
  roomName,
}: RoomComposerProps) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const {
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
  } = useAttachmentUploader({ onNotice: setNotice, scope: roomId });
  const attachmentSignatureRef = useRef("");

  useEffect(() => {
    const manifests = uploaded.map(
      ({ file: _file, previewUrl: _previewUrl, progress: _progress, status: _status, error: _error, ...manifest }) => manifest,
    );
    const signature = JSON.stringify(manifests);
    if (signature === attachmentSignatureRef.current) return;
    attachmentSignatureRef.current = signature;
    onAttachmentsChange(manifests);
  }, [onAttachmentsChange, uploaded]);

  const submit = async () => {
    const text = draft.trim();
    const attachments = uploaded.map(
      ({ file: _file, previewUrl: _previewUrl, progress: _progress, status: _status, error: _error, ...manifest }) => manifest,
    );
    if ((!text && attachments.length === 0) || disabled || busy) return;
    const sent = await onSend(text, attachments);
    if (sent) {
      setDraft("");
      clearUploaded();
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
      void submit();
    }
  };

  return (
    <div
      className="border-t border-border bg-background/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:p-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onPaste={onPaste}
    >
      <AttachmentQueue
        items={items}
        onCancel={remove}
        onRemove={remove}
        onRetry={retry}
      />
      {notice ? <AttachmentError message={notice} /> : null}
      <form
        className="mx-auto mt-2 flex max-w-3xl items-center gap-2 rounded-2xl border border-input bg-card/80 p-1.5 shadow-lg shadow-background/20"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
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
        <AttachmentPickerButton disabled={disabled || busy} onClick={openPicker} />
        <Input
          aria-label={`พิมพ์ข้อความใน${roomName}`}
          autoComplete="off"
          className="h-10 border-0 bg-transparent px-1 shadow-none focus-visible:border-0 focus-visible:ring-0"
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`ส่งข้อความใน${roomName}...`}
          value={draft}
        />
        <Button
          aria-label="ส่งข้อความ"
          disabled={disabled || busy || (!draft.trim() && uploaded.length === 0) || hasPendingUploads(items)}
          size="icon"
          type="submit"
        >
          <Send aria-hidden="true" />
        </Button>
      </form>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
        Puter AI แบบ streaming · แนบไฟล์ได้ทุกชนิดไม่เกิน 200MB · ใช้ Drag & Drop หรือ Paste ได้
      </p>
    </div>
  );
}

export function RoomChatShell() {
  const searchParams = useSearchParams();
  const requestedRoomId = normalizeRoomId(searchParams.get("room"));
  const [activeRoomId, setActiveRoomId] = useState<RoomId>(requestedRoomId);
  const [messagesByRoom, setMessagesByRoom] = useState(emptyMessages);
  const [typingByRoom, setTypingByRoom] = useState<Record<RoomId, boolean>>({
    lab: false,
    sli: false,
    work: false,
  });
  const [attachments, setAttachments] = useState<AttachmentManifest[]>([]);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>("checking");
  const [members, setMembers] = useState(1);
  const [puterSignedIn, setPuterSignedIn] = useState(false);
  const [puterChecked, setPuterChecked] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const seenMessageIds = useRef(new Set<string>());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRoom = useMemo(
    () => roomCatalog.find((room) => room.id === activeRoomId) ?? roomCatalog[0],
    [activeRoomId],
  );
  const activeMessages = messagesByRoom[activeRoom.id];
  const isTyping = typingByRoom[activeRoom.id];

  const { data: gatewayConfig } = useSWR<GatewayConfig>(
    "/api/rooms/config",
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  const { data: ticket } = useSWR<RoomTicketResponse>(
    gatewayConfig?.gatewayUrl ? ["/api/rooms/ticket", activeRoom.id] : null,
    ticketFetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  const { data: historyData, mutate: mutateHistory } = useSWR<HistoryResponse>(
    gatewayConfig?.gatewayUrl ? `/api/rooms/${activeRoom.id}/messages` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  useEffect(() => {
    setActiveRoomId(requestedRoomId);
  }, [requestedRoomId]);

  useEffect(() => {
    let mounted = true;
    const puter = window.puter;
    if (!puter) {
      setPuterChecked(true);
      return;
    }
    void Promise.resolve(puter.auth.isSignedIn())
      .then((signedIn) => {
        if (!mounted) return;
        setPuterSignedIn(Boolean(signedIn));
        setPuterChecked(true);
      })
      .catch(() => {
        if (mounted) setPuterChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const history = Array.isArray(historyData)
      ? historyData
      : historyData?.messages ?? [];
    if (history.length === 0) return;
    setMessagesByRoom((current) => ({ ...current, [activeRoom.id]: history }));
    for (const message of history) seenMessageIds.current.add(message.id);
  }, [activeRoom.id, historyData]);

  useEffect(() => {
    const gatewayUrl = gatewayConfig?.gatewayUrl;
    const gatewayTicket = ticket?.ticket;
    if (!gatewayUrl || !gatewayTicket) {
      setGatewayStatus(gatewayConfig ? "standalone" : "checking");
      return;
    }

    setGatewayStatus("connecting");
    const socket = new WebSocket(
      `${toWebSocketUrl(gatewayUrl)}?room=${activeRoom.id}&ticket=${encodeURIComponent(gatewayTicket)}`,
    );
    socketRef.current = socket;

    socket.onopen = () => setGatewayStatus("connected");
    socket.onclose = () => {
      setGatewayStatus("disconnected");
      if (socketRef.current === socket) socketRef.current = null;
    };
    socket.onerror = () => setGatewayStatus("error");
    socket.onmessage = (event) => {
      try {
        const parsed: unknown = JSON.parse(event.data);
        if (!isRoomGatewayEvent(parsed)) return;
        if (parsed.type === "presence") {
          setMembers(parsed.members);
          return;
        }
        if (parsed.type !== "room.message" || seenMessageIds.current.has(parsed.id)) return;
        const message: RoomMessage = {
          author: parsed.author,
          id: parsed.id,
          initials: parsed.initials,
          role: parsed.role,
          text: parsed.text,
          time: parsed.time,
        };
        seenMessageIds.current.add(message.id);
        setMessagesByRoom((current) => ({
          ...current,
          [activeRoom.id]: [...current[activeRoom.id], message],
        }));
      } catch {
        setGatewayStatus("error");
      }
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [activeRoom.id, gatewayConfig?.gatewayUrl, ticket?.ticket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isTyping]);

  function selectRoom(roomId: RoomId) {
    setActiveRoomId(roomId);
    setAttachments([]);
    setRoomError(null);
    window.history.replaceState(null, "", `/rooms?room=${roomId}`);
  }

  async function clearRoom() {
    setMessagesByRoom((current) => ({ ...current, [activeRoom.id]: [] }));
    seenMessageIds.current.clear();
    if (gatewayConfig?.gatewayUrl) {
      await fetch(`/api/rooms/${activeRoom.id}/messages`, { method: "DELETE" }).catch(() => undefined);
      await mutateHistory();
    }
  }

  async function sendMessage(text: string, messageAttachments: AttachmentManifest[]) {
    if (!puterSignedIn) {
      setRoomError("เข้าสู่ระบบ Puter ก่อนเริ่มแชทกับ Agent");
      return false;
    }

    const roomId = activeRoom.id;
    const attachmentText = messageAttachments.length
      ? `ไฟล์แนบใน workspace:\n${messageAttachments.map(attachmentManifestLabel).join("\n")}`
      : "";
    const content = [text, attachmentText].filter(Boolean).join("\n\n");
    const now = formatTime(new Date());
    const userMessage: RoomMessage = {
      author: "คุณ",
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      initials: "ค",
      role: "user",
      text: content,
      time: now,
    };
    const history = [...activeMessages, userMessage];
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: RoomMessage = {
      author: activeRoom.name,
      id: assistantId,
      initials: activeRoom.label.slice(0, 1),
      role: "assistant",
      text: "",
      time: formatTime(new Date()),
    };

    seenMessageIds.current.add(userMessage.id);
    setMessagesByRoom((current) => ({
      ...current,
      [roomId]: [...current[roomId], userMessage, assistantMessage],
    }));
    setTypingByRoom((current) => ({ ...current, [roomId]: true }));
    setRoomError(null);

    const gatewayPayload = JSON.stringify({
      type: "room.message",
      message: userMessage,
    });
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(gatewayPayload);
    }
    void fetch(`/api/rooms/${roomId}/messages`, {
      body: JSON.stringify(userMessage),
      headers: { "content-type": "application/json" },
      method: "POST",
    }).catch(() => undefined);

    try {
      const responseText = await streamPuterChat(
        withAgentProfile(toAgentMessages(history)),
        (partial) => {
          setMessagesByRoom((current) => ({
            ...current,
            [roomId]: current[roomId].map((message) =>
              message.id === assistantId ? { ...message, text: partial } : message,
            ),
          }));
        },
      );
      const finalMessage = { ...assistantMessage, text: responseText };
      seenMessageIds.current.add(finalMessage.id);
      void fetch(`/api/rooms/${roomId}/messages`, {
        body: JSON.stringify(finalMessage),
        headers: { "content-type": "application/json" },
        method: "POST",
      }).catch(() => undefined);
      return true;
    } catch (error) {
      setMessagesByRoom((current) => ({
        ...current,
        [roomId]: current[roomId].filter((message) => message.id !== assistantId),
      }));
      setRoomError(error instanceof Error ? error.message : "Puter ตอบไม่สำเร็จ");
      return false;
    } finally {
      setTypingByRoom((current) => ({ ...current, [roomId]: false }));
    }
  }

  const puterLabel = !puterChecked
    ? "กำลังตรวจ Puter"
    : puterSignedIn
      ? "Puter signed in"
      : "Puter login required";

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              aria-label="กลับหน้าแรก"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              href="/home"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
            </Link>
            <span className="hidden font-mono text-xs font-semibold tracking-[0.18em] text-primary sm:inline">
              {brand.name}
            </span>
            <span className="h-4 w-px bg-border" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">Live rooms</h1>
              <p className="truncate text-xs text-muted-foreground">
                {activeRoom.label} · {activeRoom.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1.5 md:flex">
              <span className={cn("size-2 rounded-full", gatewayStatus === "connected" ? "bg-emerald-500" : "bg-muted-foreground/50")} />
              {gatewayLabel(gatewayStatus)}
            </span>
            <span className="hidden items-center gap-1.5 lg:flex">
              <span className={cn("size-2 rounded-full", puterSignedIn ? "bg-emerald-500" : "bg-amber-500")} />
              {puterLabel}
            </span>
            {!puterSignedIn ? (
              <Button
                onClick={async () => {
                  try {
                    await window.puter?.auth.signIn();
                    setPuterSignedIn(true);
                  } catch (error) {
                    setRoomError(error instanceof Error ? error.message : "Puter login ไม่สำเร็จ");
                  }
                }}
                size="sm"
                variant="outline"
              >
                Login Puter
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-65px)] max-w-[1500px] grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_330px]">
        <aside className="border-b border-border bg-card/25 p-3 lg:border-b-0 lg:border-r lg:p-4">
          <div className="mb-3 flex items-center justify-between px-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Rooms</p>
              <p className="mt-1 text-xs text-muted-foreground">live workspace</p>
            </div>
            <MoreHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
          </div>
          <nav aria-label="เลือกห้อง" className="flex gap-2 overflow-x-auto lg:grid lg:gap-1.5">
            {roomCatalog.map((room) => {
              const active = room.id === activeRoom.id;
              return (
                <button
                  className={cn(
                    "flex min-w-[150px] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors lg:min-w-0",
                    active
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
                  )}
                  key={room.id}
                  onClick={() => selectRoom(room.id)}
                  type="button"
                >
                  <RoomBadge room={room} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{room.label}</span>
                    <span className="mt-0.5 block truncate text-xs">{room.name}</span>
                  </span>
                </button>
              );
            })}
          </nav>
          <Bubble className="mt-4 hidden lg:block" variant="outline">
            <BubbleContent className="text-xs leading-5 text-muted-foreground">
              ห้องใช้ agent profile เดียวกัน แต่เก็บบทสนทนาและไฟล์แยกตาม workspace
            </BubbleContent>
          </Bubble>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <RoomBadge room={activeRoom} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-semibold">{activeRoom.name}</h2>
                  <Hash aria-hidden="true" className="size-3.5 text-muted-foreground" />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{activeRoom.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users aria-hidden="true" className="size-3.5" />
              {members}
              <Button aria-label="ล้างข้อความในห้อง" onClick={() => void clearRoom()} size="icon" variant="ghost">
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <MessageScrollerProvider>
              <MessageScroller className="min-h-0 flex-1">
                <MessageScrollerViewport>
                  <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
                    <MessageScrollerItem>
                      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
                          <ActivityIcon roomId={activeRoom.id} />
                          {gatewayLabel(gatewayStatus)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
                          <Cable aria-hidden="true" className="size-3.5" />
                          {gatewayStatus === "connected" ? "real-time presence" : "local room session"}
                        </span>
                      </div>
                    </MessageScrollerItem>
                    {activeMessages.length === 0 ? (
                      <MessageScrollerItem>
                        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center">
                          <div>
                            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-muted text-muted-foreground">
                              <Hash aria-hidden="true" />
                            </span>
                            <p className="mt-3 font-medium">{activeRoom.label} พร้อมเริ่มแล้ว</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              ส่งข้อความแรกเพื่อเริ่ม live Puter AI conversation
                            </p>
                          </div>
                        </div>
                      </MessageScrollerItem>
                    ) : (
                      <MessageScrollerItem>
                        <MessageGroup>
                          {activeMessages.map((message) => (
                            <Message align={message.role === "user" ? "end" : "start"} key={message.id}>
                              <MessageAvatar className="size-8">
                                {message.role === "user" ? (
                                  <span className="text-xs font-semibold">ค</span>
                                ) : (
                                  <Bot aria-hidden="true" className="size-4 text-primary" />
                                )}
                              </MessageAvatar>
                              <MessageContent className="max-w-[min(760px,86%)]">
                                <MessageHeader>{message.author}</MessageHeader>
                                <div
                                  className={cn(
                                    "whitespace-pre-wrap rounded-2xl border px-3 py-2.5 text-sm leading-6",
                                    message.role === "user"
                                      ? "border-primary/30 bg-primary/10"
                                      : "border-border bg-card",
                                  )}
                                >
                                  {message.text || (
                                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                                      <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                                      กำลังสตรีมคำตอบ...
                                    </span>
                                  )}
                                </div>
                                <MessageFooter>{message.time}</MessageFooter>
                              </MessageContent>
                            </Message>
                          ))}
                        </MessageGroup>
                      </MessageScrollerItem>
                    )}
                    {isTyping ? (
                      <MessageScrollerItem>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Sparkles aria-hidden="true" className="size-3.5 animate-pulse" />
                          SILELO Agent กำลังทำงานผ่าน Puter AI...
                        </div>
                      </MessageScrollerItem>
                    ) : null}
                    <div ref={messagesEndRef} />
                  </MessageScrollerContent>
                </MessageScrollerViewport>
              </MessageScroller>
            </MessageScrollerProvider>

            {roomError ? (
              <p className="mx-auto w-full max-w-3xl px-4 pb-2 text-xs text-destructive sm:px-6" role="alert">
                {roomError}
              </p>
            ) : null}
            <RoomComposer
              disabled={isTyping || !puterSignedIn}
              key={activeRoom.id}
              onAttachmentsChange={setAttachments}
              onSend={sendMessage}
              roomId={activeRoom.id}
              roomName={activeRoom.name}
            />
          </div>
        </section>

        <RuntimePanel
          attachments={attachments}
          roomId={activeRoom.id}
          workspaceId={`workspace-${activeRoom.id}`}
        />
      </div>
    </main>
  );
}
