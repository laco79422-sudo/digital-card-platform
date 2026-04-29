import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";

export type PromoIndustry =
  | "car-wash"
  | "restaurant"
  | "interior"
  | "salon"
  | "online-sales"
  | "real-estate"
  | "academy"
  | "fitness-pt"
  | "auto-repair"
  | "cleaning"
  | "delivery-food"
  | "freelancer"
  | "photo-studio"
  | "moving-truck"
  | "resale"
  | "flower-shop"
  | "cafe"
  | "pet-grooming"
  | "nail-shop"
  | "pilates-yoga"
  | "tutoring-visit"
  | "insurance-agent"
  | "finance-consult"
  | "vehicle-rent"
  | "used-car-sales"
  | "onsite-service"
  | "photo-retouch"
  | "video-production"
  | "blog-marketing"
  | "event-planning"
  | "music-lesson"
  | "wedding"
  | "travel-tour"
  | "translation"
  | "legal-tax"
  | "generic";

/** 슬러그·브랜드·태그라인으로 업종 추정 (매출 템플릿 slug 접두어 우선) */
export function inferPromoIndustryFromDraft(
  draft: Pick<CardEditorDraft, "slug" | "brand_name" | "tagline" | "intro">,
): PromoIndustry {
  const slug = draft.slug?.trim().toLowerCase() ?? "";
  if (slug.startsWith("car-wash")) return "car-wash";
  if (slug.startsWith("restaurant")) return "restaurant";
  if (slug.startsWith("interior")) return "interior";
  if (slug.startsWith("salon")) return "salon";
  if (slug.startsWith("shop-") || slug.includes("online")) return "online-sales";
  if (slug.startsWith("real-estate")) return "real-estate";
  if (slug.startsWith("academy")) return "academy";
  if (slug.startsWith("fitness-pt")) return "fitness-pt";
  if (slug.startsWith("auto-repair")) return "auto-repair";
  if (slug.startsWith("cleaning")) return "cleaning";
  if (slug.startsWith("delivery-food")) return "delivery-food";
  if (slug.startsWith("freelancer")) return "freelancer";
  if (slug.startsWith("photo-studio")) return "photo-studio";
  if (slug.startsWith("moving-truck")) return "moving-truck";
  if (slug.startsWith("resale")) return "resale";
  if (slug.startsWith("flower-shop")) return "flower-shop";
  if (slug.startsWith("cafe")) return "cafe";
  if (slug.startsWith("pet-grooming")) return "pet-grooming";
  if (slug.startsWith("nail-shop")) return "nail-shop";
  if (slug.startsWith("pilates-yoga")) return "pilates-yoga";
  if (slug.startsWith("tutoring-visit")) return "tutoring-visit";
  if (slug.startsWith("insurance-agent")) return "insurance-agent";
  if (slug.startsWith("finance-consult")) return "finance-consult";
  if (slug.startsWith("vehicle-rent")) return "vehicle-rent";
  if (slug.startsWith("used-car-sales")) return "used-car-sales";
  if (slug.startsWith("onsite-service")) return "onsite-service";
  if (slug.startsWith("photo-retouch")) return "photo-retouch";
  if (slug.startsWith("video-production")) return "video-production";
  if (slug.startsWith("blog-marketing")) return "blog-marketing";
  if (slug.startsWith("event-planning")) return "event-planning";
  if (slug.startsWith("music-lesson")) return "music-lesson";
  if (slug.startsWith("wedding")) return "wedding";
  if (slug.startsWith("travel-tour")) return "travel-tour";
  if (slug.startsWith("translation")) return "translation";
  if (slug.startsWith("legal-tax")) return "legal-tax";

  const blob = `${draft.brand_name} ${draft.tagline} ${draft.intro ?? ""}`.toLowerCase();
  if (/세차|세차장|wash|car\s*wash/.test(blob)) return "car-wash";
  if (/식당|음식|맛집|배달|주문|restaurant|food/.test(blob)) return "restaurant";
  if (/인테리어|시공|견적|리모델/.test(blob)) return "interior";
  if (/반려|펫\s*미용|애견\s*미용|그루머/.test(blob)) return "pet-grooming";
  if (/네일|젤네일|패디/.test(blob)) return "nail-shop";
  if (/헤어|미용실|살롱|예약|헤어샵/.test(blob)) return "salon";
  if (/구매|스토어|판매|쇼핑|상품|스마트스토어|온라인\s*판매/.test(blob)) return "online-sales";
  if (/부동산|매물|전세|월세|아파트/.test(blob)) return "real-estate";
  if (/학습지|방문\s*교육|방문\s*과외/.test(blob)) return "tutoring-visit";
  if (/학원|과외|수업|입시/.test(blob)) return "academy";
  if (/pt|헬스|gym|fitness|다이어트\s*트레/.test(blob)) return "fitness-pt";
  if (/정비소|정비|타이어|브레이크|오일/.test(blob)) return "auto-repair";
  if (/청소|입주/.test(blob)) return "cleaning";
  if (/포장\s*주문|배달\s*전문|소상공/.test(blob)) return "delivery-food";
  if (/프리랜서|포트폴리오|외주|디자이너|개발자/.test(blob)) return "freelancer";
  if (/촬영|스튜디오|포토|웨딩\s*스냅/.test(blob)) return "photo-studio";
  if (/이사|용달|짐\s*옮/.test(blob)) return "moving-truck";
  if (/중고|직거래|당근/.test(blob)) return "resale";
  if (/꽃|플라워|화환/.test(blob)) return "flower-shop";
  if (/카페|브루잉|커피\s*전문/.test(blob)) return "cafe";
  if (/필라테스|요가\s*스튜디오|요가/.test(blob)) return "pilates-yoga";
  if (/보험\s*설계|설계사/.test(blob)) return "insurance-agent";
  if (/대출\s*상담|금융\s*상담|금리\s*비교/.test(blob)) return "finance-consult";
  if (/렌트카|차량\s*렌트|리스/.test(blob)) return "vehicle-rent";
  if (/중고차|허가\s*판매장/.test(blob)) return "used-car-sales";
  if (/출장\s*수리|출장\s*설치|현장\s*출동/.test(blob)) return "onsite-service";
  if (/보정|합성|포토샵|리터칭/.test(blob)) return "photo-retouch";
  if (/유튜브|영상\s*제작|영상\s*편집|숏폼/.test(blob)) return "video-production";
  if (/블로그\s*마케팅|키워드\s*노출|상위\s*노출/.test(blob)) return "blog-marketing";
  if (/행사\s*기획|이벤트\s*진행/.test(blob)) return "event-planning";
  if (/악기\s*레슨|피아노\s*레슨|기타\s*레슨/.test(blob)) return "music-lesson";
  if (/웨딩|결혼식|예물/.test(blob)) return "wedding";
  if (/여행\s*상품|패키지\s*여행|투어/.test(blob)) return "travel-tour";
  if (/번역|통역/.test(blob)) return "translation";
  if (/법률\s*상담|세무\s*상담|변호사|세무사/.test(blob)) return "legal-tax";

  return "generic";
}

