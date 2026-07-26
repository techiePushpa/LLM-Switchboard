import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  onBack,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="signal-glow relative flex h-dvh w-full items-center justify-center bg-[var(--surface-0)] px-4">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-4 top-4 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] sm:left-6 sm:top-6"
        >
          <ArrowLeft size={14} /> Back to home
        </button>
      )}
      <div className="relative z-10 w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={30} />
          <h1 className="mt-5 text-[21px] font-medium tracking-tight text-[var(--text-1)]">
            {title}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-[var(--text-2)]">{subtitle}</p>
        </div>

        <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-1)]/80 p-6 backdrop-blur-sm">
          {children}
        </div>

        <p className="mt-6 text-center text-[13px] text-[var(--text-2)]">{footer}</p>
      </div>
    </div>
  );
}

export function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-2)]">{label}</span>
      {children}
    </label>
  );
}

export const fieldInputClass =
  "w-full rounded-lg border border-[var(--border-1)] bg-[var(--surface-0)] px-3 py-2.5 text-[14px] text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)] focus:border-[var(--color-signal)]/50 transition-colors";

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-[var(--border-1)]" />
      <span className="text-[11.5px] uppercase tracking-wider text-[var(--text-3)]">or</span>
      <span className="h-px flex-1 bg-[var(--border-1)]" />
    </div>
  );
}

/** UI-only for now -- wire up real OAuth once the backend supports it. */
export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => alert("Google sign-in isn't connected yet -- coming soon.")}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--border-1)] bg-[var(--surface-0)] py-2.5 text-[13.5px] font-medium text-[var(--text-1)] transition-colors hover:bg-[var(--surface-2)]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.86c2.26-2.08 3.56-5.14 3.56-8.8z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09C3.26 21.3 7.31 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.3c-.25-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3V6.61H1.28A11.96 11.96 0 000 12c0 1.93.46 3.76 1.28 5.39l3.99-3.09z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.61l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
      {label}
    </button>
  );
}
