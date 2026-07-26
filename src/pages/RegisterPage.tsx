import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout, FormField, fieldInputClass, AuthDivider, GoogleButton } from "@/components/auth/AuthLayout";
import { useAuthStore } from "@/store/useAuthStore";

export function RegisterPage({
  onSwitchToLogin,
  onBack,
}: {
  onSwitchToLogin: () => void;
  onBack?: () => void;
}) {
  const { register, error, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const usernameInvalid =
    username.length > 0 && !/^[a-zA-Z0-9_]{3,20}$/.test(username);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (passwordTooShort || passwordsMismatch || usernameInvalid) return;
    if (!agreedToTerms) {
      setFormError("Please agree to the Terms & Conditions to continue.");
      return;
    }

    setSubmitting(true);
    try {
      // Note: `username` is validated here for a good sign-up experience,
      // but the account schema only stores name/email/password today --
      // it isn't persisted yet. Say the word and I'll add a `username`
      // column + wire it through if you want it kept.
      await register(name, email, password);
    } catch {
      // error is surfaced from the store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="One login, every local model you route through ChatForge."
      onBack={onBack}
      footer={
        <>
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-[var(--color-signal)] hover:underline"
          >
            Log in
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full name">
          <input
            required
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError();
            }}
            className={fieldInputClass}
            placeholder="Ada Lovelace"
          />
        </FormField>

        <FormField label="Username">
          <input
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={fieldInputClass}
            placeholder="ada_lovelace"
          />
          {usernameInvalid && (
            <span className="mt-1 block text-[12px] text-[var(--color-danger)]">
              3-20 characters: letters, numbers, and underscores only.
            </span>
          )}
        </FormField>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              className={`${fieldInputClass} pr-10`}
              placeholder="At least 8 characters"
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
          {passwordTooShort && (
            <span className="mt-1 block text-[12px] text-[var(--color-danger)]">
              Use at least 8 characters.
            </span>
          )}
        </FormField>

        <FormField label="Confirm password">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldInputClass}
            placeholder="Re-enter your password"
          />
          {passwordsMismatch && (
            <span className="mt-1 block text-[12px] text-[var(--color-danger)]">
              Passwords don&apos;t match.
            </span>
          )}
        </FormField>

        <label className="flex items-start gap-2 text-[12.5px] text-[var(--text-2)]">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              setFormError(null);
            }}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[var(--border-2)] accent-[var(--color-signal)]"
          />
          <span>
            I agree to the{" "}
            <a href="#" className="text-[var(--text-1)] underline underline-offset-2">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a href="#" className="text-[var(--text-1)] underline underline-offset-2">
              Privacy Policy
            </a>
            .
          </span>
        </label>

        {(formError || error) && (
          <p className="text-[12.5px] text-[var(--color-danger)]">{formError ?? error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--text-1)] py-2.5 text-[14px] font-medium text-[var(--surface-0)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          Create account
        </button>
      </form>

      <AuthDivider />
      <GoogleButton />
    </AuthLayout>
  );
}
