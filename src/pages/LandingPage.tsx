import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, MessagesSquare, HardDrive, Zap, Palette, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { AnimatedBackground } from "@/components/landing/AnimatedBackground";
import { GITHUB_URL, NAV_LINKS } from "@/config/site";
import { cn } from "@/lib/cn";

function GithubMark({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 4.94 3.2 9.12 7.65 10.6.56.1.76-.24.76-.54 0-.27-.01-1-.02-1.96-3.11.67-3.77-1.5-3.77-1.5-.51-1.3-1.24-1.65-1.24-1.65-1.02-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.62 1.21 3.26.92.1-.72.39-1.21.71-1.49-2.48-.28-5.1-1.24-5.1-5.53 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.15a10.7 10.7 0 015.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.3-2.63 5.24-5.13 5.52.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.77.54A11.03 11.03 0 0023.02 11.5C23.02 5.24 18.27.5 12 .5z" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: HardDrive,
    title: "Multi-Model Routing",
    description: "Switch between Llama 3, Mistral, Gemma, and Phi-3 -- all running locally through Ollama.",
  },
  {
    icon: MessagesSquare,
    title: "Persistent Chat History",
    description: "Every conversation is saved to your account and picks up right where you left it.",
  },
  {
    icon: Zap,
    title: "Fast, Local Responses",
    description: "Models run on your own machine, so there's no round trip to a cloud API in the way.",
  },
  {
    icon: Palette,
    title: "Dark & Light Theme",
    description: "Switch between beautiful themes anytime -- your preference is remembered.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    description: "Passwords are hashed, sessions are revocable, and your data is yours alone.",
  },
] as const;

export function LandingPage({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-dvh w-full bg-[var(--surface-0)] text-[var(--text-1)]">
      {/* ---------------- Nav ---------------- */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--border-1)] bg-[var(--surface-0)]/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#home" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-[15px] font-semibold tracking-tight">ChatForge</span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13.5px] text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
              aria-label="View source on GitHub"
            >
              <GithubMark size={17} />
            </a>
            <button
              onClick={onLogin}
              className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-[var(--text-1)] transition-colors hover:bg-[var(--surface-3)]"
            >
              Log in
            </button>
            <button
              onClick={onSignup}
              className="rounded-lg bg-[var(--text-1)] px-3.5 py-2 text-[13.5px] font-medium text-[var(--surface-0)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Sign up
            </button>
          </div>

          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-1)] md:hidden"
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileNavOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border-1)] bg-[var(--surface-0)] md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-[14px] text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-[14px] text-[var(--text-2)] hover:bg-[var(--surface-3)]"
              >
                <GithubMark size={16} /> GitHub
              </a>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={onLogin}
                  className="flex-1 rounded-lg border border-[var(--border-2)] px-3.5 py-2.5 text-[14px] font-medium"
                >
                  Log in
                </button>
                <button
                  onClick={onSignup}
                  className="flex-1 rounded-lg bg-[var(--text-1)] px-3.5 py-2.5 text-[14px] font-medium text-[var(--surface-0)]"
                >
                  Sign up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* ---------------- Hero ---------------- */}
      <section id="home" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 pt-16">
        <AnimatedBackground />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center"
        >
          <div className="animate-float">
            <Logo size={56} className="animate-glow-pulse" />
          </div>

          <h1 className="mt-8 text-[clamp(28px,5.5vw,52px)] font-medium leading-[1.1] tracking-tight">
            One Intelligent Platform.
            <br />
            Multiple AI Models.
          </h1>

          <p className="mt-5 max-w-lg text-[15.5px] text-[var(--text-2)]">
            Experience AI conversations through a beautiful interface, routed to whichever local
            model fits the moment.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onLogin}
              className="rounded-lg bg-[var(--text-1)] px-6 py-3 text-[14px] font-medium text-[var(--surface-0)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Try Now
            </button>
            <a
              href="#features"
              className="rounded-lg border border-[var(--border-2)] px-6 py-3 text-[14px] font-medium text-[var(--text-1)] transition-colors hover:bg-[var(--surface-2)]"
            >
              Learn More
            </a>
          </div>
        </motion.div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="relative mx-auto max-w-6xl px-5 py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="text-[28px] font-medium tracking-tight">Built for real conversations</h2>
          <p className="mt-2.5 text-[14.5px] text-[var(--text-2)]">
            Everything you'd expect from a modern chat platform, running on models you control.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={cn(
                "rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)]/70 p-6 backdrop-blur-sm",
                "transition-colors hover:border-[var(--border-2)]",
                i === FEATURES.length - 1 && "sm:col-span-2 lg:col-span-1"
              )}
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--color-signal)]">
                <feature.icon size={19} />
              </div>
              <h3 className="mt-4 text-[15px] font-medium">{feature.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-2)]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- About ---------------- */}
      <section id="about" className="relative mx-auto max-w-3xl px-5 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[24px] font-medium tracking-tight">About ChatForge</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--text-2)]">
            ChatForge is a single interface for talking to several local language models without
            juggling separate apps or cloud accounts. Pick a model per conversation, keep every
            chat saved to your account, and switch models mid-project without losing context.
          </p>
        </motion.div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative overflow-hidden border-t border-[var(--border-1)] px-5 py-24">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center"
        >
          <h2 className="text-[28px] font-medium tracking-tight">Ready to start your AI journey?</h2>
          <button
            onClick={onSignup}
            className="mt-7 rounded-lg bg-[var(--text-1)] px-7 py-3 text-[14px] font-medium text-[var(--surface-0)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Get Started
          </button>
        </motion.div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-[var(--border-1)] px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-[14px] font-medium">ChatForge</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--text-2)]">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-1)]">
              GitHub
            </a>
            <a href="#" className="hover:text-[var(--text-1)]">Documentation</a>
            <a href="#" className="hover:text-[var(--text-1)]">Contact</a>
            <a href="#" className="hover:text-[var(--text-1)]">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--text-1)]">Terms of Service</a>
          </div>
        </div>
        <p className="mt-6 text-center text-[12px] text-[var(--text-3)]">
          © {new Date().getFullYear()} ChatForge. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