const INDUSTRY_HOOKS: Record<Exclude<PromoIndustry, "generic">, readonly [string, string]> = {
  "car-wash": ["세차 맡길 곳 찾고 계신가요?", "지금 바로 가능합니다"],
  restaurant: ["맛있는 한 끼, 지금 주문하세요.", "배달·포장 바로 가능합니다"],
  interior: ["시공 결과가 곧 신뢰입니다.", "무료 견적으로 시작해 보세요"],
  salon: ["오늘 예약 가능한 시간 있어요.", "스타일 상담 후 바로 예약하세요"],
  "online-sales": ["지금 바로 구매 가능한 상품이에요.", "링크에서 확인·주문하세요"],
  "real-estate": ["찾으시는 매물 있으신가요?", "사진·위치·가격 바로 확인해 보세요"],
  academy: ["과외·학원 상담 받고 계신가요?", "지금 무료로 일정 잡을 수 있어요"],
  "fitness-pt": ["운동 시작을 미루고 계셨나요?", "오늘부터 체험 가능합니다"],
  "auto-repair": ["차량 점검이 필요하신가요?", "오늘 바로 예약할 수 있어요"],
  cleaning: ["입주·청소 맡기실 분 계신가요?", "전후 사진으로 견적부터 받아 보세요"],
  "delivery-food": ["오늘 뭐 드실래요?", "메뉴 보고 바로 주문하세요"],
  freelancer: ["프로젝트 맡길 분 찾고 계신가요?", "포트폴리오 확인 후 바로 의뢰하세요"],
  "photo-studio": ["촬영 일정 잡고 계신가요?", "샘플·가격 보고 예약하세요"],
  "moving-truck": ["이사·용달 필요하신가요?", "차량·요금 안내 바로 드려요"],
  resale: ["관심 상품 있으신가요?", "직거래 문의 지금 가능합니다"],
  "flower-shop": ["오늘 꽃이 필요하세요?", "사진·가격 보고 지금 주문하세요"],
  cafe: ["지금 카페 오실래요?", "메뉴·위치 확인 후 바로 방문하세요"],
  "pet-grooming": ["반려동물 미용 예약하실래요?", "전후 사진·가격 보고 오늘 예약하세요"],
  "nail-shop": ["오늘 네일 받으실래요?", "디자인·가격 확인 후 지금 예약하세요"],
  "pilates-yoga": ["오늘부터 운동 시작할까요?", "수업 사진·프로그램 보고 체험하세요"],
  "tutoring-visit": ["학습·방문 상담 받아보실래요?", "과목·대상 맞춰 오늘 바로 상담하세요"],
  "insurance-agent": ["보험 정리 필요하세요?", "분야만 골라도 오늘 바로 상담 연결됩니다"],
  "finance-consult": ["자금·대출 상담 필요하세요?", "조건 비교 후 지금 바로 안내드려요"],
  "vehicle-rent": ["오늘 차량 필요하세요?", "차량 리스트·가격 보고 바로 문의하세요"],
  "used-car-sales": ["관심 차량 있으세요?", "사진·가격 보고 지금 바로 문의하세요"],
  "onsite-service": ["현장 출동이 필요하세요?", "서비스 확인 후 지금 바로 요청하세요"],
  "photo-retouch": ["마감 급한 보정 있으세요?", "예시 보고 오늘 바로 의뢰 연결됩니다"],
  "video-production": ["영상 제작 맡기실래요?", "포트폴리오 보고 지금 문의하세요"],
  "blog-marketing": ["상위 노출이 필요하세요?", "사례 확인 후 오늘 바로 상담받으세요"],
  "event-planning": ["행사 준비 중이세요?", "진행 사례 보고 오늘 바로 문의하세요"],
  "music-lesson": ["오늘 레슨 시작할까요?", "영상 보고 바로 신청하세요"],
  wedding: ["웨딩 상담 받아보실래요?", "사례 확인 후 오늘 바로 예약하세요"],
  "travel-tour": ["여행 예약 도와드릴까요?", "상품·가격 보고 지금 예약하세요"],
  translation: ["번역·통역 필요하세요?", "언어만 알려도 오늘 바로 안내드려요"],
  "legal-tax": ["법무·세무 고민 있으세요?", "분야 맞춰 오늘 초기 상담 가능합니다"],
};

