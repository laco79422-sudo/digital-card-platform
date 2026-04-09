import { createEmptyDraft, type CardEditorDraft } from "@/stores/cardEditorDraftStore";
import type { CardLinkType } from "@/types/domain";

/** 샘플 대표 이미지(편집·교체 가능한 실제 state 값) */
export const SAMPLE_BRAND_IMAGE_URL =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80";

const SAMPLE_GALLERY_LINE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80";

/**
 * 「3초 샘플」용 초안 — placeholder가 아니라 폼·미리보기가 그대로 쓰는 편집 가능 값입니다.
 */
export function getSampleCardDraft(overrides: Partial<CardEditorDraft> = {}): CardEditorDraft {
  return createEmptyDraft({
    brand_name: "린코 스튜디오",
    person_name: "송민호",
    job_title: "디지털 명함 디자이너",
    intro: "링크 하나로 나를 소개하고\n고객과 연결되는 디지털 명함을 만듭니다.",
    slug: "linko-studio",
    website_url: "https://linko.app",
    email: "hello@linko.app",
    phone: "",
    blog_url: "",
    youtube_url: "",
    kakao_url: "",
    theme: "navy",
    is_public: true,
    tagline: "디지털 명함으로 연결을 시작하세요",
    trust_line: "링크 하나로 소개하고, 문의로 이어집니다.",
    gallery_urls_raw: SAMPLE_GALLERY_LINE,
    brand_image_url: SAMPLE_BRAND_IMAGE_URL,
    services: [
      { title: "명함 구성", body: "브랜드에 맞는 소개와 버튼 배치" },
      { title: "링크 연결", body: "웹·이메일·SNS를 한 페이지에" },
      { title: "공유", body: "QR과 URL로 어디서든 전달" },
    ],
    ...overrides,
  });
}

export type SampleLinkRow = { id: string; label: string; type: CardLinkType; url: string };

export function getSampleLinkRows(): SampleLinkRow[] {
  return [
    { id: "sample-row-web", label: "웹사이트", type: "website", url: "https://linko.app" },
    { id: "sample-row-consult", label: "상담하기", type: "custom", url: "mailto:hello@linko.app" },
  ];
}

export function parseWantsSample(search: string): boolean {
  const q = new URLSearchParams(search);
  const v = q.get("sample");
  return v === "1" || v === "true" || v === "yes";
}
