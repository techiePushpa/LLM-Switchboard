import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";

export function ChatWindow({ onSuggestion }: { onSuggestion: (prompt: string) => void }) {
  const conversation = useChatStore((s) => s.activeConversation());
  const isGenerating = useChatStore((s) => s.isGenerating);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages ?? [];
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const awaitingFirstToken = isGenerating && lastAssistant?.content === "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, messages.at(-1)?.content]);

  if (!conversation || messages.length === 0) {
    return <WelcomeScreen onPick={onSuggestion} />;
  }

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto px-4 sm:px-6">
      <div className="pb-4 pt-6">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} isLast={m.id === lastAssistant?.id} />
        ))}
        {awaitingFirstToken && <ThinkingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
