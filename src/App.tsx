import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { PromptArea } from "@/components/prompt/PromptArea";
import { Logo } from "@/components/common/Logo";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/cn";

type EntryView = "landing" | "login" | "register";

function App() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ text: string; key: number } | undefined>();
  const [entryView, setEntryView] = useState<EntryView>("landing");

  const newConversation = useChatStore((s) => s.newConversation);

  const authStatus = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const selectConversation = useChatStore((s) => s.selectConversation);

  // On first load there's no access token yet (it only ever lives in
  // memory) -- ask the API to mint one from the httpOnly refresh cookie.
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Once logged in, pull real chat history from Postgres. If there's
  // nothing yet, start one conversation so the interface isn't inert.
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    loadConversations().then(() => {
      const { conversations } = useChatStore.getState();
      if (conversations.length === 0) {
        newConversation();
      } else {
        selectConversation(conversations[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  function handleSuggestion(text: string) {
    setPrefill({ text, key: Date.now() });
  }

  if (authStatus === "checking") {
    return (
      <div className="signal-glow flex h-dvh w-full items-center justify-center bg-[var(--surface-0)]">
        <Logo size={32} spinning />
      </div>
    );
  }

  // Logged-out visitors get the marketing entry flow: landing -> login/signup.
  // A logged-in user never sees any of this -- they land straight in the
  // dashboard below, satisfying "Try Now opens the dashboard if already
  // logged in" without ever routing back through the landing page first.
  if (authStatus === "unauthenticated") {
    return (
      <AnimatePresence mode="wait">
        {entryView === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LandingPage
              onLogin={() => setEntryView("login")}
              onSignup={() => setEntryView("register")}
            />
          </motion.div>
        )}
        {entryView === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <LoginPage
              onSwitchToRegister={() => setEntryView("register")}
              onBack={() => setEntryView("landing")}
            />
          </motion.div>
        )}
        {entryView === "register" && (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <RegisterPage
              onSwitchToLogin={() => setEntryView("login")}
              onBack={() => setEntryView("landing")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-dvh w-full overflow-hidden bg-[var(--surface-0)]"
    >
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[264px]">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b border-[var(--border-1)] px-3 py-2.5 md:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-3)]"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <Logo size={20} />
          <span className="text-[14px] font-semibold text-[var(--text-1)]">ChatForge</span>
        </div>

        <div className={cn("min-h-0 flex-1")}>
          <ChatWindow onSuggestion={handleSuggestion} />
        </div>

        <PromptArea prefill={prefill?.text} key={prefill?.key ?? "static"} />
      </div>
    </motion.div>
  );
}

export default App;
