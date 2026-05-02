import { Navigate, useParams } from "react-router-dom";

/**
 * `/ref/LINKOX` → `/?ref=LINKOX` (동일 SPA 내에서 활성 세션 동기화는 ReferralLandingRouteSync가 처리)
 */
export function ReferSlugRedirect() {
  const { code } = useParams<{ code?: string }>();
  const trimmed = code?.trim() ?? "";
  if (!trimmed) return <Navigate to="/" replace />;
  return <Navigate to={`/?ref=${encodeURIComponent(trimmed)}`} replace />;
}
