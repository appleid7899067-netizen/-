/**
 * TEMPLATE OS brand identity and product navigation.
 */
export const brand = {
  accent: "#c9f27a",
  accentAlt: "#e7a86b",
  accentViolet: "#9da8a0",
  appUrl: "https://template-os.app",
  description:
    "TEMPLATE OS — ระบบปฏิบัติการเทมเพลตชั้นนำสำหรับเลือก ปรับ และส่งต่อเว็บที่พร้อมทำงาน",
  githubUrl:
    "https://github.com/phanuphanthcanthrsngsaeng6-hue/template-os",
  name: "TEMPLATE OS",
} as const;

export const marketingNav = [
  { href: "#templates", label: "เทมเพลต" },
  { href: "#workflow", label: "วิธีทำงาน" },
  { href: "#community", label: "ชุมชน" },
] as const;

export const rooms = [
  {
    accent: brand.accent,
    description: "คุยกับ copilot เพื่อเปลี่ยน brief ให้เป็นระบบที่เริ่มต่อได้",
    label: "START",
    name: "ห้องเริ่มต้น",
    url: "/rooms?room=sli",
  },
  {
    accent: brand.accentViolet,
    description: "วางโครง สรุปงาน และส่งต่อแนวคิดให้ทีมในที่เดียว",
    label: "BUILD",
    name: "ห้องสร้างระบบ",
    url: "/rooms?room=work",
  },
  {
    accent: brand.accentAlt,
    description: "ทดลองแนวทางใหม่กับพื้นที่ที่เปิดให้คิดและทดสอบเร็ว",
    label: "LAB",
    name: "ห้องทดลอง",
    url: "/rooms?room=lab",
  },
] as const;

export const footerColumns = [
  {
    links: [
      { external: false, href: "/home", label: "หน้าแรก" },
      { external: false, href: "#templates", label: "เทมเพลต" },
      { external: false, href: "#workflow", label: "วิธีทำงาน" },
      { external: false, href: "/rooms", label: "workspace" },
    ],
    title: "ผลิตภัณฑ์",
  },
  {
    links: [
      { external: false, href: "/login", label: "เข้าสู่ระบบ" },
      { external: false, href: "/register", label: "สมัครฟรี" },
      { external: false, href: "/rooms?room=lab", label: "เปิดห้องทดลอง" },
    ],
    title: "เริ่มใช้งาน",
  },
  {
    links: [
      { external: true, href: brand.githubUrl, label: "โค้ดบน GitHub" },
      { external: false, href: "/home#community", label: "community notes" },
      { external: false, href: "/home#workflow", label: "ระบบการทำงาน" },
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
