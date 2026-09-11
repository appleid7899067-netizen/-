import { Suspense } from "react";
import type { Metadata } from "next";
import { RoomChatShell } from "@/components/rooms/room-chat-shell";

export const metadata: Metadata = {
  description: "ลองใช้งานห้องแชทจำลองของ SILELO ได้ทันทีในเบราว์เซอร์",
  title: "ห้องแชทจำลอง — SILELO",
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
      กำลังเปิดห้องแชทจำลอง...
    </main>
  );
}
