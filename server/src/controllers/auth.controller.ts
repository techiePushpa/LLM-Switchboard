import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "../utils/tokens.js";

const AVATAR_COLORS = ["#e3a438", "#7c8cff", "#5cb88a", "#e5645a", "#4c8df6", "#8b5cf6"];

function publicUser(user: { id: string; email: string; name: string; avatarColor: string; defaultModel: string }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarColor: user.avatarColor,
    defaultModel: user.defaultModel,
  };
}

async function issueSession(res: Response, userId: string, email: string, req: Request) {
  const accessToken = signAccessToken({ sub: userId, email });
  const { raw, hash, expiresAt } = generateRefreshToken();

  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hash,
      userAgent: req.headers["user-agent"] ?? undefined,
      ipAddress: req.ip,
      expiresAt,
    },
  });

  res.cookie(REFRESH_COOKIE_NAME, raw, refreshCookieOptions);
  return accessToken;
}

// ---------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------
const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await hashPassword(password);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const user = await prisma.user.create({
    data: { name, email, passwordHash, avatarColor },
  });

  const accessToken = await issueSession(res, user.id, user.email, req);
  return res.status(201).json({ accessToken, user: publicUser(user) });
}

// ---------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter a valid email and password." });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    // Same message either way -- don't leak whether the email exists.
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const accessToken = await issueSession(res, user.id, user.email, req);
  return res.json({ accessToken, user: publicUser(user) });
}

// ---------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------
export async function refresh(req: Request, res: Response) {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!raw) return res.status(401).json({ error: "No session." });

  const hash = hashRefreshToken(raw);
  const session = await prisma.session.findUnique({ where: { refreshTokenHash: hash } });

  if (!session || session.expiresAt < new Date()) {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  // Rotate: delete the used token and issue a fresh one, so a stolen
  // refresh cookie can only ever be replayed once before it's invalid.
  await prisma.session.delete({ where: { id: session.id } });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return res.status(401).json({ error: "Account no longer exists." });

  const accessToken = await issueSession(res, user.id, user.email, req);
  return res.json({ accessToken, user: publicUser(user) });
}

// ---------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------
export async function logout(req: Request, res: Response) {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME];
  if (raw) {
    await prisma.session.deleteMany({ where: { refreshTokenHash: hashRefreshToken(raw) } });
  }
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  return res.status(204).send();
}

// ---------------------------------------------------------------------
// POST /api/auth/logout-all  (revoke every device)
// ---------------------------------------------------------------------
export async function logoutAll(req: Request, res: Response) {
  await prisma.session.deleteMany({ where: { userId: req.user!.sub } });
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  return res.status(204).send();
}

// ---------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------
export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) return res.status(404).json({ error: "Account not found." });
  return res.json({ user: publicUser(user) });
}

// ---------------------------------------------------------------------
// PATCH /api/auth/me  (update name / default model)
// ---------------------------------------------------------------------
const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  defaultModel: z.string().trim().min(1).optional(),
});

export async function updateProfile(req: Request, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid update." });

  const user = await prisma.user.update({
    where: { id: req.user!.sub },
    data: parsed.data,
  });
  return res.json({ user: publicUser(user) });
}

// ---------------------------------------------------------------------
// POST /api/auth/change-password
// ---------------------------------------------------------------------
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function changePassword(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) return res.status(404).json({ error: "Account not found." });

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect." });

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Changing your password invalidates every other logged-in device.
  await prisma.session.deleteMany({ where: { userId: user.id } });
  const accessToken = await issueSession(res, user.id, user.email, req);

  return res.json({ accessToken });
}

// ---------------------------------------------------------------------
// DELETE /api/auth/me  (delete account -- cascades to sessions/chats)
// ---------------------------------------------------------------------
export async function deleteAccount(req: Request, res: Response) {
  await prisma.user.delete({ where: { id: req.user!.sub } });
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  return res.status(204).send();
}

// ---------------------------------------------------------------------
// GET /api/auth/export  (data export for the Settings > Data tab)
// ---------------------------------------------------------------------
export async function exportData(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    include: { conversations: { include: { messages: true } } },
  });
  if (!user) return res.status(404).json({ error: "Account not found." });

  const { passwordHash: _passwordHash, ...safeUser } = user;
  res.setHeader("Content-Disposition", "attachment; filename=chatforge-data.json");
  return res.json(safeUser);
}
