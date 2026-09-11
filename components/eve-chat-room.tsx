"use client"

import { useState } from "react"
import { ArrowUp, Menu, Paperclip, Plug, ChevronDown, Loader2 } from "lucide-react"

type Message = { role: "user" | "assistant"; text: string }

export default function EveChatRoom() {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState("")

  async function sendMessage() {
    const text = draft.trim()
    if (!text || sending) return
    setError("")
    setDraft("")
    const next = [...messages, { role: "user" as const, text }]
    setMessages(next)
    setSending(true)

    try {
      const response = await fetch("/api/openrouter/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((message) => ({ role: message.role, content: message.text })),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || "ส่งข้อความไม่สำเร็จ")
      const reply = data?.choices?.[0]?.message?.content
      if (!reply) throw new Error("AI ไม่ได้ส่งข้อความตอบกลับ")
      setMessages((current) => [...current, { role: "assistant", text: String(reply) }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งข้อความไม่สำเร็จ")
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#090909] text-white flex flex-col">
      <header className="h-16 shrink-0 border-b border-white/10 flex items-center px-4">
        <button aria-label="เปิดเมนู" className="grid size-10 place-items-center rounded-xl hover:bg-white/5">
          <Menu size={25} strokeWidth={1.8} />
        </button>
        <div className="mx-auto mr-10 text-sm text-white/60">EVE</div>
      </header>

      <section className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto flex w-full max-w-2xl min-h-full flex-col justify-center">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-12 pb-8">
              <div className="flex items-center gap-1 text-5xl font-bold tracking-[-0.18em]">
                <span>≡</span><span className="font-light italic">/</span><span>≡</span>
              </div>
              <p className="text-sm text-white/35">ถามอะไรก็ได้ แล้วกดปุ่มส่ง</p>
            </div>
          ) : (
            <div className="space-y-5 pb-6">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[86%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-[15px] leading-7 ${message.role === "user" ? "rounded-br-md bg-white text-black" : "rounded-bl-md bg-white/[0.07] text-white/90"}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              {sending && <div className="flex items-center gap-2 px-2 text-sm text-white/45"><Loader2 size={16} className="animate-spin" /> กำลังตอบกลับ...</div>}
            </div>
          )}
        </div>
      </section>

      <div className="px-4 pb-[calc(18px+env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-2xl">
          {error && <div className="mb-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
          <form onSubmit={(event) => { event.preventDefault(); void sendMessage() }} className="relative rounded-[27px] border border-white/10 bg-[#151515] p-4 shadow-2xl">
            <textarea
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              disabled={sending}
              rows={3}
              placeholder="ถามอะไรก็ได้..."
              className="min-h-[100px] w-full resize-none bg-transparent text-lg leading-7 outline-none placeholder:text-white/35 disabled:opacity-60"
            />
            <div className="flex items-center gap-1 pt-2">
              <button type="button" aria-label="แนบไฟล์" className="grid size-10 place-items-center rounded-xl text-white/75 hover:bg-white/5"><Paperclip size={22} /></button>
              <button type="button" aria-label="เครื่องมือ" className="flex size-10 items-center justify-center gap-0.5 rounded-xl text-white/75 hover:bg-white/5"><Plug size={20} /><ChevronDown size={15} /></button>
              <button type="submit" aria-label="ส่งข้อความ" disabled={!draft.trim() || sending} className="ml-auto grid size-11 place-items-center rounded-xl bg-white/35 text-black transition enabled:hover:bg-white/60 disabled:opacity-40">
                {sending ? <Loader2 size={21} className="animate-spin" /> : <ArrowUp size={24} />}
              </button>
            </div>
          </form>
          <p className="mt-2 text-center text-[11px] text-white/25">Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่</p>
        </div>
      </div>
    </main>
  )
}
