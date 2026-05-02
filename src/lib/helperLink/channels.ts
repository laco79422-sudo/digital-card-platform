import type { HelperPromoChannel } from "@/types/helperLink";

/** 신청 폼·헬퍼 프로필에서 공통 사용 */
export const HELPER_PROMO_CHANNEL_OPTIONS: {
  id: HelperPromoChannel;
  label: string;
}[] = [
  { id: "kakaotalk", label: "카카오톡" },
  { id: "daangn", label: "당근" },
  { id: "blog", label: "블로그" },
  { id: "youtube", label: "유튜브" },
];

/** 랜딩/가이드용 짧은 팁 — 상세 카피는 docs/helper-link-system-design.md §12 */
export const HELPER_CHANNEL_SHARE_TIPS: Record<HelperPromoChannel, string> = {
  kakaotalk: "이미지와 링크를 함께 보내면 미리보기가 잘 살아납니다.",
  daangn: "사진을 먼저 올리고, 본문에 명함 링크를 넣어 주세요.",
  blog: "글 중간과 하단에 CTA 문구와 링크를 넣어 전환을 이어 주세요.",
  youtube: "설명란 링크와 고정 댓글에 같은 링크를 두면 클릭이 모입니다.",
};
