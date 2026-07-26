# LLM-SwitchBoard(ChatForge)

A multi-LLM chat interface, routed through your own local models via **Ollama**. Design is
inspired by Morphic's minimal, centered aesthetic; the routing/switchboard concept and logo are
still ChatForge's own.

## Status

- [x] Feature 1 -- Chat Interface
- [x] Feature 2 -- Auth, Settings & Persistence
  - Register / login (JWT access token + rotating httpOnly refresh cookie)
  - Settings: Account, Preferences (default model), Data & Privacy (export / clear history / delete account)
  - Postgres schema for users, sessions, conversations, messages
- [x] Feature 3 -- Real chat, wired to Ollama + Postgres
  - Every message is persisted; conversation history is loaded from Postgres, not memory
  - Responses stream token-by-token straight from your local Ollama instance
  - Stop / regenerate / edit-and-resend all work against the real history
- [x] **Landing page + entry flow (this drop)**
  - New visitors see a marketing landing page (nav, hero, features, about, CTA, footer) before login
  - Dedicated Login/Register pages with animated transitions (framer-motion)
  - Logged-in users skip straight to the dashboard -- landing/login are never shown to them
  - Login/Register also include: Remember me, Forgot password (UI placeholder), Continue with
    Google (UI only), and on sign-up: Username + Confirm password + Terms checkbox
- [ ] Features 4-15 -- branding polish, tests, deployment

## Project layout

```
chatforge/
├─ src/              frontend (Vite + React + TypeScript + Tailwind v4)
│  ├─ pages/          LoginPage.tsx, RegisterPage.tsx
│  ├─ components/
│  │  ├─ auth/        AuthLayout.tsx -- shared shell for login/register
│  │  ├─ settings/     SettingsModal.tsx -- Account / Preferences / Data tabs
│  │  ├─ sidebar/, chat/, prompt/, common/   (from Feature 1)
│  ├─ store/          useAuthStore.ts, useChatStore.ts, useThemeStore.ts
│  └─ lib/api.ts       fetch wrapper: attaches the access token, retries once on 401
└─ server/            backend (Express + TypeScript + Prisma + PostgreSQL)
   ├─ prisma/schema.prisma   User, Session, Conversation, Message
   └─ src/
      ├─ controllers/  auth.controller.ts, conversations.controller.ts
      ├─ routes/       auth.routes.ts, conversations.routes.ts
      ├─ middleware/auth.ts    verifies the access token on protected routes
      └─ utils/        password.ts (bcrypt), tokens.ts (JWT + refresh tokens)
```

## How a message actually flows now

1. Frontend calls `POST /api/chat` with `{ conversationId, modelId, content }`.
2. Backend saves your message to Postgres, then pulls the **full conversation history**
   from the `messages` table (not just your last line) so Ollama has real context.
3. Backend calls `POST {OLLAMA_BASE_URL}/api/chat` with that history and `stream: true`,
   and pipes Ollama's NDJSON response straight through to the browser as it arrives.
4. Once the stream ends (or you hit Stop), the backend saves the full assistant reply to
   Postgres as one `messages` row.
5. Regenerate / edit-and-resend first call `DELETE /api/conversations/:id/messages/:messageId`
   (deletes that message and everything after it) so the next request to Ollama doesn't get
   confused by a stale reply still sitting in its context.

## How auth works

- **Access token**: short-lived JWT (15 min), kept only in frontend memory (`src/lib/api.ts`) --
  never localStorage, so it can't be read by an injected script.
- **Refresh token**: a random 96-byte string, sent as an **httpOnly, Secure** cookie your JS can
  never read. The database stores only a **SHA-256 hash** of it in the `sessions` table, so a
  database leak alone can't be replayed into a session -- same principle as password hashing.
- Every refresh **rotates** the token (old one deleted, new one issued), so a stolen cookie is
  only good for a single reuse before it's invalid.
- **Logout** deletes that one session row. **Logout of all devices** deletes every session row
  for the user. **Changing your password** also logs out every other device automatically.
- Passwords are hashed with bcrypt (12 rounds), never stored or logged in plaintext.

## Settings panel

- **Account** -- name, email (read-only for now), avatar (initials), change password
- **Preferences** -- default model for new chats (reads from the same `MODELS` list that powers
  the chat dropdown, so adding a model in one place updates both)
