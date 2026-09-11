"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PuterLogin() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (window.puter?.auth) {
        setReady(true);
        window.clearInterval(timer);
        if (window.puter.auth.isSignedIn()) router.replace("/home");
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [router]);

  async function signIn() {
    setError("");
    setBusy(true);
    try {
      if (!window.puter?.auth) throw new Error("Puter ยังโหลดไม่เสร็จ");
      await window.puter.auth.signIn();
      router.replace("/home");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <button
        type="button"
        onClick={signIn}
        disabled={!ready || busy}
        className="w-full rounded-xl bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#0a0a0a]"
      >
        {busy ? "กำลังเข้าสู่ระบบ…" : ready ? "เข้าสู่ระบบด้วย Puter" : "กำลังเตรียม Puter…"}
      </button>
      {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
    </>
  );
}
