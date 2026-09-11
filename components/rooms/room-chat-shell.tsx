"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Check, Loader2, MoreHorizontal, Send, Sparkles, Users, Zap } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from "@/components/ui/message"
import { brand, rooms } from "@/lib/brand"
import { withAgentProfile, type AgentMessage } from "@/lib/agent-profile"
import { streamPuterChat } from "@/lib/puter-ai"
import { ensureAnonymousSession, getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type RoomId = "sli" | "work" | "lab"
type MessageRole = "assistant" | "user"
type RoomMessage = { id: string; room_id: RoomId; sender_id?: string; client_id?: string | null; author: string; initials: string; role: MessageRole; text: string; created_at: string }
type RoomDefinition = (typeof rooms)[number] & { id: RoomId }

const roomCatalog: RoomDefinition[] = [{ ...rooms[0], id: "sli" }, { ...rooms[1], id: "work" }, { ...rooms[2], id: "lab" }]
const roomCopy: Record<RoomId, string> = { sli: "วางพรอมต์ สร้างแอปจริง", work: "ทำงานร่วมกันแบบสด", lab: "ทดลองไอเดียใหม่" }
const roomTopic = (roomId: RoomId) => `silelo:room:${roomId}`
const formatTime = (date: Date) => new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(date)
const normalizeRoomId = (value: string | null): RoomId => value === "work" || value === "lab" ? value : "sli"
const messageTime = (value: string) => formatTime(new Date(value))

function toAgentMessages(messages: RoomMessage[]): AgentMessage[] { return messages.map(({ role, text }) => ({ role, content: text })) }
function initialsFor(name: string) { return name.trim().slice(0, 2).toUpperCase() || "G" }

export function RoomChatShell() {
  const searchParams = useSearchParams()
  const requestedRoomId = normalizeRoomId(searchParams.get("room"))
  const [activeRoomId, setActiveRoomId] = useState<RoomId>(requestedRoomId)
  const [messagesByRoom, setMessagesByRoom] = useState<Record<RoomId, RoomMessage[]>>({ sli: [], work: [], lab: [] })
  const [userId, setUserId] = useState<string | null>(null)
  const [puterSignedIn, setPuterSignedIn] = useState(false)
  const [puterChecked, setPuterChecked] = useState(false)
  const [status, setStatus] = useState<"checking" | "live" | "offline" | "error">("checking")
  const [members, setMembers] = useState(1)
  const [typing, setTyping] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null>(null)
  const seenIds = useRef(new Set<string>())
  const endRef = useRef<HTMLDivElement>(null)

  const activeRoom = useMemo(() => roomCatalog.find((room) => room.id === activeRoomId) ?? roomCatalog[0], [activeRoomId])
  const activeMessages = messagesByRoom[activeRoom.id]

  useEffect(() => { setActiveRoomId(requestedRoomId) }, [requestedRoomId])

  useEffect(() => {
    let mounted = true
    const puter = window.puter
    if (!puter) { setPuterChecked(true); return }
    void Promise.resolve(puter.auth.isSignedIn()).then((signedIn) => { if (mounted) { setPuterSignedIn(Boolean(signedIn)); setPuterChecked(true) } }).catch(() => mounted && setPuterChecked(true))
    return () => { mounted = false }
  }, [])

  const addMessage = useCallback((message: RoomMessage) => {
    if (seenIds.current.has(message.id)) return
    if (message.client_id && seenIds.current.has(`client:${message.client_id}`)) return
    seenIds.current.add(message.id)
    if (message.client_id) seenIds.current.add(`client:${message.client_id}`)
    setMessagesByRoom((current) => ({ ...current, [message.room_id]: [...current[message.room_id].filter((item) => item.client_id !== message.client_id), message] }))
  }, [])

  useEffect(() => {
    let cancelled = false
    const supabase = getSupabaseBrowserClient()
    setStatus("checking")
    void ensureAnonymousSession().catch(() => null).then(async (user) => {
      if (cancelled) return
      setUserId(user?.id ?? null)
      const { data, error } = await supabase.from("room_messages").select("id,room_id,sender_id,client_id,author,initials,role,text,created_at").eq("room_id", activeRoom.id).order("created_at", { ascending: true }).limit(200)
      if (error) throw error
      if (!cancelled) { setMessagesByRoom((current) => ({ ...current, [activeRoom.id]: data as RoomMessage[] })); (data as RoomMessage[]).forEach((message) => { seenIds.current.add(message.id); if (message.client_id) seenIds.current.add(`client:${message.client_id}`) }) }
      const presenceKey = user?.id ?? `guest-${crypto.randomUUID()}`
      const channel = supabase.channel(roomTopic(activeRoom.id), { config: { broadcast: { self: false }, presence: { key: presenceKey } } })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${activeRoom.id}` }, ({ new: row }) => addMessage(row as RoomMessage))
        .on("broadcast", { event: "typing" }, ({ payload }) => { if (payload?.userId !== presenceKey) { setTyping(Boolean(payload?.isTyping)); window.setTimeout(() => setTyping(false), 1800) } })
        .on("presence", { event: "sync" }, () => setMembers(Object.keys(channel.presenceState()).length || 1))
        .on("presence", { event: "join" }, () => setMembers(Object.keys(channel.presenceState()).length || 1))
        .on("presence", { event: "leave" }, () => setMembers(Math.max(1, Object.keys(channel.presenceState()).length)))
      channelRef.current = channel
      await channel.subscribe(async (subscriptionStatus) => {
        if (subscriptionStatus === "SUBSCRIBED") { setStatus("live"); await channel.track({ userId: presenceKey, joinedAt: new Date().toISOString() }) }
        if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") setStatus("error")
      })
    }).catch((error) => { if (!cancelled) { setStatus("offline"); setRoomError(error instanceof Error ? error.message : "เชื่อมต่อห้องไม่สำเร็จ") } })
    return () => { cancelled = true; if (channelRef.current) { void supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [activeRoom.id, addMessage])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [activeMessages, typing])

  function selectRoom(roomId: RoomId) { setActiveRoomId(roomId); setRoomError(null); window.history.replaceState(null, "", `/rooms?room=${roomId}`) }

  async function insertMessage(message: Omit<RoomMessage, "id" | "created_at">) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("room_messages").insert(message as never).select("id,room_id,sender_id,client_id,author,initials,role,text,created_at").single()
    if (error) throw error
    addMessage(data as RoomMessage)
    return data as RoomMessage
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return
    if (!puterSignedIn) { setRoomError("เข้าสู่ระบบ Puter ก่อนเริ่มแชทกับ Agent"); return }

    const roomId = activeRoom.id
    const clientId = crypto.randomUUID()
    const userMessage: Omit<RoomMessage, "id" | "created_at"> = { room_id: roomId, sender_id: userId ?? null, client_id: clientId, author: "คุ���", initials: "ค", role: "user", text: text.trim() }
    const history = [...activeMessages, { ...userMessage, id: `optimistic-${clientId}`, created_at: new Date().toISOString() } as RoomMessage]
    setSending(true); setRoomError(null); setTyping(true)
    setMessagesByRoom((current) => ({ ...current, [roomId]: history }))
    seenIds.current.add(`client:${clientId}`)
    await channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: userId ?? `guest-${clientId}`, isTyping: true } })
    try {
      await insertMessage(userMessage)
      const responseText = await streamPuterChat(withAgentProfile(toAgentMessages(history)), (partial) => setMessagesByRoom((current) => ({ ...current, [roomId]: [...current[roomId].filter((message) => !message.id.startsWith("assistant-")), { id: `assistant-${clientId}`, room_id: roomId, sender_id: userId, author: activeRoom.name, initials: initialsFor(activeRoom.label), role: "assistant", text: partial, created_at: new Date().toISOString() }] })))
      await insertMessage({ room_id: roomId, sender_id: userId, client_id: `assistant-${clientId}`, author: activeRoom.name, initials: initialsFor(activeRoom.label), role: "assistant", text: responseText })
    } catch (error) { setMessagesByRoom((current) => ({ ...current, [roomId]: current[roomId].filter((message) => message.client_id !== clientId && !message.id.startsWith(`assistant-${clientId}`)) })); setRoomError(error instanceof Error ? error.message : "ส่งข้อความไม่สำเร็จ") }
    finally { setSending(false); setTyping(false); await channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: userId ?? `guest-${clientId}`, isTyping: false } }) }
  }

  return <main className="min-h-dvh bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Link aria-label="กลับหน้าแรก" className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground" href="/home"><ArrowLeft className="size-4" /></Link><span className="hidden font-mono text-xs font-semibold tracking-[0.18em] text-primary sm:inline">{brand.name}</span><span className="h-4 w-px bg-border" /><div className="min-w-0"><h1 className="truncate text-sm font-semibold">Live rooms</h1><p className="truncate text-xs text-muted-foreground">{activeRoom.label} · {activeRoom.name}</p></div></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="hidden items-center gap-1.5 sm:flex"><span className={cn("size-2 rounded-full", status === "live" ? "bg-emerald-400" : status === "error" ? "bg-rose-400" : "bg-amber-400")} />{status === "live" ? "realtime live" : status === "checking" ? "กำลังเชื่อมต่อ" : "offline mode"}</span><span className="hidden items-center gap-1.5 md:flex"><Users className="size-3.5" />{members}</span>{!puterSignedIn && puterChecked ? <Button onClick={async () => { try { await window.puter?.auth.signIn(); setPuterSignedIn(true) } catch (error) { setRoomError(error instanceof Error ? error.message : "Puter login ไม่สำเร็จ") } }} size="sm" variant="outline">Login Puter</Button> : null}</div></div></header>
    <div className="mx-auto grid min-h-[calc(100dvh-65px)] max-w-[1500px] grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_300px]">
      <aside className="border-b border-border/70 bg-card/20 p-3 lg:border-b-0 lg:border-r lg:p-4"><div className="mb-3 flex items-center justify-between px-2"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Rooms</p><p className="mt-1 text-xs text-muted-foreground">live workspace</p></div><MoreHorizontal className="size-4 text-muted-foreground" /></div><nav aria-label="เลือกห้อง" className="flex gap-2 overflow-x-auto lg:grid lg:gap-1.5">{roomCatalog.map((room) => { const active = room.id === activeRoom.id; const Icon = room.id === "work" ? Zap : room.id === "lab" ? Check : Sparkles; return <button className={cn("flex min-w-[155px] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition lg:min-w-0", active ? "border-primary/40 bg-primary/10" : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50")} key={room.id} onClick={() => selectRoom(room.id)} type="button"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><Icon className="size-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{room.label}</span><span className="block truncate text-xs text-muted-foreground">{room.name}</span></span></button> })}</nav></aside>
      <section className="flex min-h-[calc(100dvh-65px)] min-w-0 flex-col"><div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-6"><div><p className="text-sm font-semibold">{activeRoom.label}</p><p className="text-xs text-muted-foreground">{roomCopy[activeRoom.id]}</p></div><span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">{status === "live" ? "SYNCED" : "LOCAL"}</span></div><div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"><div className="mx-auto flex max-w-3xl flex-col gap-4">{activeMessages.length === 0 ? <div className="grid min-h-[260px] place-items-center text-center"><div><div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Sparkles className="size-6" /></div><h2 className="text-balance text-lg font-semibold">เริ่มบทสนทนาใน {activeRoom.label}</h2><p className="mt-2 max-w-sm text-pretty text-sm leading-6 text-muted-foreground">{roomCopy[activeRoom.id]} แล้วดูข้อความ sync ผ่าน Supabase Realtime</p></div></div> : null}<AnimatePresence initial={false}>{activeMessages.map((message) => <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} key={message.id} transition={{ duration: .2 }}><MessageGroup className={cn("max-w-[92%]", message.role === "user" ? "ml-auto items-end" : "items-start")}><MessageHeader><MessageAvatar className="size-7 text-[10px]">{message.initials}</MessageAvatar><span>{message.author}</span><span className="text-muted-foreground">{messageTime(message.created_at)}</span></MessageHeader><Bubble variant={message.role === "user" ? "default" : "secondary"}><BubbleContent><MessageContent>{message.text || <Loader2 className="size-4 animate-spin" />}</MessageContent></BubbleContent></Bubble><MessageFooter>{message.role === "assistant" ? "Puter AI" : "คุณ"}</MessageFooter></MessageGroup></motion.div>)}</AnimatePresence>{typing && <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 animate-pulse rounded-full bg-primary" />มีคนกำลังพิมพ์...</div>}<div ref={endRef} /></div></div><form className="border-t border-border/70 bg-background/85 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:p-4" onSubmit={(event) => { event.preventDefault(); const input = event.currentTarget.elements.namedItem("message") as HTMLInputElement; void sendMessage(input.value); input.value = "" }}><div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-input bg-card/80 p-1.5 shadow-lg shadow-background/20"><Input aria-label={`พิมพ์ข้อความใน${activeRoom.label}`} autoComplete="off" className="h-10 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0" disabled={sending} name="message" placeholder={`ส่งข้อความใน${activeRoom.label}...`} /><Button aria-label="ส่งข้อความ" disabled={sending || !puterSignedIn} size="icon" type="submit">{sending ? <Loader2 className="animate-spin" /> : <Send />}</Button></div><p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">Puter AI streaming · Supabase Realtime Broadcast + Presence</p></form></section>
      <aside className="hidden border-l border-border/70 bg-card/20 p-5 lg:block"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Room status</p><div className="mt-4 space-y-3"><div className="rounded-2xl border border-border bg-card/50 p-4"><div className="flex items-center gap-2 text-sm font-medium"><span className={cn("size-2 rounded-full", status === "live" ? "bg-emerald-400" : "bg-amber-400")} />{status === "live" ? "Realtime connected" : "Connecting"}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">ข้อความในห้องนี้ถูกบันทึกใน Supabase และกระจายไปยังแท็บอื่นแบบสด</p></div><div className="rounded-2xl border border-border bg-card/50 p-4"><div className="flex items-center justify-between text-sm"><span>สมาชิกออนไลน์</span><span className="font-mono text-primary">{members}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/3 rounded-full bg-primary" /></div></div></div></aside>
    </div>{roomError ? <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-xs text-destructive shadow-xl">{roomError}</div> : null}
  </main>
}
