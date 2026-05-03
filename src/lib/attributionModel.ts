/**
 * ## 추천(referral) · 헬퍼(helper) · 채널(channel) — 역할 분리 모델
 *
 * **한 줄:** 추천은 사람(가입·수익), 헬퍼는 행동(홍보 실행), 채널은 경로(분석).
 *
 * **원칙(최종):** 기능을 늘리기 전에 데이터 흐름이 절대 꼬이지 않게 먼저 고정한다.
 *
 * ---
 *
 * ### 1) 개념 (절대 같은 필드에 합치지 않음)
 * - **추천(referral)** — 누가 가입을 데려왔는가. **수익·가입 보상은 `referrals` + `referral_rewards`만.** URL·localStorage는 가입 전 “임시 힌트”.
 * - **헬퍼(helper)** — 홍보 실행 주체.**성과는 `helper_campaigns` · `campaign_share_links` · `helper_partner_applications`(지원)·`card_events`(campaign/helper_partner)** 및 레거시 **`helpers` / `helper_links`** 분기로만.
 * - **채널(channel)** — 유입 경로.**분석 기준은 `card_channels` + `card_events.channel_id`만.**
 *
 * ---
 *
 * ### 2) Supabase 테이블 매핑 (스펙 ↔ 실제)
 * | 스펙 표기 | 실제 DB |
 * |-----------|---------|
 * | referrer_id | `referrals.referrer_user_id` |
 * | helper_applications | `helper_partner_applications` |
 * | 유료 헬퍼 전용 링크 | `campaign_share_links` |
 * | 레거시 헬퍼 링크 | `helper_links` (`helpers` 기반, 캠페인 플로우와 별도) |
 * | 이름 | `helper_partners.display_name` |
 *
 * ---
 *
 * ### 3) URL·저장소 (과부하·섞임 방지)
 * - **플랫폼 `ref`** — **`/` 또는 `/ref/*` 진입 시에만 의미.** 가입·`claim_referral` 후에는 **추적에 쓰지 않음**(명함 공유 URL에 `ref`를 붙이지 않는 방향이 이상적).
 * - **명함 유입 분석** — `?channel=&campaign=&helper=`(및 레거시 `type=`)만 쓰고, **수익은 URL 재파싱이 아니라 DB 조인**으로만.
 * - **localStorage** — 플랫폼 `referralCode` + 만료 등 **임시**; 확정은 **반드시 DB**(referrals 행).
 * - **sessionStorage** — 채널·캠페인·헬퍼 세션 미러링, 초안 명함 등 **탭 단위**.
 *
 * ---
 *
 * ### 4) 절대 금지 (데이터 꼬임 차단)
 * - 추천을 헬퍼·캠페인 파라미터로 덮어쓰기.
 * - 헬퍼/채널로 플랫폼 `referralCode` 변경.
 * - 결제·정산 RPC에서 **`ref` query / localStorage**로 추천인 재결정.
 * - 채널 UUID를 referrals 한 행 안에 우겨 넣기.
 *
 * ---
 *
 * ### 5) 우선순위 (플랫폼 로드맵과 동일)
 * 1. **DB 규격 완전 고정** — RLS·마이그레이션 단일 진실(SSOT); 프론트는 표시·입력만.
 * 2. **명함 → 공유 → 상담** — `consultations`(공개 문의)·`helper_consultations`(캠페인·파트너) 등 **단계 상태**를 명확히 연결하는 UX.
 * 3. **수익 보호** — 추천 1회 고정·자기추천 차단·pending→확정·환불 시 보상 회수·`fraud_flag`·출금 차단 등 **서버 측** 중심.
 * 4. **헬퍼 고도화** — 단계적 오픈(직접 홍보 → 단순 매칭 → 캠페인형)으로 **초기 복잡도** 억제.
 *
 * ---
 *
 * ### 6) 이미 레포에 반영된 완화(참조)
 * - 역할 분리 주석 · `campaign_share_links` vs 레거시 `helper_links`.
 * - 추천: `claim_referral` 고정 · local/session은 힌트만 · 악용 완화 마이그레이션(`signup_signals`, `available_at`, `fraud_flag` 등).
 * - 상담: `public.consultations` 및 공개 카드 문의 플로우.
 * - 남은 과제: URL 단순화(가입 후 `ref` 미사용 강화), HttpOnly 세션, `card_events.ip_hash`를 Edge에서 채움, 헬퍼 UI 단계별 노출 등.
 */
export const ATTRIBUTION_MODEL_VERSION = 2 as const;
