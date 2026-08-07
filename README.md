# ⚡ ChatForge

### 💬 One Chat. Multiple AI Models. One Smart Interface.

**ChatForge** is a modern multi-LLM chat application that lets users switch between powerful AI models from **Groq, OpenRouter, and Hugging Face** — all from one clean interface.

No local model installation. No Ollama. Just **select a model → ask → get a response.**

---

## ✨ What Makes ChatForge Special?

🎯 **Multi-Model Chat**
Switch between different AI models anytime.

⚡ **Streaming Responses**
See AI responses appear instantly, token by token.

🔐 **Secure Authentication**
JWT authentication with secure refresh-token sessions.

💾 **Persistent Conversations**
Your chats are stored in PostgreSQL and available across sessions.

🎨 **Modern UI**
Clean, responsive interface with dark/light theme support.

🔄 **Regenerate & Edit**
Regenerate responses or edit previous messages and continue the conversation.

⚙️ **Model Preferences**
Choose your preferred default model from Settings.

---

## 🤖 Available AI Models

| Provider            | Models                  | Best For                         |
| ------------------- | ----------------------- | -------------------------------- |
| 🟢 **Groq**         | Llama 3.3 70B           | ⚡ Fast responses & general chat  |
| 🟣 **Hugging Face** | DeepSeek R1 Distill 14B | 🧠 Reasoning & problem solving   |
| 🟣 **Hugging Face** | Qwen2.5 7B              | 💻 Coding & general tasks        |
| 🔵 **OpenRouter**   | GPT-OSS 20B             | 🧠 Reasoning & coding            |
| 🔵 **OpenRouter**   | Laguna S 2.1            | 💬 General-purpose conversations |

### 🔀 How Model Routing Works

```text
                 👤 User
                    │
                    ▼
             💬 ChatForge UI
                    │
                    ▼
             🧠 Model Selection
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
                    │
                    ▼
                💬 User
```

---

## 🛠️ Tech Stack

**Frontend**

* ⚛️ React + TypeScript
* 🎨 Tailwind CSS
* 🎬 Framer Motion

**Backend**

* 🟩 Node.js + Express
* 🔷 TypeScript
* 🔐 JWT + bcrypt

**Database**

* 🐘 PostgreSQL
* 🔺 Prisma ORM

**AI Providers**

* 🟢 Groq
* 🔵 OpenRouter
* 🟣 Hugging Face

---

## 🔐 Security

ChatForge is designed with security in mind:

* 🔑 Short-lived JWT access tokens
* 🍪 Secure HTTP-only refresh cookies
* 🔄 Refresh-token rotation
* 🔒 bcrypt password hashing
* 🛡️ Server-side model allowlist
* ✅ Request validation with Zod
* 🚫 API keys stored in environment variables

---

## 🚀 Quick Start

### 1️⃣ Clone

```bash
git clone <your-repository-url>
cd chatforge
```

### 2️⃣ Backend

```bash
cd server
npm install
cp .env.example .env
```

Add your:

```env
DATABASE_URL="your_postgresql_url"
JWT_ACCESS_SECRET="your_secret"

GROQ_API_KEY="your_key"
OPENROUTER_API_KEY="your_key"
HUGGINGFACE_API_KEY="your_key"
```

Then:

```bash
npx prisma migrate dev
npm run dev
```

### 3️⃣ Frontend

```bash
cd ..
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

🎉 **You're ready to chat!**

---

## 🌐 Deployment

| Part        | Recommended      |
| ----------- | ---------------- |
| 🎨 Frontend | Vercel           |
| ⚙️ Backend  | Render / Railway |
| 🐘 Database | Neon PostgreSQL  |

Because ChatForge uses **cloud AI providers**, your personal computer does **not** need to stay online after deployment.

---

## 📌 Project Structure

```text
ChatForge/
│
├── src/                 # ⚛️ Frontend
│   ├── pages/
│   ├── components/
│   ├── config/
│   ├── store/
│   └── lib/
│
└── server/              # ⚙️ Backend
    ├── prisma/
    └── src/
        ├── config/
        ├── controllers/
        ├── routes/
        ├── middleware/
        └── utils/
```

---

## 💡 The Idea

> **Why use only one AI model when you can choose the right model for the task?**

ChatForge brings multiple AI providers together into **one simple, fast and secure chat experience.**

### ⚡ ChatForge — Choose. Ask. Create.
