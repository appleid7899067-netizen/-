"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleUserRound,
  Command,
  Grid2X2,
  Layers3,
  LayoutTemplate,
  MoreHorizontal,
  PanelLeft,
  Plus,
  X,
  Search,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  WandSparkles,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { brand } from "@/lib/brand";

type Category = "ทั้งหมด" | "แดชบอร์ด" | "เว็บไซต์" | "ระบบงาน";
type Tone = "primary" | "accent" | "secondary";
type TemplateKind = "dashboard" | "editorial" | "workflow";

type TemplateRecord = {
  id: string;
  title: string;
  category: Exclude<Category, "ทั้งหมด">;
  kind: TemplateKind;
  description: string;
  updated: string;
  version: string;
  tags: string[];
  tone: Tone;
  initials: string;
};

const categories: Category[] = ["ทั้งหมด", "แดชบอร์ด", "เว็บไซต์", "ระบบงาน"];

const templates: TemplateRecord[] = [
  {
    id: "signal-console",
    title: "Signal Console",
    category: "แดชบอร์ด",
    kind: "dashboard",
    description: "ศูนย์ควบคุมข้อมูลที่ทำให้ทีมเห็นสัญญาณสำคัญในหน้าจอเดียว",
    updated: "2 นาทีที่แล้ว",
    version: "v2.4",
    tags: ["Analytics", "Command center"],
    tone: "primary",
    initials: "SC",
  },
  {
    id: "field-notes",
    title: "Field Notes",
    category: "เว็บไซต์",
    kind: "editorial",
    description: "โครงสร้างเนื้อหาแบบ editorial สำหรับแบรนด์ที่มีมุมมองชัดเจน",
    updated: "18 นาทีที่แล้ว",
    version: "v1.8",
    tags: ["Editorial", "Storytelling"],
    tone: "accent",
    initials: "FN",
  },
  {
    id: "handoff-flow",
    title: "Handoff Flow",
    category: "ระบบงาน",
    kind: "workflow",
    description: "พื้นที่ทำงานที่ต่อ brief, owner และสถานะการส่งมอบเข้าด้วยกัน",
    updated: "เมื่อวาน",
    version: "v3.1",
    tags: ["Operations", "Team"],
    tone: "secondary",
    initials: "HF",
  },
  {
    id: "orbit-store",
    title: "Orbit Store",
    category: "เว็บไซต์",
    kind: "dashboard",
    description: "หน้าร้านที่ออกแบบให้สินค้าและการตัดสินใจอยู่ใกล้กัน",
    updated: "เมื่อวาน",
    version: "v1.2",
    tags: ["Commerce", "Launch"],
    tone: "primary",
    initials: "OS",
  },
  {
    id: "quiet-finance",
    title: "Quiet Finance",
    category: "แดชบอร์ด",
    kind: "workflow",
    description: "มุมมองการเงินที่นิ่ง ชัด และพร้อมให้ทีมลงมือทำต่อ",
    updated: "3 วันที่แล้ว",
    version: "v2.0",
    tags: ["Finance", "Reports"],
    tone: "accent",
    initials: "QF",
  },
  {
    id: "studio-kit",
    title: "Studio Kit",
    category: "ระบบงาน",
    kind: "editorial",
    description: "ระบบตั้งต้นสำหรับทีมสร้างสรรค์ที่ต้องการรักษาคุณภาพให้สม่ำเสมอ",
    updated: "4 วันที่แล้ว",
    version: "v0.9",
    tags: ["Creative", "System"],
    tone: "secondary",
    initials: "SK",
  },
];

const toneStyles: Record<Tone, string> = {
  primary: "border-primary/25 bg-primary/10 text-primary",
  accent: "border-accent/30 bg-accent/10 text-accent",
  secondary: "border-border bg-muted text-muted-foreground",
};

