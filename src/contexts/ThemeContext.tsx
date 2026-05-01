import React, { createContext, useContext, useEffect, useState } from "react";

/** 主题类型：深色或浅色 */
type Theme = "dark" | "light";

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
  toggleTheme: () => {},
  setTheme: () => {},
});

/** 主题 Provider — 控制 Tailwind 暗色模式切换并通过 localStorage 持久化 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    // 通过 Tailwind dark class 控制暗色模式
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  const setTheme = (t: Theme) => setThemeState(t);

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
