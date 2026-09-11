"use client"

import { useEffect, useState } from "react"
import { Menu, Paperclip, Plug, ChevronDown, ArrowUp, X, Copy, Loader2, LogIn } from "lucide-react"
import { streamPuterChat } from "@/lib/puter-ai"
import { withAgentProfile, type AgentMessage } from "@/lib/agent-profile"

type ChatMessage = AgentMessage & { id: string }

export default function EveChatShell() {
  const [message, setMessage] = useState("")
  const [attached, setAttached] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    let cancelled = false
    const check = () => {
      if (cancelled) return
      const auth = window.puter?.auth
      if (!auth) {
        window.setTimeout(check, 150)
        return
      }
      setReady(true)
      try {
        setSignedIn(Boolean(auth.isSignedIn()))
      } catch {
        setSignedIn(false)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  async function loginPuter() {
    setError("")
    setBusy(true)
    try {
      const auth = window.puter?.auth
      if (!auth) throw new Error("Puter ยังโหลดไม่เสร็จ")
      await auth.signIn()
      setSignedIn(Boolean(auth.isSignedIn()))
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบ Puter ไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  async function sendMessage() {
    const text = message.trim()
    if (!text || busy) return
    setError("")
    if (!signedIn) {
      await loginPuter()
      return
    }

    const userId = crypto.randomUUID()
    const assistantId = crypto.randomUUID()
    const nextMessages: ChatMessage[] = [...messages, { id: userId, role: "user", content: text }]
    setMessages(nextMessages)
    setMessage("")
    setBusy(true)

    try {
      const agentMessages = withAgentProfile(nextMessages.map(({ role, content }) => ({ role, content })))
      await streamPuterChat(agentMessages, (partial) => {
        setMessages((current) => {
          const withoutAssistant = current.filter((item) => item.id !== assistantId)
          return [...withoutAssistant, { id: assistantId, role: "assistant", content: partial }]
        })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งข้อความไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="eve-shell">
      <header className="eve-header">
        <button className="eve-icon-button" aria-label="เปิดเมนู" type="button"><Menu size={26} strokeWidth={1.8} /></button>
        <div className="eve-login-area">
          {ready && !signedIn ? (
            <button className="eve-login" type="button" onClick={() => void loginPuter()} disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              เข้าสู่ระบบ Puter
            </button>
          ) : signedIn ? (
            <span className="eve-status">● Puter พร้อม</span>
          ) : null}
        </div>
      </header>

      <section className="eve-stage">
        {messages.length === 0 ? (
          <div className="eve-mark" aria-label="EVE"><span>≡</span><i>/</i><span>≡</span></div>
        ) : (
          <div className="eve-messages" aria-live="polite">
            {messages.map((item) => <div key={item.id} className={`eve-message ${item.role}`}>{item.content}</div>)}
            {busy ? <div className="eve-thinking"><Loader2 size={15} className="animate-spin" /> กำลังตอบกลับ...</div> : null}
          </div>
        )}

        <div className="eve-composer-wrap">
          <div className="eve-composer">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  void sendMessage()
                }
              }}
              placeholder="ถามอะไรก็ได้..."
              rows={3}
              aria-label="ข้อความ"
              disabled={busy}
            />
            <div className="eve-toolbar">
              <button className="eve-tool" aria-label="แนบไฟล์" type="button" onClick={() => setAttached(true)}><Paperclip size={23} /></button>
              <button className="eve-tool" aria-label="เครื่องมือ" type="button"><Plug size={21} /><ChevronDown size={17} /></button>
              {attached && <div className="eve-attachment"><span>ส่งไฟล์</span><b>เอกสาร</b><button type="button" onClick={() => setAttached(false)} aria-label="ลบไฟล์"><X size={18}/></button></div>}
              <button className="eve-send" aria-label={signedIn ? "ส่งข้อความ" : "เข้าสู่ระบบ Puter"} disabled={!message.trim() || busy} onClick={() => void sendMessage()} type="button">
                {busy ? <Loader2 size={22} className="animate-spin" /> : <ArrowUp size={25} />}
              </button>
            </div>
          </div>
          {error ? <p className="eve-error" role="alert">{error}</p> : null}
          {!signedIn && ready ? <p className="eve-login-hint">กรุณาเข้าสู่ระบบ Puter ก่อนส่งข้อความ</p> : null}
        </div>
      </section>

      <footer className="eve-footer">
        <p>สร้างระบบแชทอัตโนมัติของคุณเองด้วย <u>eve</u> · <u>คิดเว็บ</u> · <u>ปรับใช้</u></p>
        <button className="eve-copy" type="button"><Copy size={16}/> คัดลอกข้อความแจ้งเตือน</button>
      </footer>
    </main>
  )
}
