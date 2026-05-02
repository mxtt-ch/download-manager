import { useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * 主题切换 Hook — 从左上角圆形扩散到右下角的过渡动画
 *
 * 原理：利用 CSS clip-path: circle() 动画，从屏幕左上角(0,0)
 * 计算到右下角的最大半径，渲染一个全屏覆盖层实现扩散效果。
 */
export function useThemeTransition() {
  const { theme, toggleTheme: originalToggle } = useTheme();

  const toggleTheme = useCallback(() => {
    // 创建过渡覆盖层
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      pointer-events: none;
      background: var(--bg-page, #ffffff);
      clip-path: circle(0% at 0% 0%);
      transition: clip-path 500ms cubic-bezier(0.4, 0, 0.2, 1);
    `;
    document.body.appendChild(overlay);

    // 强制回流，确保起始状态被渲染
    overlay.getBoundingClientRect();

    // 计算从左上角到右下角的最大半径
    const maxRadius = Math.sqrt(
      window.innerWidth ** 2 + window.innerHeight ** 2
    );

    // 展开圆形
    requestAnimationFrame(() => {
      overlay.style.clipPath = `circle(${maxRadius}px at 0% 0%)`;
    });

    // 动画中点切换主题
    setTimeout(() => {
      originalToggle();
    }, 250);

    // 动画结束后清理
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 550);
  }, [originalToggle]);

  return { theme, toggleTheme };
}
