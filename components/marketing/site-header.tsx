"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { brand, marketingNav } from "@/lib/brand";
import { cn } from "@/lib/utils";

const NAV_LINK_CLASS =
  "inline-flex rounded-md px-2.5 py-1.5 text-[14px] text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-50";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center rounded-lg bg-gradient-to-br from-[#00e5ff] via-[#a78bfa] to-[#ff2d95] px-3.5 py-1.5 text-[14px] font-medium text-white shadow-[0_2px_10px_rgba(167,139,250,0.35)] transition-all hover:shadow-[0_4px_16px_rgba(255,45,149,0.45)]";

const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-[14px] text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/5";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => !open);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#ededed] bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-[#0a0a0a]/85">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent"
      />
      <div className="grid h-[50px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
        <Link
          className="flex items-center gap-2 justify-self-start"
          href="/home"
        >
          <BrandMark />
          <span className="font-semibold text-[15px] tracking-tight">
            {brand.name}
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {marketingNav.map((item) => (
              <li key={item.href}>
                <Link className={NAV_LINK_CLASS} href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <Link
            className={cn(NAV_LINK_CLASS, "hidden md:inline-flex")}
            href="/rooms"
          >
            ห้องแชท
          </Link>
          <button
            aria-label={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
            className="grid size-8 place-items-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/5"
            onClick={toggleTheme}
            type="button"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link
            className={cn(SECONDARY_BUTTON_CLASS, "hidden sm:inline-flex")}
            href="/login"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            className={cn(PRIMARY_BUTTON_CLASS, "hidden sm:inline-flex")}
            href="/register"
          >
            สมัครฟรี
          </Link>
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            className="grid size-8 place-items-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 lg:hidden dark:text-neutral-300 dark:hover:bg-white/5"
            onClick={toggleMenu}
            type="button"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-[#ededed] bg-white px-4 py-3 lg:hidden dark:border-white/10 dark:bg-[#0a0a0a]">
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                className="block rounded-md px-2 py-2 text-[15px] text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5"
                href="/rooms"
                onClick={closeMenu}
              >
                ห้องแชท live
              </Link>
            </li>
            {marketingNav.map((item) => (
              <li key={item.href}>
                <Link
                  className="block rounded-md px-2 py-2 text-[15px] text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5"
                  href={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              className={cn(SECONDARY_BUTTON_CLASS, "justify-center")}
              href="/login"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              className={cn(PRIMARY_BUTTON_CLASS, "justify-center")}
              href="/register"
            >
              สมัครฟรี
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
