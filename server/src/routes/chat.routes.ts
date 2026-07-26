import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendChat } from "../controllers/chat.controller.js";

export const chatRouter = Router();
chatRouter.use(requireAuth);
chatRouter.post("/", sendChat);
