import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, HardDrive } from "lucide-react";
import { MODELS, getModel } from "@/config/models";
import { cn } from "@/lib/cn";

export function ModelDropdown({
  modelId,
  onChange,
}: {
  modelId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = getModel(modelId);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-[var(--border-1)] bg-[var(--surface-0)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-1)] hover:border-[var(--border-2)] transition-colors"
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: active.color }}
        />
        {active.label}
        <ChevronDown size={13} className={cn("text-[var(--text-3)] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-2 w-64 overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-panel)] animate-fade-up">
          <div className="flex items-center gap-1.5 border-b border-[var(--border-1)] px-3 py-2">
            <HardDrive size={11} className="text-[var(--text-3)]" />
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-3)]">
              Running on Ollama
            </p>
          </div>
          <ul className="py-1">
            {MODELS.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--surface-3)]"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-1)]">
                    {m.label}
                  </span>
                  {m.tag && (
                    <span className="shrink-0 rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] text-[var(--text-2)]">
                      {m.tag}
                    </span>
                  )}
                  {m.id === modelId && <Check size={13} className="shrink-0 text-[var(--color-signal)]" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
