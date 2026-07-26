import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";
import { cn } from "@/lib/cn";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-2)] transition-colors",
        "hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]",
        collapsed && "justify-center"
      )}
      aria-label="Toggle dark and light mode"
    >
      <span className="relative grid h-4 w-4 shrink-0 place-items-center text-[var(--text-3)]">
        <Sun
          size={15}
          className={cn(
            "absolute transition-all duration-200",
            isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
        />
        <Moon
          size={15}
          className={cn(
            "absolute transition-all duration-200",
            isDark ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
        />
      </span>
      {!collapsed && <span>{isDark ? "Dark mode" : "Light mode"}</span>}
    </button>
  );
}
