import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

// GET /api/conversations
export async function listConversations(req: Request, res: Response) {
  const conversations = await prisma.conversation.findMany({
    where: { userId: req.user!.sub },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, modelId: true, createdAt: true, updatedAt: true },
  });
  return res.json({ conversations });
}

// GET /api/conversations/:id  (with messages)
export async function getConversation(req: Request<{ id: string }>, res: Response) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.user!.sub },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return res.status(404).json({ error: "Conversation not found." });
  return res.json({ conversation });
}

// POST /api/conversations
const createSchema = z.object({
  modelId: z.string().min(1),
  title: z.string().trim().min(1).max(120).optional(),
});

export async function createConversation(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "modelId is required." });

  const conversation = await prisma.conversation.create({
    data: {
      userId: req.user!.sub,
      modelId: parsed.data.modelId,
      title: parsed.data.title ?? "New chat",
    },
  });
  return res.status(201).json({ conversation });
}

// PATCH /api/conversations/:id  (rename / change model)
const updateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  modelId: z.string().min(1).optional(),
});

export async function updateConversation(req: Request<{ id: string }>, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid update." });

  const owned = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.user!.sub },
  });
  if (!owned) return res.status(404).json({ error: "Conversation not found." });

  const conversation = await prisma.conversation.update({
    where: { id: owned.id },
    data: parsed.data,
  });
  return res.json({ conversation });
}

// DELETE /api/conversations/:id
export async function deleteConversation(req: Request<{ id: string }>, res: Response) {
  const owned = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.user!.sub },
  });
  if (!owned) return res.status(404).json({ error: "Conversation not found." });

  await prisma.conversation.delete({ where: { id: owned.id } });
  return res.status(204).send();
}

// DELETE /api/conversations  (clear all history)
export async function deleteAllConversations(req: Request, res: Response) {
  await prisma.conversation.deleteMany({ where: { userId: req.user!.sub } });
  return res.status(204).send();
}

// POST /api/conversations/:id/messages  (append a message)
const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
  modelId: z.string().optional(),
});

export async function addMessage(req: Request<{ id: string }>, res: Response) {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid message." });

  const owned = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.user!.sub },
  });
  if (!owned) return res.status(404).json({ error: "Conversation not found." });

  const message = await prisma.message.create({
    data: { conversationId: owned.id, ...parsed.data },
  });
  await prisma.conversation.update({
    where: { id: owned.id },
    data: { updatedAt: new Date() },
  });

  return res.status(201).json({ message });
}

// DELETE /api/conversations/:id/messages/:messageId
// Deletes that message and every message after it in the conversation --
// used before an edit/regenerate so Ollama isn't fed a stale reply as
// context on the next turn.
export async function deleteMessagesFrom(req: Request<{ id: string; messageId: string }>, res: Response) {
  const owned = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.user!.sub },
  });
  if (!owned) return res.status(404).json({ error: "Conversation not found." });

  const target = await prisma.message.findFirst({
    where: { id: req.params.messageId, conversationId: owned.id },
  });
  if (!target) return res.status(404).json({ error: "Message not found." });

  await prisma.message.deleteMany({
    where: { conversationId: owned.id, createdAt: { gte: target.createdAt } },
  });
  return res.status(204).send();
}
