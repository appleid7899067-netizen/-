"use client";

import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";

/**
 * ปีลิขสิทธิ์อ่านหลัง mount เท่านั้น
 * (Next 16 ไม่อนุญาตให้เรียก new Date() ระหว่าง prerender ทั้งใน Server
 * และ Client Component ถ้าไม่มี Suspense boundary)
 */
export function CopyrightNote() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <p className="mt-12 text-[13px] text-muted-foreground">
      © {year ?? ""} {brand.name} — สร้างด้วย Next.js และ AI SDK
    </p>
  );
}