/** 카카오·문자에 붙여 넣는 업종 맞춤 홍보 블록 */
export function buildIndustryPromoShareText(
  shareUrl: string,
  draft: Pick<CardEditorDraft, "tagline" | "intro" | "brand_name" | "person_name" | "slug">,
  industry?: PromoIndustry,
): string {
  const ind = industry ?? inferPromoIndustryFromDraft(draft);
  if (ind !== "generic") {
    const [a, b] = INDUSTRY_HOOKS[ind];
    return `${a}\n${b}\n\n👉 명함 보기\n${shareUrl}`;
  }

  const tag = draft.tagline?.trim();
  const brand = draft.brand_name?.trim();
  const person = draft.person_name?.trim();
  const introFirst = draft.intro?.trim()?.split(/\n/)?.[0]?.trim()?.slice(0, 72);

  const line1 = tag || brand || person || "안녕하세요";
  let line2 =
    introFirst && introFirst !== line1
      ? introFirst
      : brand && person && brand !== person
        ? `${person} · ${brand}`
        : "지금 바로 가능합니다";

  if (line2 === line1) line2 = "지금 바로 가능합니다";

  return `${line1}\n${line2}\n\n👉 명함 보기\n${shareUrl}`;
}

/** @deprecated 호환용 — 업종 추론 버전 사용 권장 */
export function buildCardPromoShareText(
  shareUrl: string,
  draft: Pick<CardEditorDraft, "tagline" | "intro" | "brand_name" | "person_name" | "slug">,
): string {
  return buildIndustryPromoShareText(shareUrl, draft);
}
