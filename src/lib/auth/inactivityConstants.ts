/** 비활성 자동 로그아웃까지 걸리는 시간 (밀리초). 정책 변경 시 이 값만 조정하면 됩니다. */
export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

/** localStorage에 마지막 사용자 활동 시각을 저장하는 키 */
export const APP_LAST_ACTIVITY_AT_KEY = "app_last_activity_at";

export const INACTIVITY_LOGOUT_MESSAGE =
  "1시간 동안 활동이 없어 자동으로 로그아웃되었습니다.";

/** 자동 로그아웃 안내를 로그인 화면에서 1회만 표시하기 위한 sessionStorage 키 */
export const INACTIVITY_NOTICE_SESSION_KEY = "linko_inactivity_notice";
