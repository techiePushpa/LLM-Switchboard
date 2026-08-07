import type { ModelDefinition } from "@/types/chat";

/**
 * Single source of truth for every model the router can target.
 * Adding a new model/provider later is just adding an entry here --
 * the sidebar, dropdown, and router all read from this list.
 *
 * All three providers below are genuinely free (no card required) and
 * run entirely in the cloud, so nothing needs to be running on your own
 * machine for these to respond. Each `id` here must exactly match an
 * entry in the server's mirrored list at server/src/config/models.ts,
 * which is what actually authorizes and routes the request -- this file
 * only controls what the UI shows.
 */
export const MODELS: ModelDefinition[] = [
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    provider: "groq",
    providerLabel: "Groq",
    tag: "Fast",
    color: "#F55036",
  },
  
  {
    id: "openai/gpt-oss-20b:free",
    label: "GPT-OSS 20B",
    provider: "openrouter",
    providerLabel: "OpenRouter",
    tag: "Free",
    color: "#8B5CF6",
  },
  {
    id: "poolside/laguna-s-2.1:free",
    label: "Laguna S 2.1",
    provider: "openrouter",
    providerLabel: "OpenRouter",
    tag: "Coding",
    color: "#EC4899",
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
    label: "DeepSeek R1 Distill 14B",
    provider: "huggingface",
    providerLabel: "Hugging Face",
    tag: "Reasoning",
    color: "#FFD21E",
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    label: "Qwen2.5 7B",
    provider: "huggingface",
    providerLabel: "Hugging Face",
    tag: "General",
    color: "#7C3AED",
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export function getModel(id: string): ModelDefinition {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
