ChatForge
A multi-LLM chat interface, routed through free cloud AI providers -- Groq, OpenRouter, and
Hugging Face. Nothing needs to run on your own machine; the whole app works the moment it's
deployed. Design is inspired by Morphic's minimal, centered aesthetic; the routing/switchboard
concept and logo are ChatForge's own.
Status
[x] Feature 1 -- Chat Interface
[x] Feature 2 -- Auth, Settings & Persistence
Register / login (JWT access token + rotating httpOnly refresh cookie)
Settings: Account, Preferences (default model), Data & Privacy (export / clear history / delete account)
Postgres schema for users, sessions, conversations, messages
[x] Feature 3 -- Real chat, wired to Postgres
Every message is persisted; conversation history is loaded from Postgres, not memory
Responses stream token-by-token from whichever provider the selected model belongs to
Stop / regenerate / edit-and-resend all work against the real history
[x] Landing page + entry flow
New visitors see a marketing landing page (nav, hero, features, about, CTA, footer) before login
Dedicated Login/Register pages with animated transitions (framer-motion)
Logged-in users skip straight to the dashboard -- landing/login are never shown to them
[x] Cloud-only model routing (this drop) -- replaced the earlier Ollama-on-your-laptop
setup with three cloud providers, so the deployed site works with zero dependency on any
personal machine being online
[ ] Features 4-15 -- branding polish, tests, more providers
Project layout
```
chatforge/
├─ src/              frontend (Vite + React + TypeScript + Tailwind v4)
│  ├─ pages/          LandingPage.tsx, LoginPage.tsx, RegisterPage.tsx
│  ├─ components/
│  │  ├─ auth/        AuthLayout.tsx -- shared shell for login/register
│  │  ├─ settings/     SettingsModal.tsx -- Account / Preferences / Data tabs
│  │  ├─ sidebar/, chat/, prompt/, common/, landing/
│  ├─ config/models.ts   the model list the UI shows (dropdown, badges, Preferences)
│  ├─ store/          useAuthStore.ts, useChatStore.ts, useThemeStore.ts
│  └─ lib/api.ts       fetch wrapper: attaches the access token, retries once on 401
└─ server/            backend (Express + TypeScript + Prisma + PostgreSQL)
   ├─ prisma/schema.prisma   User, Session, Conversation, Message
   └─ src/
      ├─ config/models.ts     server-side allowlist: which models exist, which provider each
      │                       belongs to, and which env var holds that provider's API key
      ├─ controllers/  auth.controller.ts, chat.controller.ts, conversations.controller.ts
      ├─ routes/       auth.routes.ts, chat.routes.ts, conversations.routes.ts
      ├─ middleware/auth.ts    verifies the access token on protected routes
      └─ utils/        password.ts (bcrypt), tokens.ts (JWT + refresh tokens)
```
How a message actually flows
Frontend calls `POST /api/chat` with `{ conversationId, modelId, content }`.
Backend saves your message to Postgres, then pulls the full conversation history from
the `messages` table (not just your last line) so the model has real context.
Backend looks up `modelId` in `server/src/config/models.ts` to find which provider it
belongs to (Groq / OpenRouter / Hugging Face) and that provider's API key.
Backend calls that provider's OpenAI-compatible `/chat/completions` endpoint with
`stream: true`. All three providers speak this same format, so one code path in
`chat.controller.ts` handles all of them -- only the base URL, key, and model string differ.
As tokens stream in, the backend re-emits them to the browser as NDJSON lines (the same wire
format used before the Ollama-to-cloud switch, so the frontend's stream parser never had to
change).
Once the stream ends (or you hit Stop), the backend saves the full assistant reply to
Postgres as one `messages` row.
Regenerate / edit-and-resend first call `DELETE /api/conversations/:id/messages/:messageId`
(deletes that message and everything after it) so the next request doesn't get confused by a
stale reply still sitting in the conversation history.
The models
Model	Provider	Good for
Llama 3.3 70B	Groq	Fast, general-purpose conversations and coding
DeepSeek R1 Distill 14B	Hugging Face	Step-by-step reasoning, math, logic
Qwen2.5 7B	Hugging Face	General-purpose tasks, coding, and efficient responses
GPT-OSS 20B	OpenRouter	Strong general-purpose reasoning and coding
Laguna S 2.1	OpenRouter	General-purpose chat and alternative model routing
The app uses free-access/cloud API tiers from all three providers. Provider limits and model availability can vary, so
rate limits may apply, so a very active site could eventually hit
them. Provider plans and model availability may change over time.
Adding or removing a model is two edits: `src/config/models.ts` (controls what the UI shows)
and `server/src/config/models.ts` (the server-side allowlist that actually authorizes and
routes the request -- a model missing from this second list gets rejected even if the frontend
sent it).
Getting your three API keys
Groq -- console.groq.com -> API Keys -> Create API Key
OpenRouter -- openrouter.ai -> Keys -> Create Key
Hugging Face -- huggingface.co -> Settings -> Access Tokens -> Create new token (read access is enough)
Put all three in `server/.env` (or your host's environment variables when deployed):
```
GROQ_API_KEY="..."
OPENROUTER_API_KEY="..."
HUGGINGFACE_API_KEY="..."
```
How auth works
Access token: short-lived JWT (15 min), kept only in frontend memory (`src/lib/api.ts`) --
never localStorage, so it can't be read by an injected script.
Refresh token: a random 96-byte string, sent as an httpOnly, Secure cookie your JS can
never read. The database stores only a SHA-256 hash of it in the `sessions` table, so a
database leak alone can't be replayed into a session -- same principle as password hashing.
Every refresh rotates the token (old one deleted, new one issued), so a stolen cookie is
only good for a single reuse before it's invalid.
Logout deletes that one session row. Logout of all devices deletes every session row
for the user. Changing your password also logs out every other device automatically.
Passwords are hashed with bcrypt (12 rounds), never stored or logged in plaintext.
`NODE_ENV=production` switches the login cookie to `Secure` + `SameSite=None`, required once
the frontend and backend live on different domains (e.g. Vercel talking to Render).
Settings panel
Account -- name, email (read-only for now), avatar (initials), change password
Preferences -- default model for new chats (reads from the same list that powers the
chat dropdown)
Data & Privacy -- export all data as JSON, clear all chat history, delete account
(cascades to sessions and conversations in Postgres)
Log out / log out of all devices, both in Account
Running it locally
1. Database (Postgres -- local or Neon):
```bash
cd server
cp .env.example .env
# fill in DATABASE_URL, JWT_ACCESS_SECRET, and the three provider API keys
npm install
npx prisma migrate dev --name init
npm run dev            # http://localhost:4000
```
2. Frontend:
```bash
cd chatforge            # project root
npm install
cp .env.example .env.local
npm run dev              # http://localhost:5173
```
Open `http://localhost:5173` -- you'll land on the landing page, then Register/Login, then the
chat interface. Send a message and it should stream back a real reply immediately -- no local
model server, no tunnel, nothing else to run.
What's stored in Postgres (and what isn't)
Table	Holds	Never holds
`users`	email, bcrypt password hash, display name, avatar color, default model	plaintext password
`sessions`	SHA-256 hash of a refresh token, device/IP metadata, expiry	the raw refresh token itself
`conversations`	title, which model it's pinned to, owner	--
`messages`	role, content, which model answered, timestamps	--
Deleting a user cascades to their sessions and conversations automatically (`onDelete: Cascade`
in `schema.prisma`), which is what powers the "delete account" button in Settings.
Deploying
Frontend -> Vercel (or Netlify) -- static build, set `VITE_API_URL` to your backend's URL
Backend -> Render (or Railway/Fly) -- set `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`CLIENT_ORIGIN`, `NODE_ENV=production`, and the three provider API keys as environment
variables in the host's dashboard
Database -> Neon (or any managed Postgres) -- genuine free tier, no card required
Because every provider here is a cloud API, there's no equivalent of the old "your laptop has
to stay on" requirement -- once deployed, the site works for anyone, anytime, independent of
your own machine.
Security notes
CORS is locked to `CLIENT_ORIGIN` with `credentials: true` (required for the refresh cookie).
All request bodies are validated with `zod` before touching the database.
Login/register return the same generic error either way, so the API never confirms whether an
email is registered.
Every model request is checked against a server-side allowlist (`server/src/config/models.ts`)
before it's forwarded to any provider -- a client can't inject an arbitrary model string to
spend quota on something outside the intended list.
`.env` is gitignored on both the frontend and `server/`.
Troubleshooting
Stuck on the login/register screen, nothing happens:
Did you copy `.env.example` -> `.env` in `server/` and `.env.example` -> `.env.local` in the
project root? The backend refuses to start at all without real `JWT_ACCESS_SECRET`,
`DATABASE_URL`, etc.
Is the backend actually running? Check for `ChatForge API listening on http://localhost:4000`
in its terminal.
Open DevTools -> Network tab, retry, click the failed request, and check its status/response.
`CLIENT_ORIGIN` in `server/.env` must exactly match the URL your frontend is served from
(protocol, host, and port -- no trailing slash).
Sending a message fails with an error naming a provider:
Confirm the matching API key (`GROQ_API_KEY` / `OPENROUTER_API_KEY` / `HUGGINGFACE_API_KEY`)
is actually set in `server/.env` (or your host's environment variables) and hasn't expired.
Free tiers rate-limit -- if you're testing heavily, you may need to wait a minute or switch
models temporarily.
Prisma errors on `migrate`/`generate`:
Confirm Postgres is running and `DATABASE_URL` in `server/.env` matches a database that
actually exists.
