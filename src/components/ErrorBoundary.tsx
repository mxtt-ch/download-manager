import React from "react";
import "./ErrorBoundary.less";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 全局错误边界组件
 * 捕获子组件树中的未处理异常，显示友好的错误提示
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] 捕获到组件错误:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-page">
          <div className="error-page__content">
            <div className="error-page__icon">警告</div>
            <h2 className="error-page__title">页面出现异常</h2>
            <p className="error-page__message">
              {this.state.error?.message || "发生了未知错误"}
            </p>
            <button onClick={this.handleReset} className="error-page__btn">
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
