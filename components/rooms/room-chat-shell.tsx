"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ChevronDown, Loader2, Send, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { rooms } from "@/lib/brand"
import { withAgentProfile, type AgentMessage } from "@/lib/agent-profile"
import { streamPuterChat } from "@/lib/puter-ai"
import { ensureAnonymousSession, getSupabaseBrowserClient } from "@/lib/supabase/client"

type RoomId = "sli" | "work" | "lab"
type MessageRole = "assistant" | "user"
type RoomMessage = {
  id: string
  room_id: RoomId
  sender_id?: string
  client_id?: string | null
  author: string
  initials: string
  role: MessageRole
  text: string
  created_at: string
}
type RoomDefinition = (typeof rooms)[number] & { id: RoomId }

type RoomMessages = Record<RoomId, RoomMessage[]>

const roomCatalog: RoomDefinition[] = [
  { ...rooms[0], id: "sli" },
  { ...rooms[1], id: "work" },
  { ...rooms[2], id: "lab" },
]
const roomTopic = (roomId: RoomId) => `silelo:room:${roomId}`
const normalizeRoomId = (value: string | null): RoomId =>
  value === "work" || value === "lab" ? value : "sli"
const initialsFor = (name: string) => name.trim().slice(0, 2).toUpperCase() || "G"
const toAgentMessages = (messages: RoomMessage[]): AgentMessage[] =>
  messages.map(({ role, text }) => ({ role, content: text }))

function isInternalDebugMessage(text: string) {
  const markers = [
    "SlieQwenBoss",
    "agent/agent.ts",
    "tools/index.ts",
    "services/llm.js",
    "detectIntent()",
    "memory.init()",
    "agent/services/",
    "run/search",
    "แก้โค้ด Agent ให้รันได้จริง",
    "สร้างไฟล์ที่หาย",
    "ข้อเสนอแนะเร่งด่วน",
  ]
  return markers.filter((marker) => text.includes(marker)).length >= 2
}

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof Error && /auth|login|sign.?in|puter/i.test(error.message)) {
    return "เข้าสู่ระบบ Puter ก่อนเริ่มแชท"
  }
  return fallback
}

