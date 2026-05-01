import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 CSS 类名工具函数
 * 使用 clsx 解析条件类名，再用 tailwind-merge 合并 Tailwind CSS 冲突类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
