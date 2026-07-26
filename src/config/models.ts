import type { ModelDefinition } from "@/types/chat";

/**
 * Single source of truth for every model the router can target.
 * Adding a new model/provider later is just adding an entry here --
 * the sidebar, dropdown, and router all read from this list.
 *
 * Running on Ollama (https://ollama.com) locally -- these are the models
 * pulled with `ollama pull <name>`. Swap or extend this list to match
 * whatever you actually have pulled; the router calls Ollama's
 * OpenAI-compatible endpoint at http://localhost:11434/v1/chat/completions
 * with `model` set to the id below.
 */
export const MODELS: ModelDefinition[] = [
  {
    id: "llama3",
    label: "Llama 3",
    provider: "ollama",
    providerLabel: "Ollama · local",
    tag: "8B",
    color: "#4C8DF6",
  },
  {
    id: "mistral",
    label: "Mistral",
    provider: "ollama",
    providerLabel: "Ollama · local",
    tag: "7B",
    color: "#FF7000",
  },
  {
    id: "gemma",
    label: "Gemma",
    provider: "ollama",
    providerLabel: "Ollama · local",
    tag: "7B",
    color: "#34A853",
  },
  {
    id: "phi3",
    label: "Phi-3",
    provider: "ollama",
    providerLabel: "Ollama · local",
    tag: "3.8B",
    color: "#8B5CF6",
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export function getModel(id: string): ModelDefinition {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
