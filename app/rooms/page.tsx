import { Suspense } from "react";
import type { Metadata } from "next";
import { RoomChatShell } from "@/components/rooms/room-chat-shell";

export const metadata: Metadata = {
  description: "workspace live ของ TEMPLATE OS สำหรับคุย วางระบบ และทำงานต่อใน 3 ห้อง",
  title: "workspace live — TEMPLATE OS",
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
