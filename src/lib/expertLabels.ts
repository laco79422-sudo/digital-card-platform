import type { CreatorType } from "@/types/domain";

export const expertTypeTabLabels: Record<CreatorType, string> = {
  card_design: "명함디자인",
  blog: "블로그",
  video: "영상제작",
  program: "프로그램",
};

export function expertBadgeLabel(type: CreatorType): string {
  return `${expertTypeTabLabels[type]} 전문가`;
}

export const expertProductionServiceLabels: Record<CreatorType, string[]> = {
  card_design: ["명함디자인 제작", "문구·이미지 구성", "상세 구조 설계"],
  blog: ["블로그 글 작성", "SEO 글 컨설팅", "키워드 기획"],
  video: ["숏폼·릴스", "유튜브 영상", "홍보·제품 영상"],
  program: ["웹앱 화면", "자동화 스크립트", "관리 페이지"],
};
