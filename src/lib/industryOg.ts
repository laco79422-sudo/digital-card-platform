import { SITE_CANONICAL_URL } from "@/lib/siteLinkPreview";
import type { BusinessCard } from "@/types/domain";

const ORIGIN = SITE_CANONICAL_URL.replace(/\/$/, "");

/** 업종 표시명 → `public/industry-og/{basename}.png` (합성 OG PNG로 교체 시 og_image_url 만 갱신하면 됨) */
const INDUSTRY_OG_BASENAME: Record<string, string> = {
  세차장: "carwash",
  음식점: "restaurant",
  미용실: "hairshop",
  인테리어: "interior",
  부동산: "realestate",
  "청소/입주청소": "cleaning",
  "헬스/PT": "fitness",
  "학원/과외": "academy",
  "자동차 정비소": "repair",
  "온라인 판매": "store",
  카페: "restaurant",
  꽃집: "store",
  "배달·음식(소상공)": "restaurant",
  "촬영/스튜디오": "store",
  프리랜서: "store",
  "이사/용달": "default",
  "중고거래/개인 판매": "store",
  "반려동물 미용": "default",
  네일샵: "hairshop",
  "필라테스·요가": "fitness",
  "학습지·방문교육": "academy",
  "보험 설계사": "default",
  "대출·금융 상담": "default",
  "차량 렌트·리스": "default",
  "중고차 판매": "default",
  "출장 서비스(수리·설치)": "repair",
  "사진 보정·디자인": "store",
  "유튜브·영상 제작": "store",
  "블로그 마케팅": "store",
  "행사·이벤트": "default",
  "악기 레슨": "academy",
  "결혼·웨딩": "default",
  "여행·투어": "default",
  "번역·통역": "default",
  "법률·세무 상담": "default",
};

function normalizeIndustryKey(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/**
 * 업종명에 맞는 OG 에셋 파일명 (확장자 제외).
 */
export function industryOgBasename(industry: string | null | undefined): string {
  if (!industry?.trim()) return "default";
  const key = normalizeIndustryKey(industry);
  return INDUSTRY_OG_BASENAME[key] ?? "default";
}

/** `/industry-og/{file}.png` */
export function industryOgAssetPath(industry: string | null | undefined): string {
  return `/industry-og/${industryOgBasename(industry)}.png`;
}

/** `https://linkoapp.kr/industry-og/...` 절대 URL */
export function getIndustryOgFallback(industry: string | null | undefined): string {
  return `${ORIGIN}${industryOgAssetPath(industry)}`;
}

/**
 * 저장·OG 메타용 — 명함 합성 PNG가 생기면 `og_image_url`만 채우면 됩니다.
 */
export function generateIndustryOgImage(card: Pick<BusinessCard, "industry" | "og_image_url">): string {
  const raw = card.og_image_url?.trim();
  if (raw?.startsWith("https://")) return raw;
  if (raw?.startsWith("/")) return `${ORIGIN}${raw}`;
  return getIndustryOgFallback(card.industry ?? null);
}
