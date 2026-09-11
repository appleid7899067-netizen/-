"use client";

import {
  ArrowLeft,
  Bot,
  Check,
  CirclePlus,
  Hash,
  MoreHorizontal,
  Send,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Bubble,
  BubbleContent,
} from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import {
  Marker,
  MarkerContent,
  MarkerIcon,
} from "@/components/ui/marker";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Input } from "@/components/ui/input";
import { brand, rooms } from "@/lib/brand";
import { cn } from "@/lib/utils";

type RoomId = "sli" | "work" | "lab";
type MessageRole = "assistant" | "user";
type ActivityIconName = "sparkles" | "zap" | "check";

type RoomMessage = {
  author: string;
  id: string;
  initials: string;
  kind: "message";
  role: MessageRole;
  text: string;
  time: string;
};

type RoomActivity = {
  icon: ActivityIconName;
  id: string;
  kind: "activity";
  text: string;
  time: string;
};

type TimelineItem = RoomActivity | RoomMessage;

type RoomDefinition = (typeof rooms)[number] & { id: RoomId };

const roomCatalog: RoomDefinition[] = [
  { ...rooms[0], id: "sli" },
  { ...rooms[1], id: "work" },
  { ...rooms[2], id: "lab" },
];

const initialMessages: Record<RoomId, TimelineItem[]> = {
  sli: [
    {
      icon: "sparkles",
      id: "sli-activity-1",
      kind: "activity",
      text: "ห้องส่วนตัวพร้อมใช้งาน",
      time: "08:41",
    },
    {
      author: "SILELO",
      id: "sli-message-1",
      initials: "S",
      kind: "message",
      role: "assistant",
      text: "สวัสดีค่ะ ห้องนี้ไว้คุยเรื่องส่วนตัวแบบสบาย ๆ มีอะไรให้ช่วยจัดความคิดได้เลยนะคะ",
      time: "08:42",
    },
    {
      author: "คุณ",
      id: "sli-message-2",
      initials: "ค",
      kind: "message",
      role: "user",
      text: "ช่วยจัดลำดับสิ่งที่ต้องทำวันนี้ให้หน่อย",
      time: "08:43",
    },
    {
      author: "SILELO",
      id: "sli-message-3",
      initials: "S",
      kind: "message",
      role: "assistant",
      text: "ได้เลยค่ะ เริ่มจากงานที่สำคัญที่สุดก่อน แล้วค่อยแบ่งเป็นช่วงสั้น ๆ ให้ทำต่อเนื่องได้โดยไม่กดดันเกินไป",
      time: "08:43",
    },
  ],
  work: [
    {
      icon: "zap",
      id: "work-activity-1",
      kind: "activity",
      text: "WORK room initialized",
      time: "09:10",
    },
    {
      author: "SILELO WORK",
      id: "work-message-1",
      initials: "W",
      kind: "message",
      role: "assistant",
      text: "พร้อมช่วยวางแผนงาน สรุปบรีฟ หรือแตกงานให้ทีมแล้วค่ะ",
      time: "09:11",
    },
    {
      author: "คุณ",
      id: "work-message-2",
      initials: "ค",
      kind: "message",
      role: "user",
      text: "ช่วยสรุปแผนเปิดตัวฟีเจอร์ใหม่เป็น 3 ขั้นตอน",
      time: "09:12",
    },
    {
      author: "SILELO WORK",
      id: "work-message-3",
      initials: "W",
      kind: "message",
      role: "assistant",
      text: "1) ยืนยันขอบเขต  2) ทดสอบกับกลุ่มเล็ก  3) เปิดใช้งานพร้อมติดตามผลค่ะ",
      time: "09:12",
    },
  ],
  lab: [
    {
      icon: "check",
      id: "lab-activity-1",
      kind: "activity",
      text: "LAB sandbox is ready",
      time: "10:02",
    },
    {
      author: "SILELO LAB",
      id: "lab-message-1",
      initials: "L",
      kind: "message",
      role: "assistant",
      text: "ยินดีต้อนรับสู่ห้องทดลอง ลองโยนไอเดียแปลกใหม่เข้ามาได้เลยค่ะ",
      time: "10:03",
    },
    {
      author: "คุณ",
      id: "lab-message-2",
      initials: "ค",
      kind: "message",
      role: "user",
      text: "ถ้าให้ห้องนี้ช่วยคิดชื่อโปรเจกต์ จะเริ่มอย่างไรดี",
      time: "10:04",
    },
    {
      author: "SILELO LAB",
      id: "lab-message-3",
      initials: "L",
      kind: "message",
      role: "assistant",
      text: "เริ่มจากอารมณ์ของโปรเจกต์ กลุ่มคนที่จะใช้ และคำสั้น ๆ ที่อยากให้คนจำได้ แล้วเราค่อยทดลองหลายแนวค่ะ",
      time: "10:04",
    },
  ],
};

