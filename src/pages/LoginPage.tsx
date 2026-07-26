import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout, FormField, fieldInputClass, AuthDivider, GoogleButton } from "@/components/auth/AuthLayout";
import { useAuthStore } from "@/store/useAuthStore";

export function LoginPage({
  onSwitchToRegister,
  onBack,
}: {
  onSwitchToRegister: () => void;
  onBack?: () => void;
}) {
  const { login, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [forgotNotice, setForgotNotice] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // "Remember me" reflects the existing 30-day refresh session either
      // way; unchecking it is a signal for a future "sign out when the
      // browser closes" mode rather than a different auth call today.
      await login(email, password);
    } catch {
      // error is surfaced from the store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      onBack={onBack}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="font-medium text-[var(--color-signal)] hover:underline"
          >
            Create one
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
            className={fieldInputClass}
            placeholder="you@example.com"
          />
        </FormField>

        <FormField label="Password">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              className={`${fieldInputClass} pr-10`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-1)]"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[12.5px] text-[var(--text-2)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[var(--border-2)] accent-[var(--color-signal)]"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => setForgotNotice(true)}
            className="text-[12.5px] font-medium text-[var(--text-2)] hover:text-[var(--text-1)] hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {forgotNotice && (
          <p className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-[12px] text-[var(--text-2)]">
            Password reset isn&apos;t set up yet -- for now, ask an admin to reset it directly in
            the database.
          </p>
        )}

        {error && <p className="text-[12.5px] text-[var(--color-danger)]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--text-1)] py-2.5 text-[14px] font-medium text-[var(--surface-0)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          Log in
        </button>
      </form>

      <AuthDivider />
      <GoogleButton />
    </AuthLayout>
  );
}
