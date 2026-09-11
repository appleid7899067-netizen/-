import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { brand, rooms } from "@/lib/brand";

export function RoomsStrip() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-12" id="rooms">
      <div className="rounded-2xl border border-[#ededed] bg-[#fafafa] px-8 py-10 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-semibold text-[22px] tracking-[-0.02em]">
            ผู้ช่วย 3 ห้องของ {brand.name}
          </h2>
          <Link
            className="inline-flex items-center gap-1 text-[14px] text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-neutral-50"
            href={brand.appUrl}
            rel="noreferrer"
            target="_blank"
          >
            เปิดแอปจริง
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.label}>
              <Link
                className="group block"
                href={room.url}
                rel="noreferrer"
                target="_blank"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: room.accent }}
                  />
                  <span className="font-mono text-[12px] tracking-[0.2em] text-neutral-500 uppercase">
                    {room.label}
                  </span>
                </span>
                <span className="mt-2 block font-medium text-[17px] text-neutral-900 transition-colors group-hover:text-neutral-950 dark:text-neutral-100">
                  {room.name}
                </span>
                <span className="mt-1 block text-[14px] text-neutral-500">
                  {room.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
