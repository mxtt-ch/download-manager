import "./PlaceholderSettings.less";

interface PlaceholderSettingsProps {
  title: string;
}

/**
 * 占位设置组件 — 用于尚未实现的功能模块
 */
export function PlaceholderSettings({ title }: PlaceholderSettingsProps) {
  return (
    <div className="placeholder-settings">
      <div className="placeholder-settings__icon">开发中</div>
      <p className="placeholder-settings__title">该功能正在开发中</p>
      <p className="placeholder-settings__desc">
        &ldquo;{title}&rdquo;设置项将在后续版本中完善
      </p>
    </div>
  );
}
