import { Navigate, useParams } from "react-router-dom";

/**
 * `/ref/LINKOX` · `/r/LINKOX` → `/?ref=LINKOX` (활성 세션·공개 헤더 플래그는 ReferralLandingRouteSync가 처리)
 */
export function ReferSlugRedirect() {
  const { code } = useParams<{ code?: string }>();
  const trimmed = code?.trim() ?? "";
  if (!trimmed) return <Navigate to="/" replace />;
  return <Navigate to={`/?ref=${encodeURIComponent(trimmed)}`} replace />;
}