export function RoomChatShell() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedRoomId = normalizeRoomId(searchParams.get("room"))
  const [activeRoomId, setActiveRoomId] = useState<RoomId>(requestedRoomId)
  const [messagesByRoom, setMessagesByRoom] = useState<RoomMessages>({
    sli: [],
    work: [],
    lab: [],
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [puterSignedIn, setPuterSignedIn] = useState(false)
  const [puterChecked, setPuterChecked] = useState(false)
  const [members, setMembers] = useState(1)
  const [typing, setTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadingRoom, setLoadingRoom] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [nameChecked, setNameChecked] = useState(false)
  const [draft, setDraft] = useState("")
  const [signingIn, setSigningIn] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null>(null)
  const seenIds = useRef(new Set<string>())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeRoom = useMemo(
    () => roomCatalog.find((room) => room.id === activeRoomId) ?? roomCatalog[0],
    [activeRoomId],
  )
  const activeMessages = messagesByRoom[activeRoom.id]

  useEffect(() => setActiveRoomId(requestedRoomId), [requestedRoomId])

  useEffect(() => {
    try {
      setDisplayName(window.localStorage.getItem("silelo-room-name") ?? "")
    } finally {
      setNameChecked(true)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const checkPuter = () => {
      if (cancelled) return
      const puter = window.puter
      if (!puter) {
        setPuterChecked(true)
        return
      }

      void Promise.resolve(puter.auth.isSignedIn())
        .then((signedIn) => {
          if (cancelled) return
          setPuterSignedIn(Boolean(signedIn))
          setPuterChecked(true)
        })
        .catch(() => {
          if (!cancelled) setPuterChecked(true)
        })
    }

    checkPuter()
    const retryTimer = window.setTimeout(checkPuter, 500)

    return () => {
      cancelled = true
      window.clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: sending ? "smooth" : "auto" })
  }, [activeMessages, sending, typing])

  const addMessage = useCallback((message: RoomMessage) => {
    if (isInternalDebugMessage(message.text)) return
    if (
      seenIds.current.has(message.id) ||
      (message.client_id && seenIds.current.has(`client:${message.client_id}`))
    ) {
      return
    }

    seenIds.current.add(message.id)
    if (message.client_id) seenIds.current.add(`client:${message.client_id}`)

    setMessagesByRoom((current) => {
      const existing = current[message.room_id] ?? []
      const withoutDuplicate = existing.filter(
        (item) => item.id !== message.id && item.id !== message.client_id && item.client_id !== message.client_id,
      )
      return {
        ...current,
        [message.room_id]: [...withoutDuplicate, message],
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    const supabase = getSupabaseBrowserClient()
    const roomId = activeRoom.id
    setLoadingRoom(true)
    setRoomError(null)
    setMembers(1)

    const loadRoom = async () => {
      try {
        const user = await ensureAnonymousSession().catch(() => null)
        if (cancelled) return

        setUserId(user?.id ?? null)
        const { data, error } = await supabase
          .from("room_messages")
          .select("id,room_id,sender_id,client_id,author,initials,role,text,created_at")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true })
          .limit(200)

        if (error) throw error
        if (cancelled) return

        const roomMessages = (data as RoomMessage[]).filter(
          (message) => !isInternalDebugMessage(message.text),
        )
        setMessagesByRoom((current) => ({ ...current, [roomId]: roomMessages }))
        roomMessages.forEach((message) => {
          seenIds.current.add(message.id)
          if (message.client_id) seenIds.current.add(`client:${message.client_id}`)
        })

        const presenceKey = user?.id ?? `guest-${crypto.randomUUID()}`
        const channel = supabase
          .channel(roomTopic(roomId), {
            config: {
              broadcast: { self: false },
              presence: { key: presenceKey },
            },
          })
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "room_messages",
              filter: `room_id=eq.${roomId}`,
            },
            ({ new: row }) => addMessage(row as RoomMessage),
          )
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            if (payload?.userId !== presenceKey) {
              setTyping(Boolean(payload?.isTyping))
              window.setTimeout(() => setTyping(false), 1800)
            }
          })
          .on("presence", { event: "sync" }, () => {
            setMembers(Object.keys(channel.presenceState()).length || 1)
          })
          .on("presence", { event: "join" }, () => {
            setMembers(Object.keys(channel.presenceState()).length || 1)
          })
          .on("presence", { event: "leave" }, () => {
            setMembers(Math.max(1, Object.keys(channel.presenceState()).length))
          })

        channelRef.current = channel
        await channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ userId: presenceKey })
          }
        })
      } catch {
        if (!cancelled) setRoomError("เชื่อมต่อห้องไม่สำเร็จ ลองรีเฟรชอีกครั้ง")
      } finally {
        if (!cancelled) setLoadingRoom(false)
      }
    }

    void loadRoom()

    return () => {
      cancelled = true
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [activeRoom.id, addMessage])

  async function insertMessage(message: Omit<RoomMessage, "id" | "created_at">) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("room_messages")
      .insert(message as never)
      .select("id,room_id,sender_id,client_id,author,initials,role,text,created_at")
      .single()

    if (error) throw error
    addMessage(data as RoomMessage)
  }

  async function signIn() {
    if (signingIn) return
    setRoomError(null)

    if (!window.puter) {
      setRoomError("กำลังโหลดบริการเข้าสู่ระบบ ลองอีกครั้ง")
      return
    }

    setSigningIn(true)
    try {
      await window.puter.auth.signIn()
      setPuterSignedIn(true)
    } catch (error) {
      setRoomError(friendlyError(error, "เข้าสู่ระบบ Puter ไม่สำเร็จ ลองอีกครั้ง"))
    } finally {
      setSigningIn(false)
    }
  }

  async function sendMessage() {
    const text = draft.trim()
    if (!text || sending) return
    if (!puterSignedIn) {
      setRoomError("เข้าสู่ระบบ Puter ก่อนเริ่มแชท")
      return
    }

    const roomId = activeRoom.id
    const clientId = crypto.randomUUID()
    const userMessage: Omit<RoomMessage, "id" | "created_at"> = {
      room_id: roomId,
      sender_id: userId ?? undefined,
      client_id: clientId,
      author: displayName || "คุณ",
      initials: initialsFor(displayName),
      role: "user",
      text,
    }
    const optimistic: RoomMessage = {
      ...userMessage,
      id: `optimistic-${clientId}`,
      created_at: new Date().toISOString(),
    }
    const history = [...activeMessages, optimistic]

    setSending(true)
    setRoomError(null)
    setTyping(true)
    setDraft("")
    setMessagesByRoom((current) => ({ ...current, [roomId]: history }))
    seenIds.current.add(`client:${clientId}`)

    try {
      await insertMessage(userMessage)
      const responseText = await streamPuterChat(
        withAgentProfile(toAgentMessages(history)),
        (partial) =>
          setMessagesByRoom((current) => ({
            ...current,
            [roomId]: [
              ...current[roomId].filter((message) => !message.id.startsWith(`assistant-${clientId}`)),
              {
                id: `assistant-${clientId}`,
                room_id: roomId,
                sender_id: userId ?? undefined,
                client_id: `assistant-${clientId}`,
                author: activeRoom.name,
                initials: initialsFor(activeRoom.label),
                role: "assistant",
                text: partial,
                created_at: new Date().toISOString(),
              },
            ],
          })),
      )
      await insertMessage({
        room_id: roomId,
        sender_id: userId ?? undefined,
        client_id: `assistant-${clientId}`,
        author: activeRoom.name,
        initials: initialsFor(activeRoom.label),
        role: "assistant",
        text: responseText,
      })
    } catch (error) {
      setMessagesByRoom((current) => ({
        ...current,
        [roomId]: current[roomId].filter(
          (message) =>
            message.client_id !== clientId &&
            message.client_id !== `assistant-${clientId}` &&
            !message.id.startsWith(`assistant-${clientId}`),
        ),
      }))
      setRoomError(friendlyError(error, "ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้ง"))
    } finally {
      setSending(false)
      setTyping(false)
    }
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      event.keyCode !== 229
    ) {
      event.preventDefault()
      void sendMessage()
    }
  }

  function handleNameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = nameInput.trim()
    if (!name) return

    try {
      window.localStorage.setItem("silelo-room-name", name)
    } catch {
      // The room can still work when browser storage is unavailable.
    }
    setDisplayName(name)
  }

  if (!nameChecked) {
    return (
      <main className="dark grid min-h-dvh place-items-center bg-background px-5 text-foreground">
        <Loader2 aria-label="กำลังเปิดห้อง" className="size-5 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!displayName) {
    return (
      <main className="dark grid min-h-dvh place-items-center bg-background px-5 text-foreground">
        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/20"
          initial={{ opacity: 0, y: 16 }}
          onSubmit={handleNameSubmit}
        >
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-lg font-semibold text-primary">
              S
            </span>
            <div>
              <p className="text-base font-semibold">{activeRoom.label}</p>
              <p className="text-xs text-muted-foreground">{activeRoom.name}</p>
            </div>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">ยินดีต้อนรับ</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            ตั้งชื่อของคุณก่อนเริ่มบทสนทนา
          </p>
          <label className="sr-only" htmlFor="room-name">
            ชื่อของคุณ
          </label>
          <input
            autoFocus
            className="mt-7 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
            id="room-name"
            onChange={(event) => setNameInput(event.target.value)}
            placeholder="ใส่ชื่อของคุณ..."
            value={nameInput}
          />
          <button
            className="mt-3 h-12 w-full rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!nameInput.trim()}
            type="submit"
          >
            เข้าห้องแชท
          </button>
        </motion.form>
      </main>
    )
  }

  return (
    <main className="dark flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 shrink-0 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-4">
          <Link
            aria-label="กลับหน้าแรก"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            href="/home"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Link>

          <div className="relative min-w-0 flex-1">
            <div className="relative w-fit max-w-full">
              <label className="sr-only" htmlFor="room-selector">
                เลือกห้องแชท
              </label>
              <select
                aria-label="เลือกห้องแชท"
                className="w-full max-w-[8.5rem] appearance-none truncate bg-transparent pr-5 text-sm font-semibold outline-none disabled:opacity-60"
                disabled={sending}
                id="room-selector"
                onChange={(event) => {
                  const nextRoom = normalizeRoomId(event.target.value)
                  setActiveRoomId(nextRoom)
                  router.replace(`/rooms?room=${nextRoom}`, { scroll: false })
                }}
                value={activeRoom.id}
              >
                {roomCatalog.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.label} · {room.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              {members} ออนไลน์
            </p>
          </div>

          {puterChecked && !puterSignedIn ? (
            <button
              className="inline-flex h-8 shrink-0 items-center rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              disabled={signingIn}
              onClick={() => void signIn()}
              type="button"
            >
              {signingIn ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : "เข้าสู่ระบบ"}
            </button>
          ) : puterChecked ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              พร้อม
            </span>
          ) : (
            <Loader2 aria-label="กำลังตรวจสอบการเข้าสู่ระบบ" className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 pb-5 pt-5">
          {loadingRoom ? (
            <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted-foreground">
              <span className="flex items-center gap-2" role="status">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                กำลังเปิดห้อง...
              </span>
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-20 text-center">
              <div className="max-w-xs">
                <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-border bg-card text-primary">
                  <Sparkles aria-hidden="true" className="size-5" />
                </div>
                <p className="text-base font-medium">เริ่มต้นบทสนทนา</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  คุยกับ {activeRoom.name} ได้เลย พิมพ์ข้อความแรกของคุณด้านล่าง
                </p>
                {!puterSignedIn && puterChecked ? (
                  <button
                    className="mt-5 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    disabled={signingIn}
                    onClick={() => void signIn()}
                    type="button"
                  >
                    เข้าสู่ระบบ Puter
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {activeMessages.map((message) => (
                <motion.article
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`mb-4 flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  key={message.id}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className={`flex max-w-[82%] flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                    {message.role === "assistant" ? (
                      <div className="mb-1.5 flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                        <span className="grid size-5 place-items-center rounded-md bg-primary/15 text-[9px] font-semibold text-primary">
                          {message.initials}
                        </span>
                        <span>{message.author}</span>
                      </div>
                    ) : null}
                    <div
                      className={`whitespace-pre-wrap break-words rounded-[1.35rem] px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border/80 bg-card text-card-foreground"
                      }`}
                    >
                      {message.text}
                    </div>
                    {message.role === "user" ? (
                      <span className="mt-1 px-1 text-[10px] text-muted-foreground">คุณ</span>
                    ) : null}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          )}

          {typing || sending ? (
            <div className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground" role="status">
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              กำลังตอบกลับ...
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border/70 bg-background/95 px-3 pt-3 backdrop-blur-[12px] [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-2xl">
          {roomError ? (
            <div
              className="mb-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive"
              role="alert"
            >
              {roomError}
            </div>
          ) : null}
          <form
            aria-busy={sending}
            className="flex items-end gap-2 rounded-2xl border border-input bg-card p-1.5 shadow-lg shadow-black/10"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage()
            }}
          >
            <label className="sr-only" htmlFor="room-message">
              ข้อความ
            </label>
            <textarea
              aria-label="พิมพ์ข้อความในห้องแชท"
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={sending}
              id="room-message"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="พิมพ์ข้อความ..."
              rows={1}
              value={draft}
            />
            <button
              aria-label="ส่งข้อความ"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!draft.trim() || sending}
              type="submit"
            >
              {sending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="size-4" />
              )}
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่
          </p>
        </div>
      </div>
    </main>
  )
}
