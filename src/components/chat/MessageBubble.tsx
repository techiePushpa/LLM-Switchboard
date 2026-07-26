import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Pencil, RotateCcw, User } from "lucide-react";
import type { Message } from "@/types/chat";
import { Logo } from "@/components/common/Logo";
import { getModel } from "@/config/models";
import { useChatStore } from "@/store/useChatStore";
import { cn } from "@/lib/cn";

export function MessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const { editAndResend, regenerateLast } = useChatStore();

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleEditSubmit() {
    if (draft.trim() && draft.trim() !== message.content) {
      editAndResend(message.id, draft.trim());
    }
    setEditing(false);
  }

  return (
    <div className={cn("group flex gap-3 py-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--border-1)]">
          <Logo size={16} />
        </div>
      )}

      <div className={cn("flex max-w-[min(680px,85%)] flex-col", isUser && "items-end")}>
        {!isUser && message.modelId && (
          <span className="mb-1 px-0.5 text-[11px] font-medium text-[var(--text-3)]">
            {getModel(message.modelId).label}
          </span>
        )}

        {editing ? (
          <div className="w-full min-w-[280px]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--color-signal)]/50 bg-[var(--surface-2)] p-3 text-[14px] text-[var(--text-1)] outline-none"
              autoFocus
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-3 py-1.5 text-[12.5px] text-[var(--text-2)] hover:bg-[var(--surface-3)]"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="rounded-lg bg-[var(--color-signal)] px-3 py-1.5 text-[12.5px] font-medium text-[#1a1204] hover:opacity-90"
              >
                Save & submit
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed",
              isUser
                ? "bg-[var(--color-signal)] text-[#1a1204]"
                : "bg-[var(--surface-2)] text-[var(--text-1)] ring-1 ring-[var(--border-1)]"
            )}
          >
            {message.content ? (
              <MarkdownContent content={message.content} isUser={isUser} />
            ) : (
              <span className="text-[var(--text-3)]">&nbsp;</span>
            )}
          </div>
        )}

        {message.error && (
          <p className="mt-1 text-[12px] text-[var(--color-danger)]">{message.error}</p>
        )}

        {/* Actions */}
        {!editing && message.content && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
              isUser && "flex-row-reverse"
            )}
          >
            <button
              onClick={handleCopy}
              title="Copy"
              className="rounded-md p-1.5 text-[var(--text-3)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            {isUser && (
              <button
                onClick={() => setEditing(true)}
                title="Edit"
                className="rounded-md p-1.5 text-[var(--text-3)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
              >
                <Pencil size={13} />
              </button>
            )}
            {!isUser && isLast && (
              <button
                onClick={regenerateLast}
                title="Regenerate"
                className="rounded-md p-1.5 text-[var(--text-3)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--border-1)]">
          <User size={14} className="text-[var(--text-2)]" />
        </div>
      )}
    </div>
  );
}

function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  return (
    <div
      className={cn(
        "prose-chat max-w-none",
        isUser && "prose-chat-user"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children, className } = props;
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code className="rounded bg-black/20 px-1.5 py-0.5 text-[0.9em]">
                  {children}
                </code>
              );
            }

            return (
              <div className="my-2 overflow-hidden rounded-lg ring-1 ring-[var(--border-1)]">
                <div className="flex items-center justify-between bg-[#0a0c10] px-3 py-1.5 text-[11px] text-[var(--text-3)]">
                  <span>{match?.[1] ?? "text"}</span>
                  <CopyCodeButton code={String(children)} />
                </div>
                <SyntaxHighlighter
                  language={match?.[1]}
                  style={oneDark}
                  customStyle={{ margin: 0, fontSize: "12.5px", padding: "12px 14px" }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="flex items-center gap-1 hover:text-[var(--text-1)]"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
