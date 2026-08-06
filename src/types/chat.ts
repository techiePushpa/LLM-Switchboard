export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: Role;
  content: string;
  modelId?: string;
  createdAt: number;
  /** true while the assistant response is still streaming in */
  isStreaming?: boolean;
  /** set if the request failed, lets the UI offer a retry */
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelId: string;
  messages: Message[];
}

export type ProviderId =
  | "groq"
  | "openrouter"
  | "huggingface"
  | "ollama"
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "meta"
  | "deepseek"
  | "qwen";

export interface ModelDefinition {
  id: string;
  label: string;
  provider: ProviderId;
  providerLabel: string;
  /** short badge shown in the dropdown, e.g. "Fast", "Free", "Reasoning" */
  tag?: string;
  /** brand color for the provider's signal dot */
  color: string;
  contextWindow?: string;
}
