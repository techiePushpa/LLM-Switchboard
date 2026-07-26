import { useState } from "react";
import { X, LogOut, Monitor, Trash2, Download, Loader2, Check } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { apiFetch } from "@/lib/api";
import { MODELS } from "@/config/models";
import { fieldInputClass, FormField } from "@/components/auth/AuthLayout";
import { cn } from "@/lib/cn";

type Tab = "account" | "preferences" | "data";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("account");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-up">
      <div className="flex h-[560px] w-full max-w-[720px] overflow-hidden rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-[var(--shadow-panel)]">
        {/* Tabs */}
        <div className="w-[180px] shrink-0 border-r border-[var(--border-1)] bg-[var(--surface-2)] p-3">
          <h2 className="mb-3 px-1 text-[13px] font-semibold text-[var(--text-1)]">Settings</h2>
          <nav className="space-y-0.5">
            <TabButton active={tab === "account"} onClick={() => setTab("account")}>
              Account
            </TabButton>
            <TabButton active={tab === "preferences"} onClick={() => setTab("preferences")}>
              Preferences
            </TabButton>
            <TabButton active={tab === "data"} onClick={() => setTab("data")}>
              Data & Privacy
            </TabButton>
          </nav>
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-lg text-[var(--text-3)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>

          {tab === "account" && <AccountTab />}
          {tab === "preferences" && <PreferencesTab />}
          {tab === "data" && <DataTab />}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
        active
          ? "bg-[var(--surface-3)] text-[var(--text-1)] font-medium"
          : "text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
      )}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-[16px] font-semibold text-[var(--text-1)]">{children}</h3>;
}

function AccountTab() {
  const { user, updateProfile, changePassword, logout, logoutAllDevices } = useAuthStore();
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;

  async function handleSaveName() {
    if (!name.trim() || name === user!.name) return;
    setSavingName(true);
    try {
      await updateProfile({ name: name.trim() });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 1500);
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus("saving");
    setPasswordError(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordStatus("saved");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordStatus("idle"), 1500);
    } catch (err) {
      setPasswordStatus("error");
      setPasswordError(err instanceof Error ? err.message : "Couldn't update your password.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Account</SectionTitle>
        <div className="mb-5 flex items-center gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[16px] font-semibold text-[#1a1204]"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-[var(--text-1)]">{user.name}</p>
            <p className="truncate text-[12.5px] text-[var(--text-2)]">{user.email}</p>
          </div>
        </div>

        <FormField label="Display name">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldInputClass}
            />
            <button
              onClick={handleSaveName}
              disabled={savingName || !name.trim() || name === user.name}
              className="shrink-0 rounded-lg bg-[var(--surface-3)] px-3 text-[13px] font-medium text-[var(--text-1)] disabled:opacity-40"
            >
              {savingName ? <Loader2 size={14} className="animate-spin" /> : nameSaved ? <Check size={14} /> : "Save"}
            </button>
          </div>
        </FormField>
      </div>

      <div>
        <h4 className="mb-3 text-[13px] font-medium text-[var(--text-1)]">Change password</h4>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <FormField label="Current password">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={fieldInputClass}
              autoComplete="current-password"
              required
            />
          </FormField>
          <FormField label="New password">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={fieldInputClass}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </FormField>
          {passwordError && <p className="text-[12.5px] text-[var(--color-danger)]">{passwordError}</p>}
          <button
            type="submit"
            disabled={passwordStatus === "saving"}
            className="rounded-lg bg-[var(--surface-3)] px-3 py-2 text-[13px] font-medium text-[var(--text-1)] disabled:opacity-60"
          >
            {passwordStatus === "saving" ? "Updating..." : passwordStatus === "saved" ? "Updated" : "Update password"}
          </button>
          <p className="text-[11.5px] text-[var(--text-3)]">
            Updating your password logs out every other device.
          </p>
        </form>
      </div>

      <div className="border-t border-[var(--border-1)] pt-5">
        <h4 className="mb-3 text-[13px] font-medium text-[var(--text-1)]">Sessions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--surface-3)] px-3 py-2 text-[13px] font-medium text-[var(--text-1)] hover:opacity-90"
          >
            <LogOut size={14} /> Log out
          </button>
          <button
            onClick={() => logoutAllDevices()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
          >
            <Monitor size={14} /> Log out all devices
          </button>
        </div>
      </div>
    </div>
  );
}

function PreferencesTab() {
  const { user, updateProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);
  if (!user) return null;

  async function handlePick(modelId: string) {
    setSaving(true);
    try {
      await updateProfile({ defaultModel: modelId });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SectionTitle>Preferences</SectionTitle>
      <p className="mb-3 text-[12.5px] text-[var(--text-2)]">
        The model every new chat starts with. You can still switch per-conversation from the
        prompt bar.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => handlePick(m.id)}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors",
              user.defaultModel === m.id
                ? "border-[var(--color-signal)]/60 bg-[var(--surface-3)]"
                : "border-[var(--border-1)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
            )}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="min-w-0 flex-1 truncate text-[var(--text-1)]">{m.label}</span>
            {user.defaultModel === m.id && <Check size={14} className="shrink-0 text-[var(--color-signal)]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function DataTab() {
  const { deleteAccount } = useAuthStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await apiFetch("/api/auth/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "chatforge-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleClearHistory() {
    await apiFetch("/api/conversations", { method: "DELETE" });
    setConfirmingClear(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Data & Privacy</SectionTitle>
        <div className="flex items-center justify-between rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] p-3.5">
          <div>
            <p className="text-[13px] font-medium text-[var(--text-1)]">Export your data</p>
            <p className="text-[12px] text-[var(--text-2)]">
              Download your account and every conversation as JSON.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--surface-3)] px-3 py-2 text-[13px] font-medium text-[var(--text-1)]"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-3.5">
        <p className="text-[13px] font-medium text-[var(--color-danger)]">Clear chat history</p>
        <p className="mb-2.5 text-[12px] text-[var(--text-2)]">
          Permanently deletes every conversation. Your account stays active.
        </p>
        {confirmingClear ? (
          <div className="flex gap-2">
            <button
              onClick={handleClearHistory}
              className="rounded-lg bg-[var(--color-danger)] px-3 py-1.5 text-[12.5px] font-medium text-white"
            >
              Yes, delete all chats
            </button>
            <button
              onClick={() => setConfirmingClear(false)}
              className="rounded-lg px-3 py-1.5 text-[12.5px] text-[var(--text-2)] hover:bg-[var(--surface-3)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingClear(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-danger)]/40 px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-danger)]"
          >
            <Trash2 size={13} /> Clear all chats
          </button>
        )}
      </div>

      <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-3.5">
        <p className="text-[13px] font-medium text-[var(--color-danger)]">Delete account</p>
        <p className="mb-2.5 text-[12px] text-[var(--text-2)]">
          Permanently deletes your account, every conversation, and all sessions. This can&apos;t
          be undone.
        </p>
        {confirmingDelete ? (
          <div className="flex gap-2">
            <button
              onClick={() => deleteAccount()}
              className="rounded-lg bg-[var(--color-danger)] px-3 py-1.5 text-[12.5px] font-medium text-white"
            >
              Yes, delete my account
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg px-3 py-1.5 text-[12.5px] text-[var(--text-2)] hover:bg-[var(--surface-3)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-danger)]/40 px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-danger)]"
          >
            <Trash2 size={13} /> Delete account
          </button>
        )}
      </div>
    </div>
  );
}
