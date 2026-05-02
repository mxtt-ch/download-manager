import React, { createContext, useContext, useEffect, useState } from "react";
import type { Theme } from "@/types";

interface ThemeContextType {
  /** 当前主题 */
  theme: Theme;
  /** 切换深色/浅色主题 */
  toggleTheme: () => void;
  /** 直接设置主题 */
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => { },
  setTheme: () => { },
});

/**
 * 获取系统首选主题
 * @returns "dark" | "light"
 */
function getSystemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "dark"; // 默认深色
}

/** 主题 Provider — 支持系统主题自动同步和手动覆盖 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 启动时读取系统主题
    return getSystemTheme();
  });

  // 监听系统主题变化，实时同步
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      setThemeState(newTheme);
    };

    // 添加监听器
    mediaQuery.addEventListener("change", handleChange);

    // 清理监听器
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // 应用主题到 DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    // 不保存到 localStorage，每次启动都重新读取系统主题
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** 获取当前主题上下文的 Hook */
export function useTheme() {
  return useContext(ThemeContext);
}
