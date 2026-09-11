import { Eye, Heart } from "lucide-react";
import Link from "next/link";
import {
  type PreviewVariant,
  SitePreview,
} from "@/components/marketing/site-preview";

type CommunityItem = {
  accent: string;
  caption: string;
  likes: string;
  owner: string;
  variant: PreviewVariant;
  views: string;
};

const ITEMS: CommunityItem[] = [
  {
    accent: "#00e5ff",
    caption: "ห้องแชท 3 ห้อง SLI / WORK / LAB",
    likes: "720",
    owner: "silelo",
    variant: "chat",
    views: "7.5K",
  },
  {
    accent: "#a78bfa",
    caption: "แดชบอร์ด M.O.N.K.Y",
    likes: "397",
    owner: "monky",
    variant: "dashboard",
    views: "1.8K",
  },
  {
    accent: "#ff2d95",
    caption: "มินิเกม 8-bit Garden City",
    likes: "812",
    owner: "lab",
    variant: "game",
    views: "2.4K",
  },
  {
    accent: "#ff8c42",
    caption: "SILELO EYE · สถานะระบบ",
    likes: "264",
    owner: "eye",
    variant: "status",
    views: "980",
  },
];

export function CommunityRow() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-12" id="community">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-semibold text-[24px] tracking-[-0.02em] sm:text-[28px]">
          ผลงานที่สร้างด้วย {" "}
          SILELO
        </h2>
        <Link
          className="inline-flex items-center text-[14px] text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-neutral-50"
          href="#templates"
        >
          ดูเทมเพลตทั้งหมด
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-x-[21px] gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <li key={item.caption}>
            <Link className="group block" href="/">
              <div className="aspect-3/4 overflow-hidden rounded-xl border border-[#ededed] bg-white transition-transform group-hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.03]">
                <SitePreview variant={item.variant} />
              </div>
              <div className="mt-3 flex items-start gap-2.5">
                <span
                  className="mt-0.5 size-6 shrink-0 rounded-full"
                  style={{ backgroundColor: item.accent }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-neutral-800 dark:text-neutral-200">
                    {item.caption}
                  </p>
                  <p className="mt-1 flex items-center gap-3 text-[13px] text-neutral-500">
                    <span>@{item.owner}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" />
                      {item.views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3.5" />
                      {item.likes}
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
