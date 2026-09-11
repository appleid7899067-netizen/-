"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  type PreviewVariant,
  SitePreview,
} from "@/components/marketing/site-preview";
import { cn } from "@/lib/utils";

type ShowcaseCategory = "chat" | "dashboard" | "landing" | "storefront";
type ShowcaseTab = "all" | ShowcaseCategory;

type ShowcaseItem = {
  caption: string;
  categories: ShowcaseCategory[];
  tag: string;
  variant: PreviewVariant;
};

const TABS: { label: string; value: ShowcaseTab }[] = [
  { label: "ทั้งหมด", value: "all" },
  { label: "แลนดิ้งเพจ", value: "landing" },
  { label: "แอปแชท", value: "chat" },
  { label: "แดชบอร์ด", value: "dashboard" },
  { label: "ร้านค้า", value: "storefront" },
];

const ITEMS: ShowcaseItem[] = [
  {
    caption: "แลนดิ้งเพจสตูดิโอออกแบบ",
    categories: ["landing"],
    tag: "Next.js",
    variant: "landing",
  },
  {
    caption: "พอร์ตโฟลิโอช่างภาพ",
    categories: ["landing"],
    tag: "Tailwind",
    variant: "portfolio",
  },
  {
    caption: "ร้านสินค้าแฮนด์เมด",
    categories: ["storefront"],
    tag: "Cart",
    variant: "storefront",
  },
  {
    caption: "มินิเกม 8-bit",
    categories: ["storefront"],
    tag: "Canvas",
    variant: "game",
  },
  {
    caption: "แดชบอร์ด M.O.N.K.Y",
    categories: ["dashboard"],
    tag: "Charts",
    variant: "dashboard",
  },
  {
    caption: "SILELO EYE · สถานะระบบ",
    categories: ["dashboard"],
    tag: "Cron",
    variant: "status",
  },
  {
    caption: "ห้องแชท 3 ห้อง SLI / WORK / LAB",
    categories: ["chat"],
    tag: "Streaming",
    variant: "chat",
  },
  {
    caption: "แชทบนมือถือ",
    categories: ["chat"],
    tag: "PWA",
    variant: "mobile",
  },
];

export function TemplateShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("all");

  const items =
    activeTab === "all"
      ? ITEMS
      : ITEMS.filter((item) => item.categories.includes(activeTab));

  const selectTab = useCallback((value: ShowcaseTab) => {
    setActiveTab(value);
  }, []);

  return (
    <section className="px-4 pt-6 pb-12 sm:px-6 lg:px-12" id="templates">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-semibold text-[24px] tracking-[-0.02em] sm:text-[28px]">
          เริ่มจากเทมเพลต
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <CategoryTab
              active={activeTab === tab.value}
              key={tab.value}
              label={tab.label}
              onSelect={selectTab}
              value={tab.value}
            />
          ))}
          <Link
            className="ml-1 inline-flex items-center text-[14px] text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-neutral-50"
            href="#community"
          >
            ดูทั้งหมด
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-x-[21px] gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.caption}>
            <Link className="group block" href="/">
              <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-[#ededed] bg-white dark:border-white/10 dark:bg-white/[0.03]">
                <SitePreview variant={item.variant} />
                <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[12px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  เปิดในบิลเดอร์
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[15px] text-neutral-800 dark:text-neutral-200">
                  {item.caption}
                </span>
                <span className="shrink-0 font-mono text-[12px] text-neutral-400 uppercase">
                  {item.tag}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryTab({
  active,
  label,
  onSelect,
  value,
}: {
  active: boolean;
  label: string;
  onSelect: (value: ShowcaseTab) => void;
  value: ShowcaseTab;
}) {
  const handleClick = useCallback(() => {
    onSelect(value);
  }, [onSelect, value]);

  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-[14px] transition-colors",
        active
          ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-[#0a0a0a]"
          : "border-[#e5e5e5] bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
      )}
      onClick={handleClick}
      type="button"
    >
      {label}
    </button>
  );
}
