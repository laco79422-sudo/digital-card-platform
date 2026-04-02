import { useEffect } from "react";

/** 이 프로젝트는 링크 미리보기용으로 document.head 메타만 패치하며 createPortal은 사용하지 않습니다. */
const CREATE_PORTAL_USED = false;

/**
 * 개발 모드에서만 마운트 순서·#root 상태를 로그합니다.
 * (프로덕션 번들에는 포함되나 effect는 실행되지 않습니다.)
 */
export function useDevMountLog(label: string) {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const root = document.getElementById("root");
    console.info(`[Linko mount] ${label}`, {
      rootExists: Boolean(root),
      rootChildElements: root?.childElementCount ?? 0,
      createPortalUsedInApp: CREATE_PORTAL_USED,
    });
    return () => {
      console.info(`[Linko unmount] ${label}`);
    };
  }, [label]);
}

export function logDevDomBaseline() {
  if (!import.meta.env.DEV) return;
  const root = document.getElementById("root");
  console.info("[Linko DOM baseline]", {
    hasRoot: Boolean(root),
    rootChildElements: root?.childElementCount ?? 0,
    note: "createPortal 미사용 — 모달은 #root 내부 fixed 레이어",
  });
}
