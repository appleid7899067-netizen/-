"use client"

import { useEffect, useState } from "react"
import { ArrowUp, CheckCircle2, Loader2, Menu, Paperclip, Plug, ChevronDown, LogIn, X } from "lucide-react"

type Message = { role: "user" | "assistant"; text: string }

type PuterAuth = {
  isSignedIn: () => boolean | Promise<boolean>
  signIn: () => Promise<unknown>
}

type PuterAI = {
  chat: (
    messages: { role: "user" | "assistant"; content: string }[],
    options: { model: string; stream?: boolean },
  ) => Promise<unknown> | AsyncIterable<unknown>
}

type PuterClient = { auth: PuterAuth; ai: PuterAI }

declare global {
  interface Window {
    puter?: PuterClient
  }
}

const DEEPSEEK_MODEL = "deepseek/deepseek-v4.1-flash"

function chunkText(chunk: unknown) {
  if (typeof chunk === "string") return chunk
  if (!chunk || typeof chunk !== "object") return ""
  const value = chunk as Record<string, unknown>
  if (typeof value.text === "string") return value.text
  const message = value.message
  if (message && typeof message === "object" && typeof (message as Record<string, unknown>).content === "string") {
    return String((message as Record<string, unknown>).content)
  }
  const delta = value.delta
  if (delta && typeof delta === "object" && typeof (delta as Record<string, unknown>).content === "string") {
    return String((delta as Record<string, unknown>).content)
  }
  return ""
}

