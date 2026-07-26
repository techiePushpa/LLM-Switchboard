import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as conversations from "../controllers/conversations.controller.js";

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth);

conversationsRouter.get("/", conversations.listConversations);
conversationsRouter.post("/", conversations.createConversation);
conversationsRouter.delete("/", conversations.deleteAllConversations);
conversationsRouter.get("/:id", conversations.getConversation);
conversationsRouter.patch("/:id", conversations.updateConversation);
conversationsRouter.delete("/:id", conversations.deleteConversation);
conversationsRouter.post("/:id/messages", conversations.addMessage);
conversationsRouter.delete("/:id/messages/:messageId", conversations.deleteMessagesFrom);
