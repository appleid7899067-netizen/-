"use client"

import { useState } from "react"
import { Menu, Paperclip, Plug, ChevronDown, ArrowUp, X, Copy } from "lucide-react"

export default function EveChatShell() {
  const [message, setMessage] = useState("")
  const [attached, setAttached] = useState(false)

  return (
    <main className="eve-shell">
      <header className="eve-header">
        <button className="eve-icon-button" aria-label="เปิดเมนู"><Menu size={26} strokeWidth={1.8} /></button>
      </header>

      <section className="eve-stage">
        <div className="eve-mark" aria-label="EVE"><span>≡</span><i>/</i><span>≡</span></div>

        <div className="eve-composer-wrap">
          <div className="eve-composer">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ถามอะไรก็ได้..."
              rows={3}
              aria-label="ข้อความ"
            />
            <div className="eve-toolbar">
              <button className="eve-tool" aria-label="แนบไฟล์" onClick={() => setAttached(true)}><Paperclip size={23} /></button>
              <button className="eve-tool" aria-label="เครื่องมือ"><Plug size={21} /><ChevronDown size={17} /></button>
              {attached && <div className="eve-attachment"><span>ส่งไฟล์</span><b>เอกสาร</b><button onClick={() => setAttached(false)} aria-label="ลบไฟล์"><X size={18}/></button></div>}
              <button className="eve-send" aria-label="ส่งข้อความ" disabled={!message.trim()}><ArrowUp size={25} /></button>
            </div>
          </div>
        </div>
      </section>

      <footer className="eve-footer">
        <p>สร้างระบบแชทอัตโนมัติของคุณเองด้วย <u>eve</u> · <u>คิดเว็บ</u> · <u>ปรับใช้</u></p>
        <button className="eve-copy"><Copy size={16}/> คัดลอกข้อความแจ้งเตือน</button>
      </footer>
    </main>
  )
}
