import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const port = Number(process.env.PORT || 8080);
const secret = process.env.ROOM_GATEWAY_SHARED_SECRET || "development-room-secret";
const databasePath = process.env.ROOM_DB_PATH || "/data/silelo-rooms.json";
const roomIds = new Set(["sli", "work", "lab"]);
const connections = new Map();
const store = loadStore();

function loadStore() {
  try {
    if (existsSync(databasePath)) return JSON.parse(readFileSync(databasePath, "utf8"));
  } catch {
    // Start with an empty store when a previous persistence file is invalid.
  }
  return { messages: { sli: [], work: [], lab: [] } };
}

function persist() {
  mkdirSync(dirname(databasePath), { recursive: true });
  writeFileSync(databasePath, JSON.stringify(store), "utf8");
}

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function authorized(request) {
  const provided = request.headers["x-silelo-gateway-secret"] || "";
  return !process.env.ROOM_GATEWAY_SHARED_SECRET || provided === secret;
}

function validRoom(roomId) {
  return roomIds.has(roomId);
}

function signTicket(roomId, subject = "guest") {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + 30 * 60 * 1000, roomId, subject }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyTicket(ticket, roomId) {
  const [payload, signature] = String(ticket || "").split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (signature.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.roomId === roomId && data.exp > Date.now();
  } catch {
    return false;
  }
}

function normalizeMessage(value) {
  if (!value || typeof value !== "object") return null;
  const message = value.message && typeof value.message === "object" ? value.message : value;
  if (
    typeof message.id !== "string" ||
    typeof message.text !== "string" ||
    typeof message.author !== "string" ||
    (message.role !== "user" && message.role !== "assistant")
  ) return null;
  return {
    author: message.author.slice(0, 80),
    id: message.id.slice(0, 120),
    initials: typeof message.initials === "string" ? message.initials.slice(0, 4) : "S",
    role: message.role,
    text: message.text.slice(0, 20000),
    time: typeof message.time === "string" ? message.time : new Date().toISOString(),
  };
}

function appendMessage(roomId, value) {
  const message = normalizeMessage(value);
  if (!message) return null;
  const messages = store.messages[roomId] || (store.messages[roomId] = []);
  if (messages.some((item) => item.id === message.id)) return message;
  messages.push(message);
  if (messages.length > 500) messages.splice(0, messages.length - 500);
  persist();
  return message;
}

function broadcast(roomId, event) {
  const roomConnections = connections.get(roomId);
  if (!roomConnections) return;
  const payload = JSON.stringify(event);
  for (const client of roomConnections) {
    if (client.readyState === 1) client.send(payload);
  }
}

function broadcastPresence(roomId) {
  broadcast(roomId, {
    type: "presence",
    members: connections.get(roomId)?.size || 0,
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "GET" && url.pathname === "/health") {
    return json(response, 200, { service: "room-gateway", status: "ok" });
  }
  if (!authorized(request)) return json(response, 401, { error: "unauthorized" });

  const ticketMatch = url.pathname.match(/^\/v1\/rooms\/([^/]+)\/ticket$/);
  if (request.method === "POST" && ticketMatch) {
    const roomId = ticketMatch[1];
    if (!validRoom(roomId)) return json(response, 400, { error: "invalid room" });
    return json(response, 200, { ticket: signTicket(roomId) });
  }

  const messagesMatch = url.pathname.match(/^\/v1\/rooms\/([^/]+)\/messages$/);
  if (messagesMatch) {
    const roomId = messagesMatch[1];
    if (!validRoom(roomId)) return json(response, 400, { error: "invalid room" });
    if (request.method === "GET") {
      return json(response, 200, { messages: store.messages[roomId] || [] });
    }
    if (request.method === "DELETE") {
      store.messages[roomId] = [];
      persist();
      broadcast(roomId, { type: "room.cleared" });
      return json(response, 200, { messages: [] });
    }
    if (request.method === "POST") {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      try {
        const message = appendMessage(roomId, JSON.parse(Buffer.concat(chunks).toString("utf8")));
        if (!message) return json(response, 400, { error: "invalid message" });
        broadcast(roomId, { type: "room.message", ...message });
        return json(response, 201, message);
      } catch {
        return json(response, 400, { error: "invalid json" });
      }
    }
  }

  return json(response, 404, { error: "not found" });
});

const websocketServer = new WebSocketServer({ noServer: true });
server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname !== "/ws") return socket.destroy();
  const roomId = url.searchParams.get("room");
  const ticket = url.searchParams.get("ticket");
  if (!roomId || !validRoom(roomId) || !verifyTicket(ticket, roomId)) return socket.destroy();

  websocketServer.handleUpgrade(request, socket, head, (client) => {
    websocketServer.emit("connection", client, request, roomId);
  });
});

websocketServer.on("connection", (client, _request, roomId) => {
  if (!connections.has(roomId)) connections.set(roomId, new Set());
  connections.get(roomId).add(client);
  client.send(JSON.stringify({ type: "presence", members: connections.get(roomId).size }));
  client.send(JSON.stringify({ type: "room.history", messages: store.messages[roomId] || [] }));
  broadcastPresence(roomId);

  client.on("message", (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      if (payload.type !== "room.message") return;
      const message = appendMessage(roomId, payload.message);
      if (message) broadcast(roomId, { type: "room.message", ...message });
    } catch {
      client.send(JSON.stringify({ type: "error", message: "invalid room event" }));
    }
  });

  client.on("close", () => {
    connections.get(roomId)?.delete(client);
    broadcastPresence(roomId);
  });
});

server.listen(port, () => {
  console.log(`TEMPLATE OS room gateway listening on :${port}`);
});
