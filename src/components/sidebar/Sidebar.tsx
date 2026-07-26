import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Plus, Settings, MessageSquare } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    sidebarCollapsed,
    toggleSidebar,
    newConversation,
    selectConversation,
  } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-[var(--border-1)] bg-[var(--surface-1)] text-[var(--text-1)]",
        "transition-[width] duration-200",
        sidebarCollapsed ? "w-[68px]" : "w-[264px]"
      )}
    >
      {/* Brand + collapse */}
      <div className="flex items-center justify-between px-3 py-4">
        <div className={cn("flex items-center gap-2 overflow-hidden", sidebarCollapsed && "w-0 opacity-0")}>
          <Logo size={22} />
          <span className="whitespace-nowrap text-[14px] font-medium tracking-tight">
            ChatForge
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* New chat */}
      <div className="px-3">
        <button
          onClick={newConversation}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium",
            "hover:border-[var(--color-signal)]/40 hover:bg-[var(--surface-3)] transition-colors",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <Plus size={16} className="text-[var(--color-signal)]" />
          {!sidebarCollapsed && "New chat"}
        </button>
      </div>

      {/* History */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3">
        {!sidebarCollapsed && conversations.length > 0 && (
          <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-3)]">
            Recent
          </p>
        )}
        <ul className="space-y-0.5">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => selectConversation(c.id)}
                title={c.title}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--text-2)] transition-colors",
                  "hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]",
                  c.id === activeConversationId && "bg-[var(--surface-3)] text-[var(--text-1)]",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <MessageSquare size={15} className="shrink-0 text-[var(--text-3)]" />
                {!sidebarCollapsed && <span className="truncate">{c.title}</span>}
              </button>
            </li>
          ))}
        </ul>
        {!sidebarCollapsed && conversations.length === 0 && (
          <p className="px-2 py-1 text-[13px] text-[var(--text-3)]">
            No chats yet -- start one below.
          </p>
        )}
      </nav>

      {/* Footer: account, settings, theme */}
      <div className="space-y-0.5 border-t border-[var(--border-1)] px-3 py-3">
        <button
          onClick={() => setSettingsOpen(true)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] transition-colors",
            sidebarCollapsed && "justify-center"
          )}
        >
          <Settings size={15} className="text-[var(--text-3)]" />
          {!sidebarCollapsed && "Settings"}
        </button>
        <ThemeToggle collapsed={sidebarCollapsed} />

        {user && (
          <button
            onClick={() => setSettingsOpen(true)}
            className={cn(
              "mt-1.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-3)] transition-colors",
              sidebarCollapsed && "justify-center px-0"
            )}
            title={user.email}
          >
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-[#1a1204]"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            {!sidebarCollapsed && (
              <span className="min-w-0 flex-1 truncate text-left text-[12.5px] text-[var(--text-2)]">
                {user.name}
              </span>
            )}
          </button>
        )}
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </aside>
  );
}
