import { Logo } from "@/components/common/Logo";
import { Code2, FileText, Lightbulb, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  { icon: Sparkles, label: "Explain how transformers work, simply" },
  { icon: Code2, label: "Write a function to debounce a search input" },
  { icon: FileText, label: "Summarize this article in three bullet points" },
  { icon: Lightbulb, label: "Brainstorm five names for a productivity app" },
];

export function WelcomeScreen({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="signal-glow flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center">
        <Logo size={36} />
        <h1 className="mt-5 text-[26px] font-medium tracking-tight text-[var(--text-1)]">
          Ask anything
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-2)]">
          Pick a local model below and go -- ChatForge routes it through Ollama.
        </p>

        <div className="mt-8 flex w-full flex-col gap-2">
          {SUGGESTIONS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => onPick(label)}
              className="group flex items-center gap-2.5 rounded-full border border-[var(--border-1)] bg-[var(--surface-1)]/70 px-4 py-2.5 text-left text-[13px] text-[var(--text-2)] backdrop-blur-sm transition-colors hover:border-[var(--border-2)] hover:text-[var(--text-1)]"
            >
              <Icon size={14} className="shrink-0 text-[var(--color-signal)]" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
