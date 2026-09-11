"use client";

import {
  ArrowUp,
  AudioLines,
  Calculator,
  CalendarDays,
  ChevronDown,
  Gamepad2,
  type LucideIcon,
  Mail,
  Palette,
  RefreshCw,
  Sparkles,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useState,
} from "react";
import { brand } from "@/lib/brand";

type Suggestion = { icon: LucideIcon; label: string };

const MODEL_OPTIONS = ["OS Core", "OS Fast", "OS Studio"] as const;

const SUGGESTION_SETS: Suggestion[][] = [
  [
    { icon: Mail, label: "ฟอร์มติดต่อ" },
    { icon: Palette, label: "ตัวแก้ไขรูปภาพ" },
    { icon: Gamepad2, label: "มินิเกม" },
    { icon: Calculator, label: "เครื่องคิดเลขการเงิน" },
  ],
  [
    { icon: Store, label: "หน้าร้านขายของ" },
    { icon: AudioLines, label: "อัดเสียงแล้วสรุป" },
    { icon: Sparkles, label: "แลนดิ้งเพจสินค้า" },
    { icon: CalendarDays, label: "ปฏิทินนัดหมาย" },
  ],
];

export function PromptHero() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0]);
  const [setIndex, setSetIndex] = useState(0);

  const suggestions = SUGGESTION_SETS[setIndex % SUGGESTION_SETS.length];

  const submit = useCallback(() => {
    const trimmed = prompt.trim();

    if (!trimmed) {
      return;
    }

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const params = new URLSearchParams({ model, prompt: trimmed });

    router.push(`${base}/?${params.toString()}`);
  }, [model, prompt, router]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    },
    [submit]
  );

  const handlePromptChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(event.target.value);
    },
    []
  );

  const handleModelChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setModel(event.target.value);
    },
    []
  );

  const rotateSuggestions = useCallback(() => {
    setSetIndex((index) => index + 1);
  }, []);

  const applySuggestion = useCallback((label: string) => {
    setPrompt(`ทำ${label}ให้หน่อย`);
  }, []);

  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-10 text-center sm:px-6 sm:pt-28 lg:pt-[150px]">
      {/* ออร่าไล่สีแบรนด์ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-[-140px] left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,229,255,0.22),transparent)] blur-2xl" />
        <div className="absolute top-[-60px] left-[8%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.20),transparent)] blur-2xl" />
        <div className="absolute top-[40px] right-[6%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(closest-side,rgba(255,45,149,0.16),transparent)] blur-2xl" />
        {/* ตารางเส้นบาง ๆ */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      </div>

      <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[13px] text-neutral-300 backdrop-blur">
        <Sparkles className="size-3.5 text-[#00e5ff]" />
        สร้างเว็บแอปจริงจากไอเดียด้วย AI
      </p>

      <h1 className="mx-auto mt-5 max-w-[16ch] text-balance font-semibold text-[34px] leading-[1.1] tracking-[-0.04em] text-neutral-950 sm:text-[44px] sm:leading-[1.05] dark:text-neutral-50">
        อยากสร้างอะไรครับ?{" "}
        <span className="bg-gradient-to-r from-[#00e5ff] via-[#a78bfa] to-[#ff2d95] bg-clip-text text-transparent">
          บอก TEMPLATE OS
        </span>
      </h1>

      <p className="mx-auto mt-4 max-w-[46ch] text-pretty text-[15px] leading-relaxed text-neutral-500 sm:text-[16px] dark:text-neutral-400">
        พิมพ์ไอเดียของคุณ แล้ว TEMPLATE OS จะช่วยวางระบบเว็บที่ใช้งานได้จริง พร้อมโค้ด
        ดีไซน์ และการเผยแพร่ในที่เดียว
      </p>

      <div className="relative mx-auto mt-8 w-full max-w-[684px]">
        {/* แสงขอบ gradient */}
        <div
          aria-hidden="true"
          className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#00e5ff] via-[#a78bfa] to-[#ff2d95] opacity-40 blur-[1px] transition-opacity focus-within:opacity-100"
        />
        <div className="relative rounded-2xl bg-white p-4 text-left shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:bg-[#0d0d0d]">
          <textarea
            aria-label="บอก TEMPLATE OS ว่าอยากสร้างอะไร"
            className="h-[56px] w-full resize-none bg-transparent text-[15px] text-neutral-900 leading-6 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            placeholder="บอก TEMPLATE OS ว่าอยากสร้างอะไร…"
            value={prompt}
          />

          <div className="mt-1 flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[14px] text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5">
              <Sparkles className="size-4 text-[#a78bfa]" />
              <span className="sr-only">เลือกโมเดล</span>
              <select
                className="cursor-pointer appearance-none bg-transparent pr-4 text-[14px] outline-none"
                onChange={handleModelChange}
                value={model}
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="-ml-4 size-3.5 text-neutral-400" />
            </label>

            <button
              aria-label="เริ่มสร้าง"
              className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#00e5ff] via-[#a78bfa] to-[#ff2d95] text-white shadow-[0_4px_16px_rgba(167,139,250,0.4)] transition-all hover:shadow-[0_6px_24px_rgba(255,45,149,0.5)] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
              disabled={prompt.trim().length === 0}
              onClick={submit}
              type="button"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {suggestions.map(({ icon, label }) => (
          <SuggestionChip
            icon={icon}
            key={label}
            label={label}
            onSelect={applySuggestion}
          />
        ))}
        <button
          aria-label="สุ่มตัวอย่างคำสั่งใหม่"
          className="grid size-9 place-items-center rounded-full border border-white/12 bg-white/5 text-neutral-400 transition-colors hover:border-white/25 hover:bg-white/10"
          onClick={rotateSuggestions}
          type="button"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>

      <p className="mt-5 text-[13px] text-neutral-500">
        กด Enter เพื่อเริ่ม — ข้อความจะถูกส่งต่อไปยังบิลเดอร์ของ {brand.name}
      </p>
    </section>
  );
}

function SuggestionChip({
  icon: Icon,
  label,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  onSelect: (label: string) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect(label);
  }, [label, onSelect]);

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-[14px] text-neutral-300 backdrop-blur transition-colors hover:border-white/25 hover:bg-white/10 hover:text-neutral-50"
      onClick={handleClick}
      type="button"
    >
      <Icon className="size-4 text-[#a78bfa]" />
      {label}
    </button>
  );
}
