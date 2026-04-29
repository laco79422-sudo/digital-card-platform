import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { error: Error | null };

/**
 * 루트 트리 렌더 예외 시 흰 화면 대신 복구 UI를 보여 줍니다.
 * 개발 모드에서는 componentStack을 콘솔에 남깁니다.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error.message, "\n", info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">화면을 불러오지 못했습니다</h1>
          <p className="max-w-md text-sm text-slate-600">
            잠시 후 새로고침해 주세요. 문제가 반복되면 관리자에게 문의해 주세요.
          </p>
          {import.meta.env.DEV ? (
            <pre className="max-h-48 max-w-lg overflow-auto rounded-lg bg-slate-900 p-3 text-left text-xs text-red-200">
              {this.state.error.stack}
            </pre>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <a
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              내 공간으로 돌아가기
            </a>
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-950 hover:bg-brand-100"
            >
              홈으로 가기
            </a>
            <button
              type="button"
              className="rounded-xl bg-cta-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
