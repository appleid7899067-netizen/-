"use client";

import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { brand } from "@/lib/brand";
import { withAgentProfile } from "@/lib/agent-profile";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "สวัสดีครับ ผมคือบอทของ SILELO พร้อมช่วยคุณสร้างเว็บแอปจากไอเดีย ถามอะไรก็ได้เลยครับ",
};

const GRADIENT = `linear-gradient(135deg, ${brand.accent} 0%, ${brand.accentViolet} 52%, ${brand.accentAlt} 100%)`;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (window.puter?.auth) {
        setSignedIn(window.puter.auth.isSignedIn());
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!window.puter?.ai) {
      setError("Puter ยังโหลดไม่เสร็จ กรุณาลองใหม่");
      return;
    }
    if (!window.puter.auth.isSignedIn()) {
      setError("กรุณาเข้าสู่ระบบด้วย Puter ก่อนใช้งานบอท");
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await window.puter.ai.chat(
        withAgentProfile(
          history.map((m) => ({ role: m.role, content: m.content }))
        ),
        { stream: true }
      );

      let reply = "";
      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      for await (const part of response) {
        if (part?.text) {
          reply += part.text;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: reply } : m
            )
          );
        }
      }

      if (!reply) {
        throw new Error("ไม่ได้รับคำตอบจากโมเดล กรุณาลองใหม่");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const reset = useCallback(() => {
    setMessages([WELCOME]);
    setError(null);
  }, []);

  return (
    <>
      {/* ปุ่มเปิดแชท */}
      <button
        aria-label="เปิดแชทกับบอท SILELO"
        className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full text-[#01030a] shadow-lg shadow-black/20 transition-transform hover:scale-105 active:scale-95"
        onClick={() => setOpen((o) => !o)}
        style={{ backgroundImage: GRADIENT }}
        type="button"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {/* หน้าพูดคุย */}
      {open ? (
        <div className="fixed bottom-24 right-5 z-50 flex h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-2xl shadow-black/20 dark:border-white/10 dark:bg-[#0d0d0d]">
          {/* หัวแชท */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-[#01030a]"
            style={{ backgroundImage: GRADIENT }}
          >
            <span className="grid size-8 place-items-center rounded-lg bg-white/20">
              <Bot className="size-5" />
            </span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold leading-tight">
                บอท SILELO
              </p>
              <p className="text-[12px] leading-tight opacity-80">
                {signedIn ? "พร้อมช่วยคุณเสมอ" : "เข้าสู่ระบบด้วย Puter ก่อน"}
              </p>
            </div>
            <button
              aria-label="ล้างการสนทนา"
              className="grid size-8 place-items-center rounded-lg transition-colors hover:bg-white/20"
              onClick={reset}
              type="button"
            >
              <Sparkles className="size-4" />
            </button>
            <button
              aria-label="ปิดแชท"
              className="grid size-8 place-items-center rounded-lg transition-colors hover:bg-white/20"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* ข้อความ */}
          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            ref={scrollRef}
          >
            {messages.map((m) => (
              <div
                className={cn(
                  "flex max-w-[85%]",
                  m.role === "user" ? "ml-auto justify-end" : "justify-start"
                )}
                key={m.id}
              >
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-sm bg-[#0a0a0a] text-white dark:bg-white dark:text-[#0a0a0a]"
                      : "rounded-bl-sm bg-neutral-100 text-neutral-800 dark:bg-white/5 dark:text-neutral-200"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-neutral-100 px-3.5 py-2 text-[14px] text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
                  <Loader2 className="size-4 animate-spin" />
                  กำลังคิด...
                </div>
              </div>
            ) : null}
            {error ? (
              <p className="text-[13px] text-red-500 dark:text-red-400">
                {error}
              </p>
            ) : null}
          </div>

          {/* ช่องพิมพ์ */}
          {signedIn ? (
            <form
              className="flex items-center gap-2 border-t border-[#e5e5e5] px-3 py-3 dark:border-white/10"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                aria-label="พิมพ์ข้อความ"
                className="h-10 flex-1 rounded-lg border border-[#e5e5e5] bg-transparent px-3 text-[14px] text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/15 dark:text-neutral-100 dark:focus:border-white/30"
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                value={input}
              />
              <button
                aria-label="ส่งข้อความ"
                className="grid size-10 shrink-0 place-items-center rounded-lg text-[#01030a] transition-opacity hover:opacity-85 disabled:opacity-40"
                disabled={loading || !input.trim()}
                style={{ backgroundImage: GRADIENT }}
                type="submit"
              >
                <Send className="size-4" />
              </button>
            </form>
          ) : (
            <div className="border-t border-[#e5e5e5] px-4 py-3 dark:border-white/10">
              <Link
                className="block w-full rounded-lg bg-[#0a0a0a] px-4 py-2.5 text-center text-[14px] font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-[#0a0a0a]"
                href="/login"
              >
                เข้าสู่ระบบด้วย Puter
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
