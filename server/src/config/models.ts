export type Provider = "groq" | "openrouter" | "huggingface";

interface ProviderConfig {
  /** Base URL of the provider's OpenAI-compatible endpoint. */
  baseURL: string;
  /** Name of the env var holding that provider's API key. */
  apiKeyEnvVar: string;
}

export const PROVIDERS: Record<Provider, ProviderConfig> = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnvVar: "GROQ_API_KEY",
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    apiKeyEnvVar: "OPENROUTER_API_KEY",
  },
  huggingface: {
    baseURL: "https://router.huggingface.co/v1",
    apiKeyEnvVar: "HF_API_KEY",
  },
};

interface ModelRoute {
  id: string;
  provider: Provider;
}

/**
 * Mirrors the frontend's src/config/models.ts. Kept as a separate list
 * (rather than importing across the frontend/backend boundary) so the
 * backend can validate every incoming request against an explicit
 * allowlist -- a request naming a model that isn't listed here is
 * rejected before it ever reaches an upstream provider or spends a
 * token of quota.
 */
const MODEL_ROUTES: ModelRoute[] = [
  { id: "llama-3.3-70b-versatile", provider: "groq" },
  { id: "deepseek-r1-distill-llama-70b", provider: "groq" },
  { id: "openai/gpt-oss-120b:free", provider: "openrouter" },
  { id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B", provider: "huggingface" },
  { id: "Qwen/Qwen2.5-7B-Instruct", provider: "huggingface" },
];

export function resolveModel(modelId: string): ModelRoute | undefined {
  return MODEL_ROUTES.find((m) => m.id === modelId);
}

export function getApiKey(provider: Provider): string | undefined {
  return process.env[PROVIDERS[provider].apiKeyEnvVar];
}
