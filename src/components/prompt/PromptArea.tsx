import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { ModelDropdown } from "@/components/prompt/ModelDropdown";
import { DEFAULT_MODEL_ID } from "@/config/models";

export function PromptArea({ prefill }: { prefill?: string }) {
  const [value, setValue] = useState(prefill ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, stopGenerating, isGenerating, activeConversation, setModelForActive } =
    useChatStore();

  const modelId = activeConversation()?.modelId ?? DEFAULT_MODEL_ID;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleSend() {
    if (!value.trim() || isGenerating) return;
    sendMessage(value);
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-[var(--border-1)] bg-[var(--surface-0)] px-4 pb-4 pt-3 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-[var(--border-2)] bg-[var(--surface-1)] p-2.5 shadow-[var(--shadow-panel)] focus-within:border-[var(--color-signal)]/60 transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message ChatForge..."
            className="max-h-[200px] w-full resize-none bg-transparent px-1.5 py-1 text-[14.5px] text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none"
          />
          <div className="mt-1 flex items-center justify-between px-0.5">
            <ModelDropdown modelId={modelId} onChange={setModelForActive} />

            {isGenerating ? (
              <button
                onClick={stopGenerating}
                className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-3)] text-[var(--text-1)] hover:opacity-90"
                aria-label="Stop generating"
                title="Stop generating"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!value.trim()}
                className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-signal)] text-[#1a1204] transition-opacity disabled:opacity-30"
                aria-label="Send message"
                title="Send (Enter)"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-[var(--text-3)]">
          ChatForge routes every message to the model you pick -- responses may be inaccurate.
        </p>
      </div>
    </div>
  );
}
