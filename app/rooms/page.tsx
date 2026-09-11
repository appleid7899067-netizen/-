import { Suspense } from "react";
import type { Metadata } from "next";
import { RoomChatShell } from "@/components/rooms/room-chat-shell";

export const metadata: Metadata = {
  description: "ห้องแชท live ของ SILELO Agent พร้อม Puter AI, ไฟล์แนบ และ sandbox runtime",
  title: "Live rooms — SILELO",
};

export default function RoomsPage() {
  return (
    <Suspense fallback={<RoomsLoadingState />}>
      <RoomChatShell />
    </Suspense>
  );
}

function RoomsLoadingState() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background text-muted-foreground">
      กำลังเชื่อมต่อ live room...
    </main>
  );
}
