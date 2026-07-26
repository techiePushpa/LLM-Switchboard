import { useEffect, useState } from "react";
import { Logo } from "@/components/common/Logo";

const STATUS_WORDS = [
  "Thinking",
  "Searching",
  "Analyzing",
  "Understanding",
  "Reasoning",
  "Fathoming",
  "Generating",
  "Preparing response",
  "Finalizing",
];

/**
 * Shown in place of a normal spinner while a response is being generated.
 * Stops the moment the caller unmounts it (i.e. the moment content starts
 * arriving), per the "stop immediately when the response arrives" spec.
 */
export function ThinkingIndicator() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % STATUS_WORDS.length);
    }, 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 py-1.5 animate-fade-up">
      <Logo size={22} spinning />
      <span className="text-[13px] text-[var(--text-2)]">
        {STATUS_WORDS[wordIndex]}
        <span className="animate-pulse-dot">...</span>
      </span>
    </div>
  );
}