const initialTypingState: Record<RoomId, boolean> = {
  lab: false,
  sli: false,
  work: false,
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

function getMockReply(roomId: RoomId, text: string) {
  const shortText = text.length > 54 ? `${text.slice(0, 54)}…` : text;

  if (roomId === "work") {
    return `รับบรีฟ “${shortText}” แล้วค่ะ เดี๋ยวฉันแยกเป็นขั้นตอนที่ทำต่อได้ทันทีให้`;
  }

  if (roomId === "lab") {
    return `ไอเดีย “${shortText}” น่าสนใจค่ะ ลองแตกออกเป็นหลายทางเลือกแล้วค่อยเลือกแนวที่ใช่กัน`;
  }

  return `รับไว้แล้วค่ะ เรื่อง “${shortText}” เราค่อย ๆ จัดการทีละส่วนด้วยกันได้เลย`;
}

function ActivityIcon({ name }: { name: ActivityIconName }) {
  if (name === "zap") return <Zap aria-hidden="true" />;
  if (name === "check") return <Check aria-hidden="true" />;
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

export function RoomChatShell() {
  const searchParams = useSearchParams();
  const requestedRoomId = normalizeRoomId(searchParams.get("room"));
  const [activeRoomId, setActiveRoomId] = useState<RoomId>(requestedRoomId);
  const [draft, setDraft] = useState("");
  const [messagesByRoom, setMessagesByRoom] =
    useState<Record<RoomId, TimelineItem[]>>(initialMessages);
  const [typingByRoom, setTypingByRoom] =
    useState<Record<RoomId, boolean>>(initialTypingState);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setActiveRoomId(requestedRoomId);
  }, [requestedRoomId]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const activeRoom = useMemo(
    () => roomCatalog.find((room) => room.id === activeRoomId) ?? roomCatalog[0],
    [activeRoomId],
  );
  const activeMessages = messagesByRoom[activeRoom.id];
  const isTyping = typingByRoom[activeRoom.id];

  function selectRoom(roomId: RoomId) {
    setActiveRoomId(roomId);
    setDraft("");
    window.history.replaceState(null, "", `/rooms?room=${roomId}`);
  }

  function clearRoom() {
    setMessagesByRoom((current) => ({ ...current, [activeRoom.id]: [] }));
    setTypingByRoom((current) => ({ ...current, [activeRoom.id]: false }));
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text || isTyping) return;

    const roomId = activeRoom.id;
    const now = formatTime(new Date());
    const message: RoomMessage = {
      author: "คุณ",
      id: `user-${Date.now()}`,
      initials: "ค",
      kind: "message",
      role: "user",
      text,
      time: now,
    };

    setMessagesByRoom((current) => ({
      ...current,
      [roomId]: [...current[roomId], message],
    }));
    setDraft("");
    setTypingByRoom((current) => ({ ...current, [roomId]: true }));

    const timeoutId = window.setTimeout(() => {
      const reply: RoomMessage = {
        author: activeRoom.name,
        id: `assistant-${Date.now()}`,
        initials: activeRoom.label.slice(0, 1),
        kind: "message",
        role: "assistant",
        text: getMockReply(roomId, text),
        time: formatTime(new Date()),
      };

      setMessagesByRoom((current) => ({
        ...current,
        [roomId]: [...current[roomId], reply],
      }));
      setTypingByRoom((current) => ({ ...current, [roomId]: false }));
      timers.current = timers.current.filter((timer) => timer !== timeoutId);
    }, 700);

    timers.current.push(timeoutId);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    sendMessage();
  }

  return (
    <div className="dark h-dvh max-h-dvh overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full min-h-0 max-w-[1600px] overflow-hidden border-x border-border bg-background">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/35 lg:flex">
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Link className="flex min-w-0 items-center gap-3" href="/home">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                S
              </span>
              <span className="truncate font-semibold tracking-tight">
                {brand.name}
              </span>
            </Link>
            <span className="rounded-full border border-border px-2 py-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              Demo
            </span>
          </div>

          <div className="flex items-center justify-between px-4 pb-3 pt-6">
            <div>
              <p className="text-sm font-semibold">ห้องแชท</p>
              <p className="mt-1 text-xs text-muted-foreground">
                เลือกพื้นที่สำหรับการคุย
              </p>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              3 ห้อง
            </span>
          </div>

          <nav aria-label="เลือกห้องแชท" className="flex flex-col gap-1 px-3">
            {roomCatalog.map((room) => {
              const isActive = room.id === activeRoom.id;
              return (
                <Button
                  className={cn(
                    "h-auto w-full justify-start gap-3 rounded-xl px-3 py-3 text-left",
                    isActive && "bg-muted text-foreground",
                  )}
                  key={room.id}
                  onClick={() => selectRoom(room.id)}
                  variant="ghost"
                >
                  <RoomBadge room={room} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {room.name}
                      </span>
                      {isActive ? (
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">
                      {room.label} · 4 สมาชิก
                    </span>
                  </span>
                </Button>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-border p-4">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <Bot aria-hidden="true" className="text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">โหมดจำลอง</p>
                <p className="truncate text-xs text-muted-foreground">
                  ข้อความอยู่เฉพาะหน้านี้
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-10 flex min-h-16 items-center gap-3 border-b border-border bg-background/90 px-3 backdrop-blur sm:px-5">
            <Link
              aria-label="กลับหน้าแรก"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              href="/home"
            >
              <ArrowLeft aria-hidden="true" />
            </Link>
            <RoomBadge room={activeRoom} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold sm:text-base">
                  {activeRoom.name}
                </h1>
                <span className="hidden rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase sm:inline-flex">
                  {activeRoom.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="mr-1 inline-block size-1.5 rounded-full bg-primary align-middle" />
                จำลองการสนทนา · พร้อมตอบกลับ
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                <Users aria-hidden="true" /> 4 สมาชิก
              </span>
              <Button
                aria-label="ล้างข้อความในห้อง"
                onClick={clearRoom}
                size="icon-sm"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            <Button
              aria-label="ตัวเลือกห้อง"
              className="sm:hidden"
              size="icon-sm"
              variant="ghost"
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </header>

          <div className="flex gap-2 overflow-x-auto border-b border-border px-3 py-2 lg:hidden">
            {roomCatalog.map((room) => (
              <button
                aria-label={`เปิด${room.name}`}
                aria-pressed={room.id === activeRoom.id}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors",
                  room.id === activeRoom.id &&
                    "border-primary/40 bg-primary/10 text-foreground",
                )}
                key={room.id}
                onClick={() => selectRoom(room.id)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-[color:var(--room-accent)]"
                  style={{ "--room-accent": room.accent } as React.CSSProperties}
                />
                {room.name}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1">
            <MessageScrollerProvider autoScroll defaultScrollPosition="end">
              <MessageScroller>
                <MessageScrollerViewport
                  aria-label={`ข้อความใน${activeRoom.name}`}
                  role="log"
                >
                  <MessageScrollerContent className="mx-auto w-full max-w-3xl p-4 pb-10 sm:p-6 sm:pb-12">
                    <MessageScrollerItem scrollAnchor>
                      <Marker className="px-2 text-xs" variant="separator">
                        <MarkerIcon>
                          <Hash aria-hidden="true" />
                        </MarkerIcon>
                        <MarkerContent>
                          วันนี้ · เริ่มต้นการสนทนาใน{activeRoom.name}
                        </MarkerContent>
                      </Marker>
                    </MessageScrollerItem>

                    {activeMessages.length > 0 ? (
                      <MessageGroup>
                        {activeMessages.map((item) => {
                          if (item.kind === "activity") {
                            return (
                              <MessageScrollerItem key={item.id}>
                                <Marker className="text-xs" variant="border">
                                  <MarkerIcon>
                                    <ActivityIcon name={item.icon} />
                                  </MarkerIcon>
                                  <MarkerContent>
                                    {item.text}
                                    <span className="ml-2 text-[11px] text-muted-foreground/70">
                                      {item.time}
                                    </span>
                                  </MarkerContent>
                                </Marker>
                              </MessageScrollerItem>
                            );
                          }

                          const isUser = item.role === "user";
                          return (
                            <MessageScrollerItem key={item.id}>
                              <Message align={isUser ? "end" : "start"}>
                                {!isUser ? (
                                  <MessageAvatar className="size-8 bg-primary/10 text-primary">
                                    {item.initials}
                                  </MessageAvatar>
                                ) : null}
                                <MessageContent className="max-w-[88%] sm:max-w-[78%]">
                                  {!isUser ? (
                                    <MessageHeader className="gap-2 px-1 text-xs">
                                      <span className="font-semibold text-foreground">
                                        {item.author}
                                      </span>
                                      <span>· {item.time}</span>
                                    </MessageHeader>
                                  ) : null}
                                  <Bubble
                                    align={isUser ? "end" : "start"}
                                    variant={isUser ? "default" : "outline"}
                                  >
                                    <BubbleContent
                                      className={cn(
                                        "text-sm leading-6 sm:text-[15px]",
                                        isUser
                                          ? "border-primary/30"
                                          : "border-border bg-card/70",
                                      )}
                                    >
                                      {item.text}
                                    </BubbleContent>
                                  </Bubble>
                                  <MessageFooter className="gap-1 px-1 text-[11px]">
                                    {isUser ? "ส่งแล้ว" : item.time}
                                    {isUser ? (
                                      <Check aria-hidden="true" />
                                    ) : null}
                                  </MessageFooter>
                                </MessageContent>
                              </Message>
                            </MessageScrollerItem>
                          );
                        })}
                      </MessageGroup>
                    ) : (
                      <MessageScrollerItem>
                        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center">
                          <span className="grid size-11 place-items-center rounded-2xl bg-muted text-muted-foreground">
                            <Hash aria-hidden="true" />
                          </span>
                          <div>
                            <p className="font-medium">ห้องนี้ยังว่างอยู่</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              เริ่มข้อความแรกของคุณได้จากช่องด้านล่าง
                            </p>
                          </div>
                        </div>
                      </MessageScrollerItem>
                    )}

                    {isTyping ? (
                      <MessageScrollerItem>
                        <Marker className="text-xs" variant="default">
                          <MarkerIcon>
                            <Sparkles aria-hidden="true" className="animate-pulse" />
                          </MarkerIcon>
                          <MarkerContent>กำลังร่างคำตอบจำลอง…</MarkerContent>
                        </Marker>
                      </MessageScrollerItem>
                    ) : null}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
              </MessageScroller>
            </MessageScrollerProvider>
          </div>

          <div className="border-t border-border bg-background/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:p-4">
            <form
              className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-input bg-card/80 p-1.5 shadow-lg shadow-background/20"
              onSubmit={handleSubmit}
            >
              <Button
                aria-label="เพิ่มไฟล์"
                disabled
                size="icon"
                type="button"
                variant="ghost"
              >
                <CirclePlus aria-hidden="true" />
              </Button>
              <Input
                aria-label="พิมพ์ข้อความในห้องจำลอง"
                autoComplete="off"
                className="h-10 border-0 bg-transparent px-1 shadow-none focus-visible:border-0 focus-visible:ring-0"
                disabled={isTyping}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`ส่งข้อความใน${activeRoom.name}...`}
                value={draft}
              />
              <Button
                aria-label="ส่งข้อความ"
                disabled={!draft.trim() || isTyping}
                size="icon"
                type="submit"
              >
                <Send aria-hidden="true" />
              </Button>
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
              ห้องจำลองสำหรับทดลองหน้าตาและการโต้ตอบ · ไม่เรียกโมเดลหรือเก็บข้อมูล
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
