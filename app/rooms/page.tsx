import type { Metadata } from "next";
import EveChatShell from "@/components/eve-chat-shell";
import "@/components/eve-chat-shell.css";

export const metadata: Metadata = {
  description: "EVE chat workspace",
  title: "EVE — ห้องแชท",
};

export default function RoomsPage() {
  return <EveChatShell />;
}
