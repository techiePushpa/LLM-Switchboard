import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

const chatSchema = z.object({
  conversationId: z.string().uuid(),
  modelId: z.string().min(1),
  content: z.string().min(1).optional(), // omitted when regenerate is true
  regenerate: z.boolean().optional(),
});

function deriveTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/\s+/g, " ");
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed || "New chat";
}

/**
 * POST /api/chat
 * Streams NDJSON lines straight through from Ollama's /api/chat endpoint
 * (each line: {"message":{"role":"assistant","content":"..."},"done":false}),
 * so the frontend can parse them the same way Ollama itself emits them.
 * Persists the user message up front and the full assistant reply once
 * the stream ends (or the client disconnects early).
 */
export async function sendChat(req: Request, res: Response) {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "conversationId and modelId are required." });
  }
  const { conversationId, modelId, content, regenerate } = parsed.data;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: req.user!.sub },
  });
  if (!conversation) return res.status(404).json({ error: "Conversation not found." });

  if (!regenerate) {
    if (!content) return res.status(400).json({ error: "content is required." });

    const isFirstMessage = (await prisma.message.count({ where: { conversationId } })) === 0;
    await prisma.message.create({ data: { conversationId, role: "user", content } });

    if (isFirstMessage) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title: deriveTitle(content) },
      });
    }
  }

  // Ollama needs the running history, not just the latest turn, to hold
  // context across messages -- that's why this reads from the DB rather
  // than trusting whatever the client happened to send.
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  // If the client disconnects (stop button, tab closed), stop asking
  // Ollama to keep generating tokens nobody will see.
  const ollamaAbort = new AbortController();
  req.on("close", () => ollamaAbort.abort());

  let ollamaRes: Response2;
  try {
    ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelId, messages: history, stream: true }),
      signal: ollamaAbort.signal,
    });
  } catch {
    return res.status(502).json({
      error: `Couldn't reach Ollama at ${OLLAMA_BASE_URL}. Is "ollama serve" running?`,
    });
  }

  if (!ollamaRes.ok || !ollamaRes.body) {
    const text = await ollamaRes.text().catch(() => "");
    return res.status(502).json({
      error: text || `Ollama returned ${ollamaRes.status}. Have you run "ollama pull ${modelId}"?`,
    });
  }

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Conversation-Id", conversation.id);

  const reader = ollamaRes.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let lineBuffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);

      lineBuffer += chunk;
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? ""; // last entry may be a partial line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsedLine = JSON.parse(line);
          if (typeof parsedLine?.message?.content === "string") {
            full += parsedLine.message.content;
          }
        } catch {
          // partial/malformed line -- safe to skip, full text is best-effort
        }
      }
    }
  } catch {
    // client disconnected or Ollama dropped the connection -- fall through
    // to persisting whatever we accumulated before the error.
  } finally {
    if (full.trim()) {
      await prisma.message.create({
        data: { conversationId, role: "assistant", content: full, modelId },
      });
    }
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    if (!res.writableEnded) res.end();
  }
}

// Minimal structural type so this file doesn't need to import an HTTP
// client's Response type just to declare the variable above.
type Response2 = globalThis.Response;
