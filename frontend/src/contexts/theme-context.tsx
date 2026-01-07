"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type AccessibilityMode = {
  enabled: boolean;
  highContrast: boolean;
  largeText: boolean;
};

interface ThemeContextType {
  theme: Theme;
  accessibility: AccessibilityMode;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAccessibility: (mode: AccessibilityMode) => void;
  toggleAccessibility: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [accessibility, setAccessibilityState] = React.useState<AccessibilityMode>({
    enabled: false,
    highContrast: false,
    largeText: false,
  });

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      const savedAccessibility = localStorage.getItem("accessibility");
      
      if (savedTheme) {
        setThemeState(savedTheme);
      }
      
      if (savedAccessibility) {
        try {
          setAccessibilityState(JSON.parse(savedAccessibility));
        } catch (e) {
          // Ignore parse errors
        }
      }
    } catch (e) {
      // localStorage not available (SSR)
    }
  }, []);

  // Apply theme
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // localStorage not available
    }
  }, [theme]);

  // Apply accessibility settings
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    if (accessibility.enabled) {
      if (accessibility.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }
      if (accessibility.largeText) {
        root.classList.add("large-text");
      } else {
        root.classList.remove("large-text");
      }
    } else {
      root.classList.remove("high-contrast", "large-text");
    }
    
    try {
      localStorage.setItem("accessibility", JSON.stringify(accessibility));
    } catch (e) {
      // localStorage not available
    }
  }, [accessibility]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  }, []);

  const setAccessibility = React.useCallback((mode: AccessibilityMode) => {
    setAccessibilityState(mode);
  }, []);

  const toggleAccessibility = React.useCallback(() => {
    setAccessibilityState((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  }, []);

  const value = React.useMemo(
    () => ({
      theme,
      accessibility,
      setTheme,
      toggleTheme,
      setAccessibility,
      toggleAccessibility,
    }),
    [theme, accessibility, setTheme, toggleTheme, setAccessibility, toggleAccessibility]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

