import { createEmptyDraft, type CardEditorDraft } from "@/stores/cardEditorDraftStore";
import type { CardLinkType } from "@/types/domain";

/** 샘플 대표 이미지(편집·교체 가능한 실제 state 값) */
export const SAMPLE_BRAND_IMAGE_URL =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80";

const SAMPLE_GALLERY_LINES = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  "https://images.unsplash.com/photo-1600880292203-75761962e213?w=800&q=80",
].join("\n");

/**
 * 「3초 샘플」용 초안 — 홍보·전환형(유입·클릭) 톤.
 * placeholder가 아니라 폼·미리보기가 그대로 쓰는 편집 가능 값입니다.
 */
export function getSampleCardDraft(overrides: Partial<CardEditorDraft> = {}): CardEditorDraft {
  return createEmptyDraft({
    brand_name: "린코 디지털 명함",
    person_name: "송민호",
    job_title: "린코 디지털 명함 대표 · 연결을 만드는 사람",
    intro: "홍보가 되는 명함,\n연결이 이어지는 구조까지 함께 설계합니다",
    address: "서울 강남구 테헤란로 123",
    card_type: "person",
    slug: "linko-digital-card",
    website_url: "https://linko.app",
    email: "hello@linko.app",
    phone: "",
    blog_url: "",
    youtube_url: "",
    kakao_url: "",
    theme: "navy",
    is_public: true,
    tagline: "명함 하나로 고객이 먼저 찾아오게 만듭니다",
    trust_metric: "100+ 디지털 명함 제작",
    trust_testimonials: [
      {
        quote: "명함 하나로 문의가 늘었습니다.",
        person_name: "박○○",
        role: "헬스케어 스타트업 마케터",
      },
      {
        quote: "링크만 보내도 상담 동선이 정리됐어요.",
        person_name: "최○○",
        role: "1인 창업 · 컨설팅",
      },
    ],
    gallery_urls_raw: SAMPLE_GALLERY_LINES,
    brand_image_url: SAMPLE_BRAND_IMAGE_URL,
    services: [
      { title: "검색·SNS 연결", body: "유입 설계 — 검색·SNS에서 링크로 연결합니다." },
      { title: "클릭 → 문의", body: "전환 구조 — 누르면 바로 문의로 이어집니다." },
      { title: "고객 유지", body: "지속 연결 — 명함으로 관계를 이어 갑니다." },
    ],
    ...overrides,
  });
}

export type SampleLinkRow = { id: string; label: string; type: CardLinkType; url: string };

/** 순서대로 상단 2개는 메인 CTA, 나머지는 「빠른 연결」(전화번호 미입력 시 링크 기반 히어로) */
export function getSampleLinkRows(): SampleLinkRow[] {
  return [
    {
      id: "sample-cta-make",
      label: "내 명함 만들어보기",
      type: "website",
      url: "/create-card?sample=true",
    },
    {
      id: "sample-cta-guide",
      label: "무료로 구조 받아보기",
      type: "email",
      url: "mailto:hello@linko.app?subject=%EB%AC%B4%EB%A3%8C%20%EA%B5%AC%EC%A1%B0%20%EB%B0%9B%EA%B8%B0",
    },
    {
      id: "sample-quick-phone",
      label: "빠른 문의",
      type: "phone",
      url: "tel:010-1234-5678",
    },
    {
      id: "sample-kakao",
      label: "카톡 상담",
      type: "kakao",
      url: "https://open.kakao.com/o/sample",
    },
    {
      id: "sample-more",
      label: "샘플 더 보기",
      type: "website",
      url: "https://linko.app/pricing",
    },
  ];
}

export function parseWantsSample(search: string): boolean {
  const q = new URLSearchParams(search);
  const v = q.get("sample");
  return v === "1" || v === "true" || v === "yes";
}
