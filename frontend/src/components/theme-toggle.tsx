"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={cn("h-9 w-9 sm:h-10 sm:w-10", className)}>
        <Sun size={18} className="sm:w-5 sm:h-5" />
      </Button>
    );
  }

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("h-9 w-9 sm:h-10 sm:w-10", className)}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={18} className="sm:w-5 sm:h-5 text-black dark:text-white" />
      ) : (
        <Moon size={18} className="sm:w-5 sm:h-5 text-black dark:text-white" />
      )}
    </Button>
  );
}

