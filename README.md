# ⚡ ChatForge

### 💬 One Chat. Multiple AI Models. One Smart Interface.

**ChatForge** is a modern multi-LLM chat application that lets users switch between powerful AI models from **Groq, OpenRouter, and Hugging Face** — all from one clean interface.

## 🌐 Live Demo

### 🚀 [Try ChatForge Live](https://llm-switchboard.vercel.app)

**Select a model → Ask anything → Get an AI response.**

---

## ✨ What Makes ChatForge Special?

🎯 **Multi-Model Chat** — Switch between different AI models anytime.

⚡ **Streaming Responses** — See AI responses appear instantly.

🔐 **Secure Authentication** — JWT authentication with secure sessions.

💾 **Persistent Conversations** — Chats are stored in PostgreSQL.

🎨 **Modern UI** — Clean, responsive interface with dark/light theme support.

🔄 **Regenerate & Edit** — Regenerate responses or edit previous messages.

⚙️ **Model Preferences** — Choose your preferred default model.

---

## 🤖 Available AI Models

| Provider            | Models                  | Best For                        |
| ------------------- | ----------------------- | ------------------------------- |
| 🟢 **Groq**         | Llama 3.3 70B           | ⚡ Fast responses & general chat |
| 🟣 **Hugging Face** | DeepSeek R1 Distill 14B | 🧠 Reasoning & problem solving  |
| 🟣 **Hugging Face** | Qwen2.5 7B              | 💻 Coding & general tasks       |
| 🔵 **OpenRouter**   | GPT-OSS 20B             | 🧠 Reasoning & coding           |
| 🔵 **OpenRouter**   | Laguna S 2.1            | 💬 General conversations        |

---

## 🔀 How It Works

```text
                 👤 User
                    │
                    ▼
              💬 ChatForge
                    │
                    ▼
             🧠 Select Model
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
     Groq       OpenRouter   Hugging Face
       │            │            │
       ▼            ▼            ▼
   Llama 3.3     GPT-OSS 20B   DeepSeek R1
     70B         Laguna S 2.1   Qwen2.5 7B
       │            │            │
       └────────────┼────────────┘
                    ▼
              ⚡ AI Response
```

---

## 🛠️ Tech Stack

**Frontend:** React • TypeScript • Tailwind CSS • Framer Motion

**Backend:** Node.js • Express • TypeScript

**Database:** PostgreSQL • Prisma

**Authentication:** JWT • bcrypt • HTTP-only cookies

**AI Providers:** Groq • OpenRouter • Hugging Face

---

## 🚀 Run Locally

```bash
git clone <your-repository-url>
cd chatforge
```

### Backend

```bash
cd server
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd ..
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## 🌐 Deployment

| Component   | Platform                         |
| ----------- | -------------------------------- |
| 🎨 Frontend | Vercel                           |
| ⚙️ Backend  | Render / Railway                 |
| 🐘 Database | Neon PostgreSQL                  |
| 🤖 AI       | Groq • OpenRouter • Hugging Face |

Cloud-based AI providers mean your personal computer does **not** need to stay online after deployment.

---

## 💡 Why ChatForge?

> **Why use only one AI model when you can choose the right model for the task?**

ChatForge brings multiple AI providers together into **one simple, fast and secure chat experience.**

### ⚡ ChatForge — Choose. Ask. Create.

**🔗 Live:** https://llm-switchboard.vercel.app
