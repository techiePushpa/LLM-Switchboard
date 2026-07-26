import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as auth from "../controllers/auth.controller.js";

export const authRouter = Router();

// Public
authRouter.post("/register", auth.register);
authRouter.post("/login", auth.login);
authRouter.post("/refresh", auth.refresh);
authRouter.post("/logout", auth.logout);

// Authenticated
authRouter.get("/me", requireAuth, auth.me);
authRouter.patch("/me", requireAuth, auth.updateProfile);
authRouter.delete("/me", requireAuth, auth.deleteAccount);
authRouter.post("/logout-all", requireAuth, auth.logoutAll);
authRouter.post("/change-password", requireAuth, auth.changePassword);
authRouter.get("/export", requireAuth, auth.exportData);
