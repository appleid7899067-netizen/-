import type { AgentMessage } from "@/lib/agent-profile";

function getChunkText(chunk: unknown) {
  if (typeof chunk === "string") return chunk;
  if (!chunk || typeof chunk !== "object") return "";
  const value = chunk as Record<string, unknown>;
  if (typeof value.text === "string") return value.text;
  if (typeof value.content === "string") return value.content;
  const delta = value.delta;
  if (delta && typeof delta === "object") {
    const content = (delta as Record<string, unknown>).content;
    if (typeof content === "string") return content;
  }
  return "";
}

export async function streamPuterChat(
  messages: AgentMessage[],
  onText: (text: string) => void,
) {
  if (!window.puter) {
    throw new Error("ไม่พบ Puter SDK ในหน้านี้");
  }

  const response = await window.puter.ai.chat(messages, { stream: true });
  let text = "";

  if (response && typeof response[Symbol.asyncIterator] === "function") {
    for await (const chunk of response) {
      const nextText = getChunkText(chunk);
      if (!nextText) continue;
      text += nextText;
      onText(text);
    }
  } else {
    const nextText = getChunkText(response);
    text = nextText;
    if (text) onText(text);
  }

  if (!text.trim()) {
    throw new Error("Puter ส่งคำตอบว่างกลับมา");
  }

  return text.trim();
}
