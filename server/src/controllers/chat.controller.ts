import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { PROVIDERS, resolveModel, getApiKey } from "../config/models.js";

// Express's Response and the browser/fetch Response share a name --
// this alias disambiguates the latter for the fetch() calls below.
type FetchResponse = globalThis.Response;

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
 * Emits one NDJSON line in the same shape the frontend has always
 * parsed (originally Ollama's own wire format). Keeping this shape
 * means the frontend's stream parser didn't need to change at all when
 * the backend switched from a local Ollama call to routing across
 * three different cloud providers.
 */
function writeLine(res: Response, content: string, done: boolean) {
  res.write(JSON.stringify({ message: { role: "assistant", content }, done }) + "\n");
}

/**
 * POST /api/chat
 * Routes to whichever provider (Groq / OpenRouter / Hugging Face) the
 * requested model belongs to. All three speak the same OpenAI-compatible
 * Chat Completions format, so one code path handles all of them --
 * only the base URL, API key, and model string change per provider.
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

  const route = resolveModel(modelId);
  if (!route) {
    return res.status(400).json({ error: `"${modelId}" isn't a recognized model.` });
  }
  const apiKey = getApiKey(route.provider);
  if (!apiKey) {
    return res.status(500).json({
      error: `Server is missing an API key for ${route.provider}. Set it in the backend's environment variables.`,
    });
  }

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

  // The provider needs the running history, not just the latest turn,
  // to hold context across messages -- that's why this reads from the
  // DB rather than trusting whatever the client happened to send.
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  // If the client disconnects (stop button, tab closed), stop asking
  // the provider to keep generating tokens nobody will see.
  const upstreamAbort = new AbortController();
  req.on("close", () => upstreamAbort.abort());

  const { baseURL } = PROVIDERS[route.provider];
  let upstreamRes: FetchResponse;
  try {
    upstreamRes = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: modelId, messages: history, stream: true }),
      signal: upstreamAbort.signal,
    });
  } catch (err) {
    console.error(`Fetch to ${route.provider} failed:`, err);
    return res.status(502).json({
      error: `Couldn't reach ${route.provider}. (${err instanceof Error ? err.message : "unknown error"})`,
    });
  }

  if (!upstreamRes.ok || !upstreamRes.body) {
    const text = await upstreamRes.text().catch(() => "");
    return res.status(502).json({
      error: text || `${route.provider} returned ${upstreamRes.status}.`,
    });
  }

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Conversation-Id", conversation.id);

  const reader = upstreamRes.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let lineBuffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? ""; // last entry may be a partial line

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;

        try {
          const parsedLine = JSON.parse(payload);
          const delta: string | undefined = parsedLine?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            full += delta;
            writeLine(res, delta, false);
          }
        } catch {
          // partial/malformed line -- safe to skip, full text is best-effort
        }
      }
    }
  } catch {
    // client disconnected or the provider dropped the connection -- fall
    // through to persisting whatever we accumulated before the error.
  } finally {
    writeLine(res, "", true);

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
