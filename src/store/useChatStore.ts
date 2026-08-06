import { create } from "zustand";
import type { Conversation, Message } from "@/types/chat";
import { DEFAULT_MODEL_ID } from "@/config/models";
import { apiFetch, apiStream, ApiError } from "@/lib/api";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  sidebarCollapsed: boolean;
  loadError: string | null;

  activeConversation: () => Conversation | null;

  loadConversations: () => Promise<void>;
  newConversation: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  setModelForActive: (modelId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopGenerating: () => void;
  regenerateLast: () => Promise<void>;
  editAndResend: (messageId: string, newContent: string) => Promise<void>;
  toggleSidebar: () => void;
}

let activeAbortController: AbortController | null = null;

function patchConversation(
  conversations: Conversation[],
  id: string,
  patch: Partial<Conversation>
): Conversation[] {
  return conversations.map((c) => (c.id === id ? { ...c, ...patch } : c));
}

/** Parses the backend's NDJSON stream, buffering across chunk boundaries so a
 * line split mid-network-packet doesn't get silently dropped. */
function makeLineBuffer(onLine: (parsed: { message?: { content?: string }; done?: boolean }) => void) {
  let buffer = "";
  return (rawChunk: string) => {
    buffer += rawChunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        onLine(JSON.parse(line));
      } catch {
        // partial/malformed line -- safe to ignore
      }
    }
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isGenerating: false,
  sidebarCollapsed: false,
  loadError: null,

  activeConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find((c) => c.id === activeConversationId) ?? null;
  },

  loadConversations: async () => {
    try {
      const data = await apiFetch<{ conversations: Omit<Conversation, "messages">[] }>(
        "/api/conversations"
      );
      set({
        conversations: data.conversations.map((c) => ({ ...c, messages: [] })),
        loadError: null,
      });
    } catch (err) {
      set({ loadError: err instanceof ApiError ? err.message : "Couldn't load your chats." });
    }
  },

  newConversation: async () => {
    try {
      const data = await apiFetch<{ conversation: Conversation }>("/api/conversations", {
        method: "POST",
        body: { modelId: DEFAULT_MODEL_ID },
      });
      const conversation = { ...data.conversation, messages: [] };
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        activeConversationId: conversation.id,
      }));
    } catch (err) {
      set({ loadError: err instanceof ApiError ? err.message : "Couldn't start a new chat." });
    }
  },

  selectConversation: async (id) => {
    set({ activeConversationId: id });
    const existing = get().conversations.find((c) => c.id === id);
    if (existing && existing.messages.length > 0) return; // already loaded

    try {
      const data = await apiFetch<{ conversation: Conversation }>(`/api/conversations/${id}`);
      set((state) => ({
        conversations: patchConversation(state.conversations, id, {
          messages: data.conversation.messages,
        }),
      }));
    } catch (err) {
      set({ loadError: err instanceof ApiError ? err.message : "Couldn't load that chat." });
    }
  },

  setModelForActive: (modelId) => {
    const conv = get().activeConversation();
    if (!conv) return;
    set((state) => ({ conversations: patchConversation(state.conversations, conv.id, { modelId }) }));
    apiFetch(`/api/conversations/${conv.id}`, { method: "PATCH", body: { modelId } }).catch(() => {
      // non-critical -- local UI already reflects the change, worst case
      // it reverts next reload if the request genuinely failed.
    });
  },

  sendMessage: async (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    let conv = get().activeConversation();
    if (!conv) {
      await get().newConversation();
      conv = get().activeConversation();
    }
    if (!conv) return;

    const conversationId = conv.id;
    const wasFirstMessage = conv.messages.length === 0;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      isStreaming: true,
    };

    set((state) => ({
      conversations: patchConversation(state.conversations, conversationId, {
        messages: [...conv!.messages, userMessage, assistantMessage],
        ...(wasFirstMessage ? {} : {}),
      }),
      isGenerating: true,
    }));

    await streamAssistantReply({
      conversationId,
      modelId: conv.modelId,
      body: { conversationId, modelId: conv.modelId, content: trimmed },
      assistantId,
      set,
      get,
    });

    if (wasFirstMessage) {
      // The backend derives the title from this first message -- pull the
      // canonical version rather than re-deriving it client-side.
      apiFetch<{ conversation: Conversation }>(`/api/conversations/${conversationId}`)
        .then((data) => {
          set((state) => ({
            conversations: patchConversation(state.conversations, conversationId, {
              title: data.conversation.title,
            }),
          }));
        })
        .catch(() => {});
    }
  },

  stopGenerating: () => {
    activeAbortController?.abort();
  },

  regenerateLast: async () => {
    const conv = get().activeConversation();
    if (!conv) return;
    const lastAssistant = [...conv.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;

    try {
      await apiFetch(`/api/conversations/${conv.id}/messages/${lastAssistant.id}`, {
        method: "DELETE",
      });
    } catch {
      return;
    }

    const assistantId = crypto.randomUUID();
    const placeholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      isStreaming: true,
    };

    set((state) => ({
      conversations: patchConversation(state.conversations, conv.id, {
        messages: [...conv.messages.filter((m) => m.id !== lastAssistant.id), placeholder],
      }),
      isGenerating: true,
    }));

    await streamAssistantReply({
      conversationId: conv.id,
      modelId: conv.modelId,
      body: { conversationId: conv.id, modelId: conv.modelId, regenerate: true },
      assistantId,
      set,
      get,
    });
  },

  editAndResend: async (messageId, newContent) => {
    const conv = get().activeConversation();
    if (!conv) return;
    const idx = conv.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;

    try {
      await apiFetch(`/api/conversations/${conv.id}/messages/${messageId}`, { method: "DELETE" });
    } catch {
      return;
    }

    set((state) => ({
      conversations: patchConversation(state.conversations, conv.id, {
        messages: conv.messages.slice(0, idx),
      }),
    }));

    await get().sendMessage(newContent);
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

async function streamAssistantReply({
  conversationId,
  body,
  assistantId,
  set,
  get,
}: {
  conversationId: string;
  modelId: string;
  body: unknown;
  assistantId: string;
  set: (partial: Partial<ChatState> | ((s: ChatState) => Partial<ChatState>)) => void;
  get: () => ChatState;
}) {
  const controller = new AbortController();
  activeAbortController = controller;

  let accumulated = "";
  const handleLine = makeLineBuffer((parsed) => {
    if (typeof parsed.message?.content === "string") {
      accumulated += parsed.message.content;
      const conv = get().conversations.find((c) => c.id === conversationId);
      if (!conv) return;
      set((state) => ({
        conversations: patchConversation(state.conversations, conversationId, {
          messages: conv.messages.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          ),
        }),
      }));
    }
  });

  let errorMessage: string | null = null;
  try {
    await apiStream("/api/chat", { body, signal: controller.signal }, handleLine);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // user hit stop -- not an error
    } else {
      errorMessage =
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the chat service. Is the backend running?";
    }
  }

  const conv = get().conversations.find((c) => c.id === conversationId);
  if (conv) {
    set((state) => ({
      conversations: patchConversation(state.conversations, conversationId, {
        messages: conv.messages.map((m) =>
          m.id === assistantId
            ? { ...m, isStreaming: false, error: errorMessage ?? undefined }
            : m
        ),
      }),
    }));
  }

  if (activeAbortController === controller) activeAbortController = null;
  set({ isGenerating: false });
}
