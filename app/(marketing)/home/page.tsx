import type { Metadata } from "next";
import { TemplateOSHome } from "@/components/marketing/template-os-home";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  description: brand.description,
  title: "TEMPLATE OS — ระบบปฏิบัติการเทมเพลตชั้นนำ",
};

export default function HomePage() {
  return <TemplateOSHome />;
}
