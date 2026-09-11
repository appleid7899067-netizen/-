export type GatewayStatus =
  | "checking"
  | "connecting"
  | "connected"
  | "standalone"
  | "disconnected"
  | "error";

export type RoomGatewayEvent =
  | {
      type: "connection";
      status: "connected" | "disconnected";
    }
  | {
      type: "presence";
      members: number;
    }
  | {
      type: "room.message";
      author: string;
      id: string;
      initials: string;
      role: "assistant" | "user";
      text: string;
      time: string;
    }
  | {
      type: "error";
      message: string;
    };

export function toWebSocketUrl(value: string) {
  const url = new URL(value);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/ws`;
  return url.toString();
}

export function isRoomGatewayEvent(value: unknown): value is RoomGatewayEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return typeof event.type === "string";
}
