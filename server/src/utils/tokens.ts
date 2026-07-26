import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const ACCESS_SECRET = requireEnv("JWT_ACCESS_SECRET");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy server/.env.example to server/.env and fill it in.`
    );
  }
  return value;
}

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque random strings, not JWTs -- the raw value is
 * only ever handed to the browser (as an httpOnly cookie) and to the
 * user in that moment. The database only ever stores a SHA-256 hash of
 * it, mirroring how we handle passwords: a DB leak alone can't be used
 * to mint a valid session.
 */
export function generateRefreshToken(): {
  raw: string;
  hash: string;
  expiresAt: Date;
} {
  const raw = crypto.randomBytes(48).toString("hex");
  const hash = hashRefreshToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  return { raw, hash, expiresAt };
}

export function hashRefreshToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export const REFRESH_COOKIE_NAME = "cf_refresh";

const isProduction = process.env.NODE_ENV === "production";

export const refreshCookieOptions = {
  httpOnly: true,
  // Cross-site cookies require Secure + SameSite=None (and therefore
  // HTTPS on both ends) once the frontend and backend live on different
  // domains, e.g. a Vercel URL calling a tunneled localhost backend.
  // Locally, both run on http://localhost so "lax" + non-secure works
  // and is the safer default for plain HTTP dev.
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_TTL_MS,
};
