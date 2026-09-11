"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PuterLogin() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const checkPuter = () => {
      const auth = window.puter?.auth;
      if (cancelled) return;

      if (!auth) {
        window.setTimeout(checkPuter, 100);
        return;
      }

      setReady(true);
      if (auth.isSignedIn()) {
        router.replace("/home");
        router.refresh();
      }
    };

    checkPuter();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function signIn() {
    setError("");
    setBusy(true);
    try {
      const auth = window.puter?.auth;
      if (!auth) throw new Error("Puter ยังโหลดไม่เสร็จ");

      const signedInUser = await auth.signIn();
      // ยืนยัน session ก่อนกลับเข้าแอป เพื่อไม่ให้หน้า home เห็นสถานะเก่า
      const confirmed = await waitForSignedIn(5000);
      if (!confirmed && !signedInUser) {
        throw new Error("ยังไม่สามารถยืนยันการเข้าสู่ระบบได้");
      }

      router.replace("/home");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function waitForSignedIn(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const started = Date.now();
      const check = () => {
        if (window.puter?.auth?.isSignedIn()) return resolve(true);
        if (Date.now() - started >= timeoutMs) return resolve(false);
        window.setTimeout(check, 150);
      };
      check();
    });
  }

  return (
    <>
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
