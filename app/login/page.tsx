import Link from "next/link";
import { PuterLogin } from "@/components/auth/puter-login";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 text-neutral-950 dark:bg-[#0a0a0a] dark:text-white">
      <section className="w-full max-w-md rounded-2xl border border-neutral-200 p-7 shadow-sm dark:border-white/10">
        <div className="mb-7 text-center">
          <p className="text-sm font-medium text-primary">TEMPLATE OS</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">เข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-muted-foreground">ใช้บัญชี Puter เป็นบัญชีหลักของ TEMPLATE OS</p>
        </div>
        <PuterLogin />
        <p className="mt-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
          ยังไม่มีบัญชี? ไม่ต้องสร้างบัญชี TEMPLATE OS แยก — ใช้ Puter ได้เลย
        </p>
        <Link className="mt-4 block text-center text-sm underline" href="/home">กลับหน้าแรก</Link>
      </section>
    </main>
  );
}
