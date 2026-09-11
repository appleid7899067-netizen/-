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

const MODEL_OPTIONS = ["SILELO Max", "SILELO Fast", "SLI Flash"] as const;

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
    <section className="px-4 pt-20 pb-8 text-center sm:px-6 sm:pt-28 lg:pt-[150px]">
      <h1 className="text-balance font-semibold text-[28px] text-neutral-950 leading-9 tracking-[-0.04em] sm:text-[32px] sm:leading-10 dark:text-neutral-50">
        อยากสร้างอะไรครับ?
      </h1>

      <div className="mx-auto mt-3 w-full max-w-[684px] rounded-xl border border-[#e5e5e5] bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors focus-within:border-neutral-400 dark:border-white/12 dark:bg-white/[0.03] dark:focus-within:border-white/30">
        <textarea
          aria-label="บอก SILELO ว่าอยากสร้างอะไร"
          className="h-[52px] w-full resize-none bg-transparent text-[15px] text-neutral-900 leading-6 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          onChange={handlePromptChange}
          onKeyDown={handleKeyDown}
          placeholder="บอก SILELO ว่าอยากสร้างอะไร…"
          value={prompt}
        />

        <div className="mt-1 flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[14px] text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5">
            <Sparkles className="size-4 text-neutral-500 dark:text-neutral-400" />
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
            className="grid size-8 place-items-center rounded-full bg-[#0a0a0a] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:text-[#0a0a0a]"
            disabled={prompt.trim().length === 0}
            onClick={submit}
            type="button"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
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
          className="grid size-9 place-items-center rounded-full border border-[#e5e5e5] bg-white text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.03] dark:text-neutral-400 dark:hover:bg-white/[0.06]"
          onClick={rotateSuggestions}
          type="button"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>

      <p className="mt-4 text-[13px] text-neutral-500">
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
      className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3.5 py-2 text-[14px] text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/25 dark:hover:bg-white/[0.06]"
      onClick={handleClick}
      type="button"
    >
      <Icon className="size-4 text-neutral-500 dark:text-neutral-400" />
      {label}
    </button>
  );
}
