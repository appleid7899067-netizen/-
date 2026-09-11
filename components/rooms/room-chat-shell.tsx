"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Info, Loader2, Send, Sparkles } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Input } from "@/components/ui/input"
import { MessageAvatar, MessageContent, MessageGroup, MessageHeader } from "@/components/ui/message"
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
const roomTopic = (roomId: RoomId) => `silelo:room:${roomId}`
const normalizeRoomId = (value: string | null): RoomId => value === "work" || value === "lab" ? value : "sli"
const messageTime = (value: string) => new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))
const initialsFor = (name: string) => name.trim().slice(0, 2).toUpperCase() || "G"
const toAgentMessages = (messages: RoomMessage[]): AgentMessage[] => messages.map(({ role, text }) => ({ role, content: text }))

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
  const [displayName, setDisplayName] = useState("")
  const [nameInput, setNameInput] = useState("")
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null>(null)
  const seenIds = useRef(new Set<string>())
  const endRef = useRef<HTMLDivElement>(null)
  const activeRoom = useMemo(() => roomCatalog.find((room) => room.id === activeRoomId) ?? roomCatalog[0], [activeRoomId])
  const activeMessages = messagesByRoom[activeRoom.id]

  useEffect(() => setActiveRoomId(requestedRoomId), [requestedRoomId])
  useEffect(() => setDisplayName(window.localStorage.getItem("silelo-room-name") ?? ""), [])
  useEffect(() => {
    let mounted = true
    const puter = window.puter
    if (!puter) { setPuterChecked(true); return }
    void Promise.resolve(puter.auth.isSignedIn()).then((signedIn) => { if (mounted) { setPuterSignedIn(Boolean(signedIn)); setPuterChecked(true) } }).catch(() => mounted && setPuterChecked(true))
    return () => { mounted = false }
  }, [])

  const addMessage = useCallback((message: RoomMessage) => {
    if (seenIds.current.has(message.id) || (message.client_id && seenIds.current.has(`client:${message.client_id}`))) return
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
      await channel.subscribe(async (subscriptionStatus) => { if (subscriptionStatus === "SUBSCRIBED") { setStatus("live"); await channel.track({ userId: presenceKey }) }; if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") setStatus("error") })
    }).catch((error) => { if (!cancelled) { setStatus("offline"); setRoomError(error instanceof Error ? error.message : "เชื่อมต่อห้องไม่สำเร็จ") } })
    return () => { cancelled = true; if (channelRef.current) { void supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [activeRoom.id, addMessage])

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [activeMessages, typing])

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
    const userMessage: Omit<RoomMessage, "id" | "created_at"> = { room_id: roomId, sender_id: userId ?? undefined, client_id: clientId, author: displayName || "คุณ", initials: initialsFor(displayName), role: "user", text: text.trim() }
    const history = [...activeMessages, { ...userMessage, id: `optimistic-${clientId}`, created_at: new Date().toISOString() } as RoomMessage]
    setSending(true); setRoomError(null); setTyping(true); setMessagesByRoom((current) => ({ ...current, [roomId]: history })); seenIds.current.add(`client:${clientId}`)
    await channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: userId ?? `guest-${clientId}`, isTyping: true } })
    try {
      await insertMessage(userMessage)
      const responseText = await streamPuterChat(withAgentProfile(toAgentMessages(history)), (partial) => setMessagesByRoom((current) => ({ ...current, [roomId]: [...current[roomId].filter((message) => !message.id.startsWith("assistant-")), { id: `assistant-${clientId}`, room_id: roomId, sender_id: userId ?? undefined, author: activeRoom.name, initials: initialsFor(activeRoom.label), role: "assistant", text: partial, created_at: new Date().toISOString() }] })))
      await insertMessage({ room_id: roomId, sender_id: userId ?? undefined, client_id: `assistant-${clientId}`, author: activeRoom.name, initials: initialsFor(activeRoom.label), role: "assistant", text: responseText })
    } catch (error) { setMessagesByRoom((current) => ({ ...current, [roomId]: current[roomId].filter((message) => message.client_id !== clientId && !message.id.startsWith(`assistant-${clientId}`)) })); setRoomError(error instanceof Error ? error.message : "ส่งข้อความไม่สำเร็จ") }
    finally { setSending(false); setTyping(false); await channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: userId ?? `guest-${clientId}`, isTyping: false } }) }
  }

  if (!displayName) return <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#09090d] px-5 text-white"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,.18),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(52,211,153,.08),transparent_35%)]" /><motion.form initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} onSubmit={(event) => { event.preventDefault(); const name = nameInput.trim(); if (!name) return; window.localStorage.setItem("silelo-room-name", name); setDisplayName(name) }} className="relative w-full max-w-sm rounded-[2rem] border border-white/[.09] bg-white/[.055] p-6 shadow-2xl backdrop-blur-2xl"><div className="mb-8 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-400 text-lg font-semibold">S</div><div><p className="text-base font-semibold">SLI</p><p className="text-xs text-white/40">ห้องสนทนา</p></div></div><h1 className="text-xl font-semibold">ยินดีต้อนรับ</h1><p className="mt-2 text-sm text-white/45">ตั้งชื่อของคุณก่อนเข้าห้อง</p><input autoFocus value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="ใส่ชื่อของคุณ..." className="mt-7 h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/60" /><button type="submit" disabled={!nameInput.trim()} className="mt-3 h-12 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-emerald-400 text-sm font-semibold transition hover:brightness-110 disabled:opacity-40">เข้าห้องแชท</button></motion.form></main>

  return <main className="flex min-h-dvh flex-col bg-[#09090d] text-white"><header className="sticky top-0 z-20 border-b border-white/[.07] bg-[#09090d]/90 backdrop-blur-xl"><div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3"><div className="flex min-w-0 items-center gap-3"><Link aria-label="กลับหน้าแรก" className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white" href="/home"><ArrowLeft className="size-4" /></Link><div className="min-w-0"><h1 className="truncate text-base font-semibold">{activeRoom.label}</h1><p className="flex items-center gap-1.5 text-xs text-white/40"><span className="size-1.5 rounded-full bg-emerald-400" />{members} คนออนไลน์</p></div></div><div className="flex items-center gap-2">{!puterSignedIn && puterChecked ? <button onClick={async () => { try { await window.puter?.auth.signIn(); setPuterSignedIn(true) } catch (error) { setRoomError(error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ") } }} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70">เข้าสู่ระบบ</button> : null}<button type="button" aria-label="ข้อมูลห้อง" title="ข้อมูลห้อง" className="rounded-full p-2 text-white/45 transition hover:bg-white/10 hover:text-white"><Info className="size-4" /></button></div></div></header><section className="flex min-h-0 flex-1 flex-col"><div className="flex-1 overflow-y-auto px-4 py-6"><div className="mx-auto flex w-full max-w-3xl flex-col gap-3">{activeMessages.length === 0 ? <div className="grid min-h-[calc(100dvh-180px)] place-items-center text-center"><div><div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-300"><Sparkles className="size-5" /></div><h2 className="text-base font-semibold">เริ่มต้นบทสนทนาใน {activeRoom.label}</h2></div></div> : null}<AnimatePresence initial={false}>{activeMessages.map((message) => <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}><MessageGroup className="max-w-[75%] items-start"><MessageHeader><MessageAvatar className="size-6 text-[9px]">{message.initials}</MessageAvatar><span>{message.author}</span><span className="text-white/30">{messageTime(message.created_at)}</span></MessageHeader><Bubble variant={message.role === "user" ? "default" : "secondary"} className="rounded-2xl shadow-lg shadow-black/10"><BubbleContent><MessageContent className="text-sm leading-6">{message.text || <Loader2 className="size-4 animate-spin" />}</MessageContent></BubbleContent></Bubble></MessageGroup></motion.div>)}</AnimatePresence>{typing ? <div className="flex items-center gap-2 px-2 text-xs text-white/35"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />กำลังพิมพ์...</div> : null}<div ref={endRef} /></div></div><div className="sticky bottom-0 border-t border-white/[.07] bg-[#09090d]/90 px-3 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl"><form className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-white/10 bg-white/[.045] p-1.5 pl-4 shadow-2xl" onSubmit={(event) => { event.preventDefault(); const input = event.currentTarget.elements.namedItem("message") as HTMLInputElement; const value = input.value.trim(); if (value) { void sendMessage(value); input.value = "" } }}><Input name="message" placeholder="เขียนข้อความ..." className="h-10 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" /><button aria-label="ส่งข้อความ" type="submit" disabled={sending} className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-emerald-400 text-white transition hover:brightness-110 disabled:opacity-50"><Send className="size-4" /></button></form></div></section>{roomError ? <div className="fixed bottom-20 left-1/2 z-30 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl border border-rose-400/20 bg-rose-950/80 px-4 py-3 text-center text-xs text-rose-100 shadow-xl">เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</div> : null}</main>
}
