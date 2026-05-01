/**
 * 占位设置组件 — 用于尚未实现的功能模块
 *
 * 当用户点击未完成的设置项时，展示开发中的友好提示界面。
 * 后续 Task 15 将陆续替换为实际的设置组件。
 */

interface PlaceholderSettingsProps {
  title: string;
}

export function PlaceholderSettings({ title }: PlaceholderSettingsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      <div className="text-4xl mb-4">🚧</div>
      <p className="text-lg font-medium text-slate-500 dark:text-slate-300">
        该功能正在开发中
      </p>
      <p className="text-sm mt-2 text-slate-400 dark:text-slate-500">
        &ldquo;{title}&rdquo;设置项将在后续版本中完善
      </p>
    </div>
  );
}