export default function EveChatRoom() {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState("")
  const [signedIn, setSignedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const puter = window.puter
      if (!puter) {
        if (!cancelled) {
          setError("Puter ยังโหลดไม่เสร็จ กรุณารีเฟรชหน้า")
          setCheckingAuth(false)
        }
        return
      }
      try {
        const ok = await Promise.resolve(puter.auth.isSignedIn())
        if (!cancelled) setSignedIn(Boolean(ok))
      } catch {
        if (!cancelled) setSignedIn(false)
      } finally {
        if (!cancelled) setCheckingAuth(false)
      }
    }
    check()
    const timer = window.setTimeout(check, 1000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  async function signIn() {
    if (signingIn) return
    setError("")
    setSigningIn(true)
    try {
      if (!window.puter) throw new Error("Puter ยังโหลดไม่เสร็จ")
      await window.puter.auth.signIn()
      const ok = await Promise.resolve(window.puter.auth.isSignedIn())
      if (!ok) throw new Error("ยังยืนยันการเข้าสู่ระบบ Puter ไม่ได้")
      setSignedIn(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบ Puter ไม่สำเร็จ")
    } finally {
      setSigningIn(false)
    }
  }

  async function sendMessage() {
    const text = draft.trim()
    if (!text || sending) return
    if (!signedIn) {
      setError("กรุณาเข้าสู่ระบบ Puter ก่อนส่งข้อความ")
      return
    }

    setError("")
    setDraft("")
    const next = [...messages, { role: "user" as const, text }]
    setMessages(next)
    setSending(true)

    try {
      if (!window.puter) throw new Error("ไม่พบ Puter SDK")
      const result = await window.puter.ai.chat(
        next.map((message) => ({ role: message.role, content: message.text })),
        { model: DEEPSEEK_MODEL, stream: true },
      )

      let reply = ""
      if (result && typeof (result as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function") {
        for await (const chunk of result as AsyncIterable<unknown>) {
          const part = chunkText(chunk)
          if (!part) continue
          reply += part
          setMessages((current) => {
            const last = current[current.length - 1]
            if (last?.role === "assistant") {
              return [...current.slice(0, -1), { role: "assistant", text: reply }]
            }
            return [...current, { role: "assistant", text: reply }]
          })
        }
      } else {
        reply = chunkText(result)
        if (!reply && result && typeof result === "object") {
          const response = result as Record<string, unknown>
          const choices = response.choices
          if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
            const message = (choices[0] as Record<string, unknown>).message
            if (message && typeof message === "object") {
              reply = String((message as Record<string, unknown>).content ?? "")
            }
          }
        }
        if (reply) setMessages((current) => [...current, { role: "assistant", text: reply }])
      }

      if (!reply.trim()) throw new Error("DeepSeek ไม่ส่งคำตอบกลับมา")
    } catch (err) {
      setMessages((current) => current.slice(0, -1))
      setError(err instanceof Error ? err.message : "ส่งข้อความไม่สำเร็จ")
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#050705] text-white flex flex-col">
      <header className="h-[72px] shrink-0 border-b border-white/10 flex items-center px-4">
        <button aria-label="เปิดเมนู" className="grid size-10 place-items-center rounded-xl hover:bg-white/5">
          <Menu size={25} strokeWidth={1.8} />
        </button>
        <div className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
          <span className="size-2 rounded-full bg-lime-300" />
          <span className="text-sm font-medium">TEMPLATE OS Copilot</span>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex items-center justify-center gap-2 border-b border-white/5 px-4 py-2 text-xs text-white/55">
        {signedIn ? <CheckCircle2 size={14} className="text-lime-300" /> : <span className="size-2 rounded-full bg-white/30" />}
        <span>{signedIn ? "Puter พร้อมใช้งาน" : "ต้องเข้าสู่ระบบ Puter"}</span>
        <span className="rounded-full bg-lime-300/10 px-2 py-0.5 text-lime-200">DeepSeek ฟรี · V4.1 Flash</span>
      </div>

      <section className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-2xl min-h-full flex-col justify-end">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-8">
              <div className="flex items-center gap-1 text-5xl font-bold tracking-[-0.18em] text-lime-200/90"><span>≡</span><span className="font-light italic">/</span><span>≡</span></div>
              <div className="text-center">
                <h1 className="text-xl font-semibold">ถาม TEMPLATE OS Copilot</h1>
                <p className="mt-2 text-sm text-white/40">ใช้ DeepSeek V4.1 Flash ผ่าน Puter</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-[15px] leading-7 ${message.role === "user" ? "rounded-br-md bg-lime-300 text-black" : "rounded-bl-md bg-[#111b13] text-white/90"}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              {sending && <div className="flex items-center gap-2 px-2 text-sm text-white/45"><Loader2 size={16} className="animate-spin" /> กำลังตอบกลับด้วย DeepSeek...</div>}
            </div>
          )}
        </div>
      </section>

      <div className="px-4 pb-[calc(18px+env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-2xl">
          {error && <div className="mb-2 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200"><span className="flex-1">{error}</span><button onClick={() => setError("")} aria-label="ปิด"><X size={14} /></button></div>}

          {!signedIn && !checkingAuth ? (
            <button type="button" onClick={signIn} disabled={signingIn} className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 px-4 py-3.5 font-semibold text-black disabled:opacity-60">
              {signingIn ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              {signingIn ? "กำลังเข้าสู่ระบบ Puter..." : "เข้าสู่ระบบ Puter เพื่อเริ่มแชท"}
            </button>
          ) : null}

          <form onSubmit={(event) => { event.preventDefault(); void sendMessage() }} className="relative rounded-[27px] border border-white/10 bg-[#111411] p-4 shadow-2xl">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              disabled={sending || !signedIn}
              rows={3}
              placeholder={signedIn ? "ถาม TEMPLATE OS Copilot..." : "เข้าสู่ระบบ Puter ก่อนเริ่มแชท..."}
              className="min-h-[90px] w-full resize-none bg-transparent text-lg leading-7 outline-none placeholder:text-white/30 disabled:opacity-50"
            />
            <div className="flex items-center gap-1 pt-2">
              <button type="button" aria-label="แนบไฟล์" className="grid size-10 place-items-center rounded-xl text-white/65 hover:bg-white/5"><Paperclip size={21} /></button>
              <button type="button" aria-label="เครื่องมือ" className="flex size-10 items-center justify-center gap-0.5 rounded-xl text-white/65 hover:bg-white/5"><Plug size={19} /><ChevronDown size={14} /></button>
              <button type="submit" aria-label="ส่งข้อความ" disabled={!draft.trim() || sending || !signedIn} className="ml-auto grid size-11 place-items-center rounded-xl bg-lime-300 text-black transition enabled:hover:bg-lime-200 disabled:opacity-30">
                {sending ? <Loader2 size={21} className="animate-spin" /> : <ArrowUp size={24} />}
              </button>
            </div>
          </form>
          <p className="mt-2 text-center text-[11px] text-white/25">Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่ · DeepSeek ฟรีผ่าน Puter</p>
        </div>
      </div>
    </main>
  )
}