- **Data & Privacy** -- export all data as JSON, clear all chat history, delete account
  (cascades to sessions and conversations in Postgres)
- Log out / log out of all devices, both in Account

## Running it locally

### 1. Database (PostgreSQL -- you've already got this installed)

Create a database:

```bash
psql -U postgres -c "CREATE DATABASE chatforge;"
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your local Postgres connection string,
# and generate two random secrets, e.g.  openssl rand -hex 32
npx prisma migrate dev --name init   # creates the tables
npm run dev                          # http://localhost:4000
```

> I wrote and reviewed all of this backend code by hand, but couldn't run
> `prisma migrate` / `prisma generate` myself in this sandbox -- my network here is
> restricted and can't reach `binaries.prisma.sh`. Run the two commands above on your
> machine (with normal internet access + your local Postgres) and it'll generate the
> Prisma client and create the tables. Let me know if either command errors and I'll fix it.

### 3. Ollama (the model provider)

```bash
# install from https://ollama.com if you haven't
ollama pull llama3
ollama pull mistral
ollama pull gemma
ollama pull phi3
ollama serve   # usually already running as a background service on :11434
```

The model registry (`src/config/models.ts`) currently lists exactly these four. Ollama exposes
an OpenAI-compatible endpoint at `http://localhost:11434/v1/chat/completions`, which is what
Feature 3 will call -- same pattern as the cloud providers from Feature 1's research, just
pointed at your machine instead of the internet, and with no API key needed.

### 4. Frontend

```bash
cd chatforge          # project root
npm install
cp .env.example .env.local
npm run dev            # http://localhost:5173
```

Open `http://localhost:5173` -- you'll land on Register/Login before you ever see the chat
interface.

## What's stored in Postgres (and what isn't)

| Table | Holds | Never holds |
|---|---|---|
| `users` | email, bcrypt password hash, display name, avatar color, default model | plaintext password |
| `sessions` | SHA-256 hash of a refresh token, device/IP metadata, expiry | the raw refresh token itself |
| `conversations` | title, which model it's pinned to, owner | -- |
| `messages` | role, content, which model answered, timestamps | -- |

Deleting a user cascades to their sessions and conversations automatically (`onDelete: Cascade`
in `schema.prisma`), which is what powers the "delete account" button in Settings.

## Security notes

- CORS is locked to `CLIENT_ORIGIN` with `credentials: true` (required for the refresh cookie).
- All request bodies are validated with `zod` before touching the database.
- Login/register return the same generic error either way, so the API never confirms whether an
  email is registered.
- `.env` is gitignored on both the frontend and `server/`.

## Known placeholders in the new entry flow

- **`src/config/site.ts` -- `GITHUB_URL`** points at a placeholder repo. Swap in your real one
  (the nav bar and footer both read from this single constant).
- **Username field on sign-up** is validated client-side but not persisted -- the `users` table
  only has name/email/password today. Say the word and I'll add a `username` column + wire it
  through the register endpoint.
- **Forgot password** and **Continue with Google** are UI-only placeholders, exactly as the spec
  asked for -- no backend behind either one yet.

## Troubleshooting

**Stuck on the login/register screen, nothing happens:**
1. Did you copy `.env.example` → `.env` in `server/` *and* `.env.example` → `.env.local` in the
   project root? The backend refuses to start at all without real `JWT_ACCESS_SECRET`,
   `DATABASE_URL`, etc.
2. Is `npm run dev` actually running inside `server/`, in its own terminal? Check for
   `ChatForge API listening on http://localhost:4000` in that terminal.
3. Open DevTools → Network tab, retry, click the failed request, and check its status/response --
   that tells you exactly which layer failed (network / CORS / validation / database).
4. `CLIENT_ORIGIN` in `server/.env` must exactly match the URL Vite printed (port and all).

**Register/login works, but sending a message fails ("Couldn't reach Ollama..."):**
- Run `ollama serve` (or confirm it's running as a background service) and `ollama list` to
  confirm `llama3` / `mistral` / `gemma` / `phi3` are actually pulled.
- `OLLAMA_BASE_URL` in `server/.env` should be `http://localhost:11434` unless you've changed it.

**Prisma errors on `migrate`/`generate`:**
- Confirm Postgres is running and `DATABASE_URL` in `server/.env` matches a database that
  actually exists (`psql -U postgres -c "CREATE DATABASE chatforge;"` if not).
