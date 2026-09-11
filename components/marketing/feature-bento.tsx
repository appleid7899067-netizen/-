import {
  CalendarDays,
  Cloud,
  Code2,
  CreditCard,
  Database,
  GitBranch,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageSquare,
  MousePointer2,
  Music,
  Rocket,
  Sparkles,
  Video,
} from "lucide-react";
import { BrandMark } from "@/components/marketing/brand-mark";
import {
  type PreviewVariant,
  SitePreview,
} from "@/components/marketing/site-preview";

const CARD_CLASS =
  "relative flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-[#ededed] bg-white p-8 lg:min-h-[415px] dark:border-white/10 dark:bg-white/[0.03]";

const TITLE_CLASS =
  "font-semibold text-[19px] tracking-[-0.01em] text-neutral-950 dark:text-neutral-50";

const BODY_CLASS = "mt-2 max-w-[36ch] text-[15px] text-neutral-500";

const APP_ICONS = [
  { accent: "#00e5ff", icon: Sparkles },
  { accent: "#ff2d95", icon: Database },
  { accent: "#a78bfa", icon: CreditCard },
  { accent: "#00ff88", icon: Cloud },
  { accent: "#ff8c42", icon: Code2 },
  { accent: "#00e5ff", icon: Mail },
  { accent: "#a78bfa", icon: CalendarDays },
  { accent: "#ff2d95", icon: ImageIcon },
  { accent: "#00ff88", icon: Music },
  { accent: "#ff8c42", icon: Video },
  { accent: "#00e5ff", icon: MapPin },
  { accent: "#a78bfa", icon: MessageSquare },
] as const;

const MOSAIC: { id: string; variant: PreviewVariant }[] = [
  { id: "mosaic-chat", variant: "chat" },
  { id: "mosaic-status", variant: "status" },
  { id: "mosaic-landing", variant: "landing" },
  { id: "mosaic-mobile", variant: "mobile" },
  { id: "mosaic-dashboard", variant: "dashboard" },
  { id: "mosaic-game", variant: "game" },
  { id: "mosaic-portfolio", variant: "portfolio" },
  { id: "mosaic-storefront", variant: "storefront" },
  { id: "mosaic-mobile-2", variant: "mobile" },
];

export function FeatureBento() {
  return (
    <section className="px-4 pb-4 sm:px-6 lg:px-12" id="features">
      <div className="grid grid-cols-1 gap-[21px] md:grid-cols-2 lg:grid-cols-3">
        <article className={`${CARD_CLASS} justify-end`}>
          <p className="font-semibold text-[34px] leading-[1.06] tracking-[-0.03em] sm:text-[38px]">
            พร้อมท์.
            <br />
            สร้าง.{" "}
            <span className="bg-gradient-to-r from-[#00e5ff] via-[#a78bfa] to-[#ff2d95] bg-clip-text text-transparent">
              เผยแพร่.
            </span>
          </p>
          <p className="mt-4 max-w-[38ch] text-[15px] text-neutral-500">
            สร้างเว็บแอปที่ใช้งานได้จริงในไม่กี่นาทีด้วย AI แล้วปล่อยเป็นเว็บจริงในไม่กี่วินาที
          </p>
        </article>

        <article className={CARD_CLASS}>
          <h3 className={TITLE_CLASS}>ซิงก์กับเรพของคุณ</h3>
          <p className={BODY_CLASS}>
            เชื่อม GitHub แล้ว push โค้ดกลับเข้าเรพเดิมได้ทันที ทุกการแก้ไขมีประวัติ
          </p>
          <div className="mt-auto flex items-center gap-4 pt-8">
            <span className="grid size-16 place-items-center rounded-full bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:bg-white/10">
              <BrandMark className="size-7 rounded-[9px] text-[15px]" />
            </span>
            <span className="grid size-16 place-items-center rounded-full bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:bg-white/10">
              <GitBranch className="size-7 text-neutral-900 dark:text-neutral-100" />
            </span>
          </div>
        </article>

        <article className={CARD_CLASS}>
          <h3 className={TITLE_CLASS}>ต่อกับแอปที่ใช้อยู่</h3>
          <p className={BODY_CLASS}>
            ใช้เครื่องมือและ API ที่ทีมคุณใช้อยู่แล้ว เชื่อมให้อัตโนมัติ ไม่ต้องสมัครเพิ่ม
          </p>
          <div className="mt-auto grid grid-cols-4 gap-2.5 pt-8 [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]">
            {APP_ICONS.map(({ accent, icon: Icon }) => (
              <span
                className="grid aspect-square place-items-center rounded-full"
                key={`${accent}-${Icon.displayName ?? "icon"}`}
                style={{ backgroundColor: `${accent}1f` }}
              >
                <Icon className="size-4" style={{ color: accent }} />
              </span>
            ))}
          </div>
        </article>

        <article className={`${CARD_CLASS} lg:min-h-[415px]`}>
          <h3 className={TITLE_CLASS}>ดีพลอยที่ไหนก็ได้</h3>
          <p className={BODY_CLASS}>
            ขึ้นโปรดักชันในไม่กี่วินาที รองรับทั้ง Render, Docker และแพลตฟอร์มที่ทีมใช้อยู่
          </p>
          <div className="mt-auto grid place-items-center pt-8">
            <Rocket
              className="size-24 text-neutral-900 dark:text-neutral-100"
              strokeWidth={1.25}
            />
          </div>
        </article>

        <article className={CARD_CLASS}>
          <h3 className={TITLE_CLASS}>แก้ดีไซน์แบบลากวาง</h3>
          <p className={BODY_CLASS}>
            ปรับสี ฟอนต์ และความมนของมุมจากแผง inspector พร้อมพรีวิวสดทันที
          </p>
          <div className="relative mt-auto grid place-items-center pt-8">
            <span className="rounded-md border border-[#e5e5e5] bg-white px-6 py-3 text-[15px] text-neutral-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:border-white/15 dark:bg-white/5 dark:text-neutral-100">
              จองที่นั่ง
            </span>
            <MousePointer2 className="absolute right-2 bottom-0 size-5 translate-x-2 translate-y-1 text-neutral-900 dark:text-neutral-100" />
          </div>
        </article>

        <article className={CARD_CLASS}>
          <h3 className={TITLE_CLASS}>เริ่มจากเทมเพลต</h3>
          <p className={BODY_CLASS}>
            เริ่มเร็วขึ้นด้วยคอมโพเนนต์และหน้าสำเร็จรูปที่พร้อมแก้ทุกจุด
          </p>
          <div className="mt-auto grid grid-cols-3 gap-2 pt-8 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
            {MOSAIC.map((item) => (
              <div
                className="aspect-3/4 overflow-hidden rounded-md border border-[#ededed] dark:border-white/10"
                key={item.id}
              >
                <SitePreview variant={item.variant} />
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
