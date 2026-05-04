/** Linko 흐름 중심 UI 카피: 명함 → 링크 공유 → 유입 → 문의 → 상담 → 매출 */

export const LINKO_POSITION_LINE = "Linko는 명함이 아니라 고객을 데려오는 시스템입니다.";

export const LINKO_MAIN_CTA_LABEL = "3초만에 고객 오는 명함 만들기";

/** 랜딩 히어로 첫 줄(개행 포함 호출부에서 처리) */
export const LINKO_HERO_HEADLINE = "명함 하나로 고객이 들어오고 상담까지 연결됩니다";

export const LINKO_HERO_SUPPORTING =
  "링크 하나로 고객을 모으고 매출로 이어지게 만드는 한 페이지 흐름입니다.";

export const NAV_CARD_CREATE = "명함 만들기";
export const NAV_CUSTOMER_INBOUND = "고객 유입";
export const NAV_EXPERT_HELP = "전문가 도움";
export const NAV_MY_RESULTS = "내 성과";

/** 메인 「3초 명함 만들기」 CTA — 업종별 샘플(기본 인테리어) 자동 적용 */
export const LINKO_CARD_CREATE_FLOW_HREF = "/card/create?industry=interior";

/** 로그인 사용자가 이미 명함이 1장 있을 때, 편집 화면 상단 안내 */
export const MAIN_CTA_EXISTING_CARD_NOTICE =
  "이미 만들어진 명함이 있어요. 기존 명함을 수정하거나 공유할 수 있습니다.";

/** 명함 여러 장 → 목록에서 선택 유도 시 */
export const MAIN_CTA_MULTI_CARD_CHOOSE_NOTICE =
  "명함이 여러 개예요. 편집할 명함을 선택하거나 새 명함을 추가해 주세요.";

/** React Router `location.state` 키 — 단일 명함 편집 배너 */
export const ROUTE_STATE_MAIN_CTA_EXISTING_CARD = "mainCtaExistingCardNotice" as const;

/** 목록 페이지 상단 안내 */
export const ROUTE_STATE_MAIN_CTA_PICK_CARD = "mainCtaPickCardBanner" as const;
