import type { Metadata } from "next";
import { CommunityRow } from "@/components/marketing/community-row";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { PromptHero } from "@/components/marketing/prompt-hero";
import { RoomsStrip } from "@/components/marketing/rooms-strip";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { TemplateShowcase } from "@/components/marketing/template-showcase";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  description: brand.description,
  title: "SILELO — สร้างเว็บแอปจริงจากไอเดีย",
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PromptHero />
        <TemplateShowcase />
        <FeatureBento />
        <RoomsStrip />
        <CommunityRow />
      </main>
      <SiteFooter />
    </>
  );
}
