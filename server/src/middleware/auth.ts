import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens.js";

/**
 * Reads "Authorization: Bearer <token>", not a cookie -- the access
 * token lives only in frontend memory (see the client's authStore), so
 * it never needs to be sent as a cookie and is naturally immune to CSRF.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please refresh or log in again." });
  }
}
