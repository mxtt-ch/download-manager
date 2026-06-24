import { Link } from "react-router-dom";
import "./NotFound.less";

/**
 * 404 页面未找到组件
 */
export function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <div className="not-found__code">404</div>
        <h2 className="not-found__title">页面未找到</h2>
        <p className="not-found__message">
          您访问的页面不存在或已被移除
        </p>
        <Link to="/" className="not-found__link">
          返回首页
        </Link>
      </div>
    </div>
  );
}