export function TemplateOSHome() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("ทั้งหมด");
  const [selectedId, setSelectedId] = useState(templates[0].id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesCategory = category === "ทั้งหมด" || template.category === category;
      const searchableText = [
        template.title,
        template.category,
        template.description,
        ...template.tags,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, query]);

  const selectedTemplate =
    templates.find((template) => template.id === selectedId) ?? templates[0];

  function selectTemplate(template: TemplateRecord) {
    setSelectedId(template.id);
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/home" className="group flex items-center gap-3" aria-label={brand.name}>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_28px_-10px] shadow-primary">
                <LayoutTemplate className="size-4" aria-hidden="true" />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block font-mono text-[11px] font-semibold tracking-[0.22em] text-primary">
                  {brand.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">Template operating system</span>
              </span>
            </Link>
            <span className="hidden h-6 w-px bg-border md:block" aria-hidden="true" />
            <span className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              workspace / northstar
            </span>
          </div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="เมนูหลัก">
            <a className="rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground" href="#templates">
              สำรวจ
            </a>
            <a className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" href="#workflow">
              วิธีทำงาน
            </a>
            <a className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" href="#community">
              ชุมชน
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden text-muted-foreground sm:inline-flex" })}>
              เข้าสู่ระบบ
            </Link>
            <Link href="/rooms" className={buttonVariants({ size: "sm", className: "gap-2 rounded-lg" })}>
              <Plus data-icon="inline-start" />
              <span className="hidden sm:inline">เริ่ม workspace</span>
              <span className="sm:hidden">เริ่ม</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-lg lg:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X aria-hidden="true" /> : <PanelLeft aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="border-b border-border/70 bg-card px-4 py-4 lg:hidden">
          <nav aria-label="เมนู mobile" className="flex flex-col gap-1">
            <a
              className="rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
              href="#templates"
              onClick={() => setMobileMenuOpen(false)}
            >
              สำรวจเทมเพลต
            </a>
            <a
              className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
            >
              วิธีทำงาน
            </a>
            <a
              className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href="#community"
              onClick={() => setMobileMenuOpen(false)}
            >
              ชุมชน
            </a>
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              className={buttonVariants({ variant: "outline", size: "sm", className: "justify-center" })}
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              className={buttonVariants({ size: "sm", className: "justify-center" })}
              href="/rooms"
              onClick={() => setMobileMenuOpen(false)}
            >
              เปิด workspace
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1480px] gap-0 px-4 md:px-8 lg:grid-cols-[216px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border/70 py-8 pr-6 lg:block">
          <div className="sticky top-24 flex flex-col gap-8">
            <div>
              <p className="mb-3 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Library
              </p>
              <div className="flex flex-col gap-1">
                <SidebarItem icon={Grid2X2} label="เทมเพลตทั้งหมด" active count="24" />
                <SidebarItem icon={Layers3} label="ระบบของฉัน" count="08" />
                <SidebarItem icon={Sparkles} label="อัปเดตล่าสุด" count="12" />
              </div>
            </div>
            <div>
              <p className="mb-3 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Collections
              </p>
              <div className="flex flex-col gap-1">
                {categories.slice(1).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      category === item
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    {item}
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {templates.filter((template) => template.category === item).length.toString().padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary">
                  <WandSparkles className="size-3.5" aria-hidden="true" />
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">FREE CORE</span>
              </div>
              <p className="text-sm font-medium">เริ่มจากระบบ ไม่ใช่หน้าว่าง</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                ทุกเทมเพลตเปิดให้ดูโครงสร้าง แก้ไข และนำไปต่อได้ทันที
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 py-8 lg:pl-10 lg:py-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  Template operating system / 01
                </div>
                <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
                  สร้างจากระบบที่ดี
                  <span className="block text-muted-foreground">ไม่ใช่หน้าว่าง</span>
                </h1>
                <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                  คัดเลือกเทมเพลตที่พร้อมทำงาน ปรับให้เป็นของคุณ แล้วส่งต่อเป็นระบบจริงใน workspace เดียว
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex -space-x-2">
                  <span className="grid size-7 place-items-center rounded-full border-2 border-card bg-primary text-[10px] font-semibold text-primary-foreground">น</span>
                  <span className="grid size-7 place-items-center rounded-full border-2 border-card bg-accent text-[10px] font-semibold text-accent-foreground">ก</span>
                  <span className="grid size-7 place-items-center rounded-full border-2 border-card bg-secondary text-[10px] font-semibold text-secondary-foreground">ป</span>
                </div>
                <div>
                  <p className="text-sm font-medium">ทีมกำลังสร้างอยู่</p>
                  <p className="text-xs text-muted-foreground">ผู้สร้าง 1,284 คนในสัปดาห์นี้</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative flex min-h-12 flex-1 items-center rounded-xl border border-border bg-card px-4 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
                <Search className="mr-3 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">ค้นหาเทมเพลต</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ค้นหาเทมเพลต เช่น analytics, team, launch"
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <span className="hidden items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground sm:flex">
                  <Command className="size-3" aria-hidden="true" /> K
                </span>
              </label>
              <Button variant="outline" className="min-h-12 justify-between gap-8 rounded-xl border-border bg-card px-4 sm:hidden">
                <span className="flex items-center gap-2"><SlidersHorizontal className="size-4" /> ตัวกรอง</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </div>

            <div id="templates" className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    category === item
                      ? "border-primary/30 bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="featured-template-title">
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-primary">
                    FEATURED
                  </span>
                  <span className="text-xs text-muted-foreground">ระบบแนะนำสำหรับเริ่มต้นวันนี้</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{selectedTemplate.version} / {selectedTemplate.updated}</span>
              </div>
              <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
                <div className="flex flex-col justify-between gap-8 p-5 sm:p-7 lg:p-8">
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <span className={`grid size-11 place-items-center rounded-xl border font-mono text-xs font-semibold ${toneStyles[selectedTemplate.tone]}`}>
                        {selectedTemplate.initials}
                      </span>
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground" aria-label="ตัวเลือกเพิ่มเติม">
                        <MoreHorizontal aria-hidden="true" />
                      </Button>
                    </div>
                    <h2 id="featured-template-title" className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                      {selectedTemplate.title}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedTemplate.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href={`/rooms?template=${selectedTemplate.id}`} className={buttonVariants({ className: "gap-2 rounded-lg" })}>
                      ใช้เทมเพลตนี้
                      <ArrowUpRight data-icon="inline-end" />
                    </Link>
                    <Button variant="outline" className="gap-2 rounded-lg border-border bg-transparent">
                      <LayoutTemplate data-icon="inline-start" /> ดูโครงสร้าง
                    </Button>
                  </div>
                </div>
                <TemplatePreview template={selectedTemplate} large />
              </div>
            </section>

            <div className="flex flex-col gap-4" id="library">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Library / {filteredTemplates.length.toString().padStart(2, "0")}</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">ระบบที่คนกำลังใช้</h2>
                </div>
                <Button variant="ghost" size="sm" className="hidden gap-2 text-muted-foreground sm:inline-flex">
                  เรียงตาม <ChevronDown data-icon="inline-end" />
                </Button>
              </div>
              {filteredTemplates.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      selected={template.id === selectedTemplate.id}
                      onSelect={() => selectTemplate(template)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
                  <p className="text-sm font-medium">ยังไม่พบเทมเพลตที่ตรงกับคำค้น</p>
                  <p className="mt-2 text-sm text-muted-foreground">ลองใช้คำค้นที่กว้างขึ้น หรือดูเทมเพลตทั้งหมด</p>
                  <Button variant="outline" className="mt-5 rounded-lg" onClick={() => { setQuery(""); setCategory("ทั้งหมด"); }}>
                    ล้างตัวกรอง
                  </Button>
                </div>
              )}
            </div>

            <section id="workflow" className="grid gap-4 border-y border-border py-8 md:grid-cols-[0.8fr_1.2fr] md:gap-10 md:py-10">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">The operating model</p>
                <h2 className="mt-3 max-w-sm text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">จากการเลือก ไปสู่ระบบที่ใช้ได้จริง</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">ไม่ต้องเริ่มจากการจัดไฟล์ใหม่ทุกครั้ง ให้ระบบตั้งต้นพาคุณไปถึงจุดที่ทีมลงมือทำต่อได้เร็วขึ้น</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <WorkflowStep number="01" icon={Search} title="เลือก" detail="เริ่มจากรูปแบบที่ใกล้กับงานจริง" />
                <WorkflowStep number="02" icon={SlidersHorizontal} title="ปรับ" detail="แก้โทน เนื้อหา และลำดับของคุณ" />
                <WorkflowStep number="03" icon={Terminal} title="ส่งต่อ" detail="เปิด workspace แล้วสร้างต่อทันที" />
              </div>
            </section>

            <section id="community" className="grid gap-4 pb-8 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">Open workspace</p>
                    <h2 className="mt-4 max-w-md text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">มีไอเดียอยู่แล้ว? ให้ TEMPLATE OS จัดระบบให้</h2>
                    <p className="mt-3 max-w-md text-sm leading-6 opacity-80">เปิดห้องทำงานเพื่อคุยกับ copilot, วางโครง และเปลี่ยน brief ให้กลายเป็นหน้าที่ใช้งานได้</p>
                  </div>
                  <Sparkles className="hidden size-6 shrink-0 opacity-70 sm:block" aria-hidden="true" />
                </div>
                <Link href="/rooms" className={buttonVariants({ variant: "secondary", className: "mt-8 gap-2 rounded-lg bg-background text-foreground hover:bg-background/90" })}>
                  เปิด workspace
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><CircleUserRound className="size-4" /></span>
                  <span className="font-mono text-[10px] text-primary">LIVE / 1,284</span>
                </div>
                <p className="mt-8 text-lg font-medium tracking-[-0.02em]">“ระบบที่ดีทำให้ทีมมีพื้นที่คิดมากขึ้น”</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">พื้นที่กลางสำหรับทีมที่อยากเริ่มเร็ว แต่ยังอยากรักษามาตรฐานของงานไว้ครบ</p>
                <div className="mt-7 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <span>community notes</span>
                  <Link href="/register" className="flex items-center gap-1 font-medium text-foreground hover:text-primary">เข้าร่วม <ArrowUpRight className="size-3" /></Link>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p><span className="font-mono font-semibold text-foreground">{brand.name}</span> · ระบบปฏิบัติการเทมเพลตชั้นนำ</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">เข้าสู่ระบบ</Link>
            <Link href="/register" className="hover:text-foreground">สมัครใช้งาน</Link>
            <span className="font-mono text-[10px]">v1.0 / free core</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  count,
}: {
  icon: typeof Grid2X2;
  label: string;
  active?: boolean;
  count?: string;
}) {
  return (
    <button
      type="button"
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count ? <span className="font-mono text-[10px] text-muted-foreground">{count}</span> : null}
    </button>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: TemplateRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group overflow-hidden rounded-2xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_50px_-28px] hover:shadow-primary ${
        selected ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
      }`}
      aria-pressed={selected}
    >
      <TemplatePreview template={template} />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg border font-mono text-[10px] font-semibold ${toneStyles[template.tone]}`}>
              {template.initials}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{template.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{template.category} · {template.version}</p>
            </div>
          </div>
          {selected ? <Check className="size-4 shrink-0 text-primary" aria-label="เลือกอยู่" /> : <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />}
        </div>
        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{template.description}</p>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-wrap gap-1.5">
            {template.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{tag}</span>)}
          </div>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{template.updated}</span>
        </div>
      </div>
    </button>
  );
}

