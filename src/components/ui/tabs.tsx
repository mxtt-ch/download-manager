import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import "./tabs.less";

const Tabs = TabsPrimitive.Root;

/**
 * 标签页列表容器
 */
const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={["tabs-list", className].filter(Boolean).join(" ")}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * 标签页触发器按钮
 */
const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={["tabs-trigger", className].filter(Boolean).join(" ")}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * 标签页内容面板
 */
const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={["tabs-content", className].filter(Boolean).join(" ")}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
