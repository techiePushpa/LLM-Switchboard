import { cn } from "@/lib/cn";

interface LogoProps {
  size?: number;
  className?: string;
  /** spins continuously -- used for the "thinking" state */
  spinning?: boolean;
}

/**
 * Abstract routing-node mark: a hexagonal signal patched through a
 * center node, echoing the "switchboard" concept behind the model
 * router. Swap the <path> data here for a real brand logo later --
 * every place branding is required (sidebar, welcome, favicon,
 * loading state) reads from this single component.
 */
export function Logo({ size = 28, className, spinning = false }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn(spinning && "animate-spin-slow", className)}
      aria-label="ChatForge logo"
      role="img"
    >
      <path
        d="M16 2 L28.4 9 V23 L16 30 L3.6 23 V9 Z"
        stroke="var(--color-signal)"
        strokeWidth="1.6"
        fill="none"
      />
      <circle cx="16" cy="16" r="4.2" fill="var(--color-signal)" />
      <path
        d="M16 2 V11.8 M28.4 9 L19.6 14 M28.4 23 L19.6 18 M16 30 V20.2 M3.6 23 L12.4 18 M3.6 9 L12.4 14"
        stroke="var(--color-signal)"
        strokeWidth="1.1"
        strokeOpacity="0.55"
      />
    </svg>
  );
}
