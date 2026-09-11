import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/marketing/brand-mark";
import { CopyrightNote } from "@/components/marketing/copyright-note";
import { brand, footerColumns } from "@/lib/brand";

export function SiteFooter() {
  return (
    <>
      <section
        className="px-4 pt-8 pb-24 text-center sm:px-6 lg:px-12"
        id="start"
      >
        <h2 className="font-semibold text-[28px] tracking-[-0.03em] sm:text-[32px]">
          เริ่มสร้างกับ {brand.name}
        </h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-[16px] text-neutral-500">
          จากไอเดียถึงเว็บจริงในไม่กี่วินาที บนโครงสร้างที่พร้อมใช้งานและปลอดภัย
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            className="inline-flex items-center rounded-full bg-[#0a0a0a] px-6 py-3 text-[15px] text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-[#0a0a0a]"
            href="/"
          >
            เริ่มเลย
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-5 py-3 text-[15px] text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/5"
            href={brand.appUrl}
            rel="noreferrer"
            target="_blank"
          >
            เปิดแอป SILELO
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#ededed] px-4 py-14 sm:px-6 lg:px-12 dark:border-white/10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link className="flex items-center gap-2" href="/home">
              <BrandMark />
              <span className="font-semibold text-[15px] tracking-tight">
                {brand.name}
              </span>
            </Link>
            <p className="mt-3 max-w-[28ch] text-[14px] text-neutral-500">
              {brand.description}
            </p>
          </div>

          {footerColumns.map((column) => (
            <nav aria-label={column.title} key={column.title}>
              <h3 className="font-semibold text-[15px] text-neutral-900 dark:text-neutral-100">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        className="inline-flex items-center gap-1 text-[14px] text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50"
                        href={link.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.label}
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    ) : (
                      <Link
                        className="text-[14px] text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <CopyrightNote />
      </footer>
    </>
  );
}
