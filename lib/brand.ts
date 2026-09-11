/**
 * SILELO brand identity.
 *
 * ทุกอย่างที่ระบุตัวตนของแบรนด์ (ชื่อ, สี, ลิงก์) รวมอยู่ที่ไฟล์นี้ไฟล์เดียว
 * หน้า /home จะเปลี่ยนตามทันทีโดยไม่ต้องแก้คอมโพเนนต์
 *
 * ค่าอ้างอิงจากเรพ SILELO Neo-Connect (public/manifest.json):
 * theme_color #00e5ff · background_color #01030a · ไฮไลต์หลักในแอป #ff2d95 / #a78bfa
 */
export const brand = {
  accent: "#00e5ff",
  accentAlt: "#ff2d95",
  accentViolet: "#a78bfa",
  appUrl: "https://silelo.onrender.com",
  description:
    "SILELO Neo-Connect — ผู้ช่วยส่วนตัว 3 ห้อง (SLI / WORK / LAB) ใช้ได้ทุกที่",
  githubUrl:
    "https://github.com/phanuphanthcanthrsngsaeng6-hue/silelo-neo-connect",
  name: "SILELO",
} as const;

export const marketingNav = [
  { href: "#templates", label: "เทมเพลต" },
  { href: "#features", label: "ความสามารถ" },
  { href: "#rooms", label: "3 ห้องแชท" },
  { href: "#community", label: "ผลงาน" },
] as const;

/**
 * 3 ห้องของ SILELO — ใช้เป็นแถบแบรนด์ใต้ส่วนความสามารถ
 */
export const rooms = [
  {
    accent: brand.accent,
    description: "คุยกับสลี่เรื่องส่วนตัว ปรับโทนให้ตรงใจ",
    label: "SLI",
    name: "ห้องส่วนตัว",
    url: `${brand.appUrl}/chat?room=private`,
  },
  {
    accent: brand.accentViolet,
    description: "โค้ด วางแผน สรุปงาน — ผู้ช่วยทำงานของทีม",
    label: "WORK",
    name: "ห้องทำงาน",
    url: `${brand.appUrl}/chat?room=work`,
  },
  {
    accent: brand.accentAlt,
    description: "นักประดิษฐ์ & นักทดลอง ทดลองของใหม่ได้ไม่จำกัด",
    label: "LAB",
    name: "ห้องแล็บ",
    url: `${brand.appUrl}/chat?room=lab`,
  },
] as const;

export const footerColumns = [
  {
    links: [
      { external: false, href: "/home", label: "หน้าแรก" },
      { external: false, href: "#features", label: "ความสามารถ" },
      { external: false, href: "#templates", label: "เทมเพลต" },
      { external: false, href: "/", label: "บิลเดอร์" },
    ],
    title: "ผลิตภัณฑ์",
  },
  {
    links: [
      { external: true, href: brand.appUrl, label: "เปิดแอปจริง (PWA)" },
      { external: false, href: "/login", label: "เข้าสู่ระบบ" },
      { external: false, href: "/register", label: "สมัครฟรี" },
      {
        external: true,
        href: `${brand.appUrl}/chat?room=lab`,
        label: "ห้อง LAB",
      },
    ],
    title: "เริ่มใช้งาน",
  },
  {
    links: [
      { external: true, href: brand.githubUrl, label: "โค้ดบน GitHub" },
      {
        external: true,
        href: `${brand.githubUrl}/blob/main/public/manifest.json`,
        label: "สเปก PWA",
      },
      {
        external: true,
        href: `${brand.appUrl}/sw.js`,
        label: "Service Worker",
      },
    ],
    title: "ทรัพยากร",
  },
  {
    links: [
      { external: true, href: "https://x.com/", label: "X (Twitter)" },
      { external: true, href: "https://www.linkedin.com/", label: "LinkedIn" },
    ],
    title: "โซเชียล",
  },
] as const;
