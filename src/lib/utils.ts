/**
 * 合并 CSS 类名工具函数
 * 使用 clsx 解析条件类名（不再依赖 tailwind-merge）
 */
export function cn(...inputs: unknown[]): string {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string") {
      classes.push(input);
    } else if (Array.isArray(input)) {
      classes.push(cn(...input));
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        if (value) classes.push(key);
      }
    }
  }
  return classes.join(" ");
}
