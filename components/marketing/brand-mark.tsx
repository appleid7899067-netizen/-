import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

const MARK_GRADIENT = `linear-gradient(135deg, ${brand.accent} 0%, ${brand.accentViolet} 52%, ${brand.accentAlt} 100%)`;

/**
 * ตราสัญลักษณ์ SILELO — สี่เหลี่ยมมนไล่สี cyan → violet → magenta
 * ใช้ตัวอักษรสีเข้ม (background_color ของแบรนด์) เพื่อให้คอนทราสต์ผ่าน WCAG
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-[7px] font-bold text-[#01030a] text-[13px]",
        className
      )}
      style={{ backgroundImage: MARK_GRADIENT }}
    >
      S
    </span>
  );
}
