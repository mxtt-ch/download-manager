import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button 变体定义
 * - default: 蓝色主按钮
 * - destructive: 红色危险操作按钮
 * - outline: 边框轮廓按钮
 * - ghost: 透明幽灵按钮
 * - link: 链接样式按钮
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-sm hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400",
        outline:
          "border border-slate-300 bg-white shadow-sm hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-100",
        link: "text-blue-600 underline-offset-4 hover:underline dark:text-blue-400",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * 通用按钮组件
 * 支持多种变体和尺寸，通过 variant 和 size 属性控制样式
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    const Comp = "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
