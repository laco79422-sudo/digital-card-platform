/** 게스트 체험용 임시 미리보기 절대 URL (/preview/{tempId}). */
export function buildTempPreviewUrl(origin: string, tempId: string): string | null {
  const id = tempId.trim();
  if (id.length < 8) return null;
  const base = origin.replace(/\/$/, "");
  return `${base}/preview/${encodeURIComponent(id)}`;
}

/** 공유·복사에 쓰는 개인 명함 절대 URL (/c/{slug}). slug 없으면 null (홈만 보내지 않도록). */
export function buildCardShareUrl(origin: string, slug: string): string | null {
  const s = slug.trim();
  if (s.length < 2) return null;
  const base = origin.replace(/\/$/, "");
  return `${base}/c/${encodeURIComponent(s)}`;
}

/**
 * 공개 명함 페이지에 있으면 `window.location.href`를 우선 (가장 정확한 현재 주소).
 * 그 외에는 origin + slug로 조합.
 */
export function resolveCardShareUrl(origin: string, slug: string): string | null {
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path.startsWith("/c/") && path.length > 3) {
      try {
        const u = new URL(window.location.href);
        u.hash = "";
        return u.toString();
      } catch {
        /* fallthrough */
      }
    }
  }
  return buildCardShareUrl(origin, slug);
}

export function editorOriginFallback(shareOrigin: string): string {
  if (shareOrigin) return shareOrigin;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
