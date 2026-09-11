"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ChevronDown, Info, Loader2, Send, Sparkles } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { rooms } from "@/lib/brand"
import { withAgentProfile, type AgentMessage } from "@/lib/agent-profile"
import { streamPuterChat } from "@/lib/puter-ai"
import { ensureAnonymousSession, getSupabaseBrowserClient } from "@/lib/supabase/client"

type RoomId = "sli" | "work" | "lab"
type MessageRole = "assistant" | "user"
type RoomMessage = { id: string; room_id: RoomId; sender_id?: string; client_id?: string | null; author: string; initials: string; role: MessageRole; text: string; created_at: string }
type RoomDefinition = (typeof rooms)[number] & { id: RoomId }

const roomCatalog: RoomDefinition[] = [{ ...rooms[0], id: "sli" }, { ...rooms[1], id: "work" }, { ...rooms[2], id: "lab" }]
const roomTopic = (roomId: RoomId) => `silelo:room:${roomId}`
const normalizeRoomId = (value: string | null): RoomId => value === "work" || value === "lab" ? value : "sli"
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
  const [members, setMembers] = useState(1)
  const [typing, setTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [nameInput, setNameInput] = useState("")
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null>(null)
  const seenIds = useRef(new Set<string>())
  const activeRoom = useMemo(() => roomCatalog.find((room) => room.id === activeRoomId) ?? roomCatalog[0], [activeRoomId])
  const activeMessages = messagesByRoom[activeRoom.id]

  useEffect(() => setActiveRoomId(requestedRoomId), [requestedRoomId])
  useEffect(() => setDisplayName(window.localStorage.getItem("silelo-room-name") ?? ""), [])
  useEffect(() => {
    const puter = window.puter
    if (!puter) { setPuterChecked(true); return }
    void Promise.resolve(puter.auth.isSignedIn()).then((signedIn) => { setPuterSignedIn(Boolean(signedIn)); setPuterChecked(true) }).catch(() => setPuterChecked(true))
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
    void ensureAnonymousSession().catch(() => null).then(async (user) => {
      if (cancelled) return
      setUserId(user?.id ?? null)
      const { data, error } = await supabase.from("room_messages").select("id,room_id,sender_id,client_id,author,initials,role,text,created_at").eq("room_id", activeRoom.id).order("created_at", { ascending: true }).limit(200)
      if (error) throw error
      if (cancelled) return
      setMessagesByRoom((current) => ({ ...current, [activeRoom.id]: data as RoomMessage[] }))
      ;(data as RoomMessage[]).forEach((message) => { seenIds.current.add(message.id); if (message.client_id) seenIds.current.add(`client:${message.client_id}`) })
      const presenceKey = user?.id ?? `guest-${crypto.randomUUID()}`
      const channel = supabase.channel(roomTopic(activeRoom.id), { config: { broadcast: { self: false }, presence: { key: presenceKey } } })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${activeRoom.id}` }, ({ new: row }) => addMessage(row as RoomMessage))
        .on("broadcast", { event: "typing" }, ({ payload }) => { if (payload?.userId !== presenceKey) { setTyping(Boolean(payload?.isTyping)); window.setTimeout(() => setTyping(false), 1800) } })
        .on("presence", { event: "sync" }, () => setMembers(Object.keys(channel.presenceState()).length || 1))
        .on("presence", { event: "join" }, () => setMembers(Object.keys(channel.presenceState()).length || 1))
        .on("presence", { event: "leave" }, () => setMembers(Math.max(1, Object.keys(channel.presenceState()).length)))
      channelRef.current = channel
      await channel.subscribe(async (status) => { if (status === "SUBSCRIBED") await channel.track({ userId: presenceKey }) })
    }).catch((error) => { if (!cancelled) setRoomError(error instanceof Error ? error.message : "เชื่อมต่อห้องไม่สำเร็จ") })
    return () => { cancelled = true; if (channelRef.current) { void supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [activeRoom.id, addMessage])

  async function insertMessage(message: Omit<RoomMessage, "id" | "created_at">) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("room_messages").insert(message as never).select("id,room_id,sender_id,client_id,author,initials,role,text,created_at").single()
    if (error) throw error
    addMessage(data as RoomMessage)
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return
    if (!puterSignedIn) { setRoomError("เข้าสู่ระบบก่อนเริ่มแชท"); return }
    const roomId = activeRoom.id
    const clientId = crypto.randomUUID()
    const userMessage: Omit<RoomMessage, "id" | "created_at"> = { room_id: roomId, sender_id: userId ?? undefined, client_id: clientId, author: displayName || "คุณ", initials: initialsFor(displayName), role: "user", text: text.trim() }
    const optimistic = { ...userMessage, id: `optimistic-${clientId}`, created_at: new Date().toISOString() } as RoomMessage
    const history = [...activeMessages, optimistic]
    setSending(true); setRoomError(null); setTyping(true); setMessagesByRoom((current) => ({ ...current, [roomId]: history })); seenIds.current.add(`client:${clientId}`)
    try {
      await insertMessage(userMessage)
      const responseText = await streamPuterChat(withAgentProfile(toAgentMessages(history)), (partial) => setMessagesByRoom((current) => ({ ...current, [roomId]: [...current[roomId].filter((message) => !message.id.startsWith("assistant-")), { id: `assistant-${clientId}`, room_id: roomId, sender_id: userId ?? undefined, author: activeRoom.name, initials: initialsFor(activeRoom.label), role: "assistant", text: partial, created_at: new Date().toISOString() }] })))
      await insertMessage({ room_id: roomId, sender_id: userId ?? undefined, client_id: `assistant-${clientId}`, author: activeRoom.name, initials: initialsFor(activeRoom.label), role: "assistant", text: responseText })
    } catch (error) {
      setMessagesByRoom((current) => ({ ...current, [roomId]: current[roomId].filter((message) => message.client_id !== clientId && !message.id.startsWith(`assistant-${clientId}`)) }))
      setRoomError(error instanceof Error ? error.message : "ส่งข้อความไม่สำเร็จ")
    } finally { setSending(false); setTyping(false) }
  }

  if (!displayName) return <main className="grid min-h-dvh place-items-center bg-black px-5 text-white"><motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={(event) => { event.preventDefault(); const name = nameInput.trim(); if (!name) return; localStorage.setItem("silelo-room-name", name); setDisplayName(name) }} className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#171717] p-6"><div className="mb-8 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-400 text-lg font-semibold">S</div><div><p className="text-base font-semibold">SLI</p><p className="text-xs text-white/45">ห้องสนทนา</p></div></div><h1 className="text-xl font-semibold">ยินดีต้อนรับ</h1><p className="mt-2 text-sm text-white/45">ตั้งชื่อของคุณก่อนเข้าห้อง</p><input autoFocus value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="ใส่ชื่อของคุณ..." className="mt-7 h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm outline-none placeholder:text-white/25 focus:border-white/30" /><button disabled={!nameInput.trim()} className="mt-3 h-12 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-emerald-400 text-sm font-semibold disabled:opacity-40">เข้าห้องแชท</button></motion.form></main>

  return <main className="flex min-h-dvh flex-col bg-black text-white"><header className="shrink-0 border-b border-white/[.08] bg-black"><div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4"><div className="flex min-w-0 items-center gap-3"><Link aria-label="กลับ" className="grid size-9 place-items-center rounded-full border border-white/10 text-white/65" href="/home"><ArrowLeft className="size-4" /></Link><div><h1 className="text-base font-semibold">{activeRoom.label}</h1><p className="flex items-center gap-1.5 text-xs text-white/45"><span className="size-1.5 rounded-full bg-emerald-400" />{members} คนออนไลน์</p></div></div><div className="flex items-center gap-2">{!puterSignedIn && puterChecked ? <button onClick={async () => { await window.puter?.auth.signIn(); setPuterSignedIn(true) }} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70">เข้าสู่ระบบ</button> : null}<Info className="size-4 text-white/45" /></div></div></header><div className="flex-1 overflow-y-auto px-4 pb-28 pt-5"><div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-4">{activeMessages.length === 0 ? <div className="grid min-h-[calc(100dvh-170px)] place-items-center text-center"><div><div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[.06]"><Sparkles className="size-5 text-white/65" /></div><p className="text-base font-medium text-white/80">เริ่มต้นบทสนทนาใน {activeRoom.label}</p></div></div> : <AnimatePresence initial={false}>{activeMessages.map((message) => <motion.div key={message.id} initial={{ opacity: 0, y: 10, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={message.role === "user" ? "ml-auto max-w-[78%]" : "mr-auto max-w-[82%]"}><div className={message.role === "user" ? "rounded-[22px] rounded-br-md bg-[#242424] px-4 py-3 text-sm leading-6 text-white" : "rounded-[22px] rounded-bl-md bg-[#151a1b] px-4 py-3 text-sm leading-6 text-white/90"}>{message.text}</div><p className="mt-1 px-1 text-[10px] text-white/25">{message.author}</p></motion.div>)}</AnimatePresence>}{typing ? <div className="flex items-center gap-1 px-2 text-xs text-white/35"><span className="size-1.5 animate-pulse rounded-full bg-white/45" /><span className="size-1.5 animate-pulse rounded-full bg-white/35 [animation-delay:120ms]" /><span className="size-1.5 animate-pulse rounded-full bg-white/25 [animation-delay:240ms]" /></div> : null}</div></div>{roomError ? <p className="border-t border-red-500/20 bg-red-950/30 px-4 py-2 text-center text-xs text-red-200">{roomError}</p> : null}<div className="fixed inset-x-0 bottom-0 z-20 bg-black px-4 pb-4 pt-2"><form className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-white/15 bg-[#151515] p-1.5 pl-4 shadow-2xl" onSubmit={(event) => { event.preventDefault(); const input = event.currentTarget.elements.namedItem("message") as HTMLInputElement; const value = input.value.trim(); if (value) { void sendMessage(value); input.value = "" } }}><input name="message" disabled={sending} placeholder="Ask a follow-up..." className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/35" /><button type="submit" disabled={sending} aria-label="ส่งข้อความ" className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:opacity-50">{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button></form><div className="mx-auto mt-1 flex max-w-3xl justify-center"><button className="flex items-center gap-1 text-[10px] text-white/25">SLI <ChevronDown className="size-3" /></button></div></div></main>
}