function TemplatePreview({ template, large = false }: { template: TemplateRecord; large?: boolean }) {
  return (
    <div className={`${large ? "min-h-[270px] p-5 sm:min-h-[330px] sm:p-8" : "aspect-[1.45] p-3"} bg-muted/35`} aria-hidden="true">
      <div className="h-full overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-background/30">
        <div className="flex h-8 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[8px] tracking-[0.14em] text-muted-foreground">{template.initials}.OS</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-1.5 w-10 rounded-full bg-muted" />
            <MoreHorizontal className="size-3" />
          </div>
        </div>
        <div className="grid h-[calc(100%-2rem)] grid-cols-[28%_1fr]">
          <div className="border-r border-border bg-card/60 p-2.5">
            <div className="mb-4 h-2.5 w-12 rounded-sm bg-foreground/80" />
            <div className="flex flex-col gap-2">
              {["w-full", "w-4/5", "w-11/12", "w-3/5", "w-4/5"].map((width, index) => (
                <div key={`${width}-${index}`} className={`h-1.5 rounded-full ${index === 0 ? "bg-primary/70" : "bg-muted"} ${width}`} />
              ))}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3 p-3 sm:p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="h-2.5 w-20 rounded-sm bg-foreground/80" />
                <div className="mt-2 h-1.5 w-32 rounded-full bg-muted" />
              </div>
              <div className="h-5 w-14 rounded-md border border-border bg-muted/70" />
            </div>
            {template.kind === "editorial" ? <EditorialPreview /> : template.kind === "workflow" ? <WorkflowPreview /> : <DashboardPreview />}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {["w-2/3", "w-1/2", "w-3/4"].map((width, index) => (
          <div key={width} className="rounded-md border border-border bg-card p-2">
            <div className="h-1.5 w-8 rounded-full bg-muted" />
            <div className={`mt-3 h-2.5 rounded-sm bg-primary/70 ${width}`} />
            <div className="mt-2 h-1 w-10 rounded-full bg-muted" />
            {index === 1 ? <div className="mt-2 h-1 w-6 rounded-full bg-accent/70" /> : null}
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 gap-2 rounded-md border border-border bg-card p-2.5">
        <div className="flex flex-1 items-end gap-1.5 pb-1">
          {["h-1/3", "h-2/3", "h-1/2", "h-5/6", "h-3/5", "h-full", "h-4/5"].map((height, index) => (
            <span key={`${height}-${index}`} className={`flex-1 rounded-t-sm ${index === 5 ? "bg-primary" : "bg-primary/25"} ${height}`} />
          ))}
        </div>
        <div className="hidden w-1/3 flex-col justify-between border-l border-border pl-2.5 sm:flex">
          <div className="h-1.5 w-10 rounded-full bg-muted" />
          <div className="h-12 w-12 rounded-full border-4 border-primary/60 border-r-muted border-b-muted" />
          <div className="h-1.5 w-16 rounded-full bg-muted" />
        </div>
      </div>
    </>
  );
}

function EditorialPreview() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_0.8fr] gap-2">
      <div className="flex flex-col justify-end rounded-md border border-border bg-card p-3">
        <div className="mb-auto h-10 w-full rounded-md bg-accent/25" />
        <div className="mt-3 h-2.5 w-4/5 rounded-sm bg-foreground/80" />
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted" />
        <div className="mt-1.5 h-1.5 w-3/5 rounded-full bg-muted" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex-1 rounded-md border border-border bg-card p-2.5"><div className="h-full rounded bg-muted/80" /></div>
        <div className="flex-1 rounded-md border border-border bg-card p-2.5"><div className="h-1.5 w-2/3 rounded-full bg-foreground/70" /><div className="mt-2 h-1.5 w-full rounded-full bg-muted" /></div>
      </div>
    </div>
  );
}

function WorkflowPreview() {
  return (
    <div className="grid min-h-0 flex-1 gap-2">
      {["Brief / ready", "Build / active", "Review / next"].map((label, index) => (
        <div key={label} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
          <span className={`grid size-5 place-items-center rounded-full font-mono text-[8px] ${index === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{index + 1}</span>
          <div className="min-w-0 flex-1"><div className="h-1.5 w-16 rounded-full bg-foreground/70" /><div className="mt-1.5 h-1 w-24 rounded-full bg-muted" /></div>
          <span className="hidden font-mono text-[8px] text-muted-foreground sm:block">{label}</span>
        </div>
      ))}
    </div>
  );
}

function WorkflowStep({
  number,
  icon: Icon,
  title,
  detail,
}: {
  number: string;
  icon: typeof Search;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-primary">{number}</span>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
