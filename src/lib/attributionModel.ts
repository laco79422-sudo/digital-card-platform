/**
 * ## 추천(referral) · 헬퍼(helper) · 채널(channel) — 역할 분리 모델
 *
 * **한 줄:** 추천은 사람(가입·수익), 헬퍼는 행동(홍보 실행), 채널은 경로(분석).
 *
 * ### 1) 개념
 * - **추천(referral)** — 누가 가입을 데려왔는가. 수익·가입 보상은 **`referrals` + `referral_rewards`** 만 기준. URL·localStorage는 “임시 힌트”이며 결제 RPC는 이 관계만 신뢰.
 * - **헬퍼(helper)** — 누가 홍보를 대신했는가(캠페인·파트너·전용 링크). 성과는 **`campaign_share_links` + `card_events`(campaign/helper_partner)** 및 레거시 **`helpers` / `helper_links`** 흐름으로 집계.
 * - **채널(channel)** — 어디에서 유입되었는가. **`card_channels`** + 이벤트의 **`channel_id`**.
 *
 * ### 2) Supabase 테이블 매핑 (문서·스펙 이름 ↔ 실제 이름)
 * | 스펙 | DB |
 * |------|-----|
 * | `referrals.referrer_id` | `referrals.referrer_user_id` |
 * | `helper_applications` | `helper_partner_applications` |
 * | 헬퍼 전용 링크(유료 캠페인) | `campaign_share_links` (레거시 `helper_links` 는 `helpers` 기반) |
 * | `helper_partners.name` | `helper_partners.display_name` |
 *
 * ### 3) 링크·파라미터 (섞지 않기)
 * - 플랫폼 회원추천: `/?ref=` 또는 `/ref/:code` → **localStorage `referralCode`** (`referralPersistentFirstTouch`). 헬퍼/캠페인과 덮어쓰기 금지.
 * - 명함: `/c/:slug?channel=:uuid&type=direct|helper&helper=:uuid` 또는 캠페인: `?campaign=&channel=&helper=` → **sessionStorage** `promotionTrackingSession` 키 + **`card_events`** 기록.
 *
 * ### 4) 클라이언트 저장소
 * - 로그인: Supabase 세션 정책은 `supabase/client` 주석 참고.
 * - **localStorage**: 플랫폼 추천 코드(+ firstSeen·만료)만 비민감 데이터.
 * - **sessionStorage**: `pendingCardDraft`, `currentChannelId`, `currentHelperId`, `currentCampaignId` 등 탭 단위 휘발 값.
 *
 * ### 5) 절대 금지 (아키텍처)
 * - 추천을 헬퍼·캠페인 파라미터로 덮어쓰기.
 * - 헬퍼/채널 값으로 플랫폼 `referralCode` 변경.
 * - 결제·출금 로직에서 URL/localStorage 재파싱으로 추천인 결정.
 * - 채널 UUID를 `referrals` 행과 같은 필드에 합치기.
 */
export const ATTRIBUTION_MODEL_VERSION = 1 as const;
