import type { PreviewCardType } from "@/lib/previewCardType";
import { slugify } from "@/stores/appDataStore";
import { createEmptyDraft, type CardEditorDraft } from "@/stores/cardEditorDraftStore";

export type SampleFlowKind = "personal" | "business" | "store";

/** 세부 카테고리 값 */
export type PersonalSubcategoryId = "instructor" | "freelancer" | "expert" | "creator" | "counselor";
export type BusinessSubcategoryId = "interior" | "furniture" | "cleaning" | "beauty" | "education";
export type StoreSubcategoryId = "cafe" | "restaurant" | "workshop" | "salon" | "localshop";

export type SampleSubcategoryId = PersonalSubcategoryId | BusinessSubcategoryId | StoreSubcategoryId;

export interface CategoryOption {
  id: SampleSubcategoryId;
  label: string;
}

export const SAMPLE_PERSONAL_CATEGORIES: CategoryOption[] = [
  { id: "instructor", label: "강사" },
  { id: "freelancer", label: "프리랜서" },
  { id: "expert", label: "전문가" },
  { id: "creator", label: "크리에이터" },
  { id: "counselor", label: "상담사" },
];

export const SAMPLE_BUSINESS_CATEGORIES: CategoryOption[] = [
  { id: "interior", label: "인테리어" },
  { id: "furniture", label: "가구 제작" },
  { id: "cleaning", label: "청소/정리" },
  { id: "beauty", label: "미용/뷰티" },
  { id: "education", label: "교육/컨설팅" },
];

export const SAMPLE_STORE_CATEGORIES: CategoryOption[] = [
  { id: "cafe", label: "카페" },
  { id: "restaurant", label: "식당" },
  { id: "workshop", label: "공방" },
  { id: "salon", label: "미용실" },
  { id: "localshop", label: "로컬샵" },
];

export interface SamplePhrase {
  /** 목록 카드 라벨 (짧게) */
  listLabel: string;
  marketingTitle: string;
  /** 한 줄 소개 */
  tagline: string;
  /** 상세(공개 페이지 본문) */
  detailDescription: string;
  /** 정보 태그용 서비스 제목 최대 3 */
  serviceChipTitles: [string, string, string];
  region: string;
  contactButtonText: string;
  detailButtonText: string;
  shareText: string;
}

export const SAMPLE_TEMPLATE_PHONE = "010-0000-1234";

const SAMPLE_PHONES = SAMPLE_TEMPLATE_PHONE;

const BG_PROFILE = "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=960&q=80";
const BG_INTERIOR = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=960&q=80";
const BG_FURNITURE = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=960&q=80";
const BG_CLEAN = "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=960&q=80";
const BG_BEAUTY = "https://images.unsplash.com/photo-1522337660859-02fbef661470?w=960&q=80";
const BG_EDU = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=960&q=80";
const BG_CAFE = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=960&q=80";
const BG_RESTAURANT = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=960&q=80";
const BG_WORKSHOP = "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=960&q=80";
const BG_STORE = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=960&q=80";

/** 개인형 공통 문구 풀 — 세부 카테고리 선택 후 동일하게 노출 가능 */
export const PERSONAL_SAMPLE_PHRASES: SamplePhrase[] = [
  {
    listLabel: "바로 소개 가능",
    marketingTitle: "나를 소개하는 가장 쉬운 명함",
    tagline: "하는 일과 연락 방법을 한눈에 보여드립니다.",
    detailDescription:
      "경력, 서비스, 상담 가능 시간을 한 페이지에 정리해 고객이 쉽게 연락할 수 있습니다.",
    serviceChipTitles: ["상담", "코칭·강의", "포트폴리오"],
    region: "서울 · 경기",
    contactButtonText: "문의하기",
    detailButtonText: "자세히 보기",
    shareText: "링크 하나로 소개부터 문의까지 이어져요.",
  },
  {
    listLabel: "한 장 정리",
    marketingTitle: "내 일을 한 장에 담았습니다",
    tagline: "소개부터 문의까지 자연스럽게 이어집니다.",
    detailDescription:
      "복잡한 설명 없이 핵심 정보만 담아 처음 보는 사람도 바로 이해할 수 있습니다.",
    serviceChipTitles: ["업무 소개", "문의 채널", "예약 가능"],
    region: "온라인 · 방문 가능",
    contactButtonText: "문의하기",
    detailButtonText: "포트폴리오 보기",
    shareText: "핵심만 담아 첫인상이 또렷하게 전달돼요.",
  },
  {
    listLabel: "찾아오게",
    marketingTitle: "고객이 나를 쉽게 찾도록",
    tagline: "프로필, 서비스, 연락처를 한 번에 보여주세요.",
    detailDescription:
      "링크 하나로 나를 소개하고, 고객 문의까지 연결되는 개인형 명함입니다.",
    serviceChipTitles: ["프로필", "서비스 안내", "연락처"],
    region: "서울 · 수도권",
    contactButtonText: "문의하기",
    detailButtonText: "자세히 보기",
    shareText: "프로필·서비스·연락을 한 페이지에 묶어두었습니다.",
  },
  {
    listLabel: "바로 보내기",
    marketingTitle: "소개가 필요한 순간, 바로 보내세요",
    tagline: "말로 설명하기 어려운 나의 일을 명함에 담습니다.",
    detailDescription:
      "카톡, 블로그, 유튜브 어디든 공유할 수 있는 개인 소개 페이지가 만들어집니다.",
    serviceChipTitles: ["소개 카드", "문의 버튼", "공유 친화"],
    region: "전국 가능",
    contactButtonText: "문의하기",
    detailButtonText: "내용 더 보기",
    shareText: "한 링크로 어디에서든 같은 소개를 보여 줄 수 있어요.",
  },
  {
    listLabel: "전문성 강조",
    marketingTitle: "나의 전문성을 보기 쉽게",
    tagline: "첫인상부터 상담 문의까지 이어지는 명함입니다.",
    detailDescription:
      "내가 하는 일, 가능한 상담, 포트폴리오를 정리해 신뢰를 높입니다.",
    serviceChipTitles: ["경력 소개", "가능 업무", "상담 일정"],
    region: "서울 · 경기 · 인천",
    contactButtonText: "상담 신청하기",
    detailButtonText: "자세히 보기",
    shareText: "전문성과 상담 흐름을 한 페이지로 정돈했습니다.",
  },
];

export const INTERIOR_SAMPLE_PHRASES: SamplePhrase[] = [
  {
    listLabel: "공간 브랜딩",
    marketingTitle: "공간을 바꾸면 삶이 바뀝니다",
    tagline: "주거와 상업공간을 감각 있게 설계합니다.",
    detailDescription:
      "아파트 리모델링, 매장 인테리어, 부분 시공 상담까지 한 번에 안내합니다.",
    serviceChipTitles: ["주거 리모델링", "매장 인테리어", "부분 시공"],
    region: "서울 · 경기",
    contactButtonText: "상담 문의하기",
    detailButtonText: "시공 사례 보기",
    shareText: "시공 범위와 상담 절차를 링크 안에서 확인하세요.",
  },
  {
    listLabel: "맞춤 제안",
    marketingTitle: "우리 집에 맞는 인테리어 상담",
    tagline: "예산과 공간에 맞는 시공 방향을 제안합니다.",
    detailDescription:
      "고객의 생활 방식과 예산을 기준으로 가장 현실적인 공간 개선 방법을 안내합니다.",
    serviceChipTitles: ["실측·상담", "예산 제안", "자재 선택"],
    region: "서울 · 수도권",
    contactButtonText: "상담 문의하기",
    detailButtonText: "시공 순서 안내",
    shareText: "예산·공간 고려한 현실적인 제안을 받아 보실 수 있습니다.",
  },
  {
    listLabel: "매장·사무실",
    marketingTitle: "작은 공간도 브랜드처럼",
    tagline: "매장과 사무실의 첫인상을 설계합니다.",
    detailDescription:
      "고객이 머무르고 싶은 공간을 만들기 위해 동선, 조명, 가구 배치를 함께 제안합니다.",
    serviceChipTitles: ["브랜딩 플래닝", "동선·조명", "가구 조합"],
    region: "서울 · 경기 · 인천",
    contactButtonText: "상담 문의하기",
    detailButtonText: "레퍼런스 보기",
    shareText: "공간 브랜딩부터 시공까지 한 번에 정리했습니다.",
  },
  {
    listLabel: "절차 투명",
    marketingTitle: "견적 전, 먼저 확인해보세요",
    tagline: "시공 분야와 상담 절차를 한눈에 볼 수 있습니다.",
    detailDescription:
      "가능한 시공 범위, 상담 방식, 예상 진행 과정을 명함 링크 안에서 확인할 수 있습니다.",
    serviceChipTitles: ["진행 과정", "상담 방식", "견적 흐름"],
    region: "수도권",
    contactButtonText: "상담 문의하기",
    detailButtonText: "준비 순서 안내",
    shareText: "견적 받기 전에 절차를 링크로 먼저 확인해 보세요.",
  },
  {
    listLabel: "신뢰 파트너",
    marketingTitle: "믿고 맡길 수 있는 공간 파트너",
    tagline: "상담부터 시공까지 차근차근 안내합니다.",
    detailDescription:
      "처음 인테리어를 준비하는 고객도 쉽게 이해할 수 있도록 필요한 정보를 정리합니다.",
    serviceChipTitles: ["기초 안내", "실측 후 제안", "시공 진행"],
    region: "서울 · 경기",
    contactButtonText: "상담 문의하기",
    detailButtonText: "FAQ 보기",
    shareText: "첫 준비도 부담 없이 단계별로 안내해 드립니다.",
  },
];

export const FURNITURE_SAMPLE_PHRASES: SamplePhrase[] = [
  {
    listLabel: "맞춤 수납",
    marketingTitle: "공간에 꼭 맞는 가구를 만듭니다",
    tagline: "수납장, 테이블, 맞춤가구 제작 상담",
    detailDescription:
      "공간 크기와 사용 목적에 맞춰 실용적인 맞춤가구를 제안합니다.",
    serviceChipTitles: ["실측", "설계 제안", "맞춤 제작"],
    region: "수도권",
    contactButtonText: "상담 문의하기",
    detailButtonText: "작업 사진 보기",
    shareText: "맞춤 수납·테이블 제작까지 한 페이지에서 상담받으세요.",
  },
  {
    listLabel: "사이즈 맞춤",
    marketingTitle: "필요한 크기 그대로 제작합니다",
    tagline: "우리 집에 맞는 가구를 직접 설계합니다.",
    detailDescription:
      "기성품으로 해결하기 어려운 공간을 맞춤 제작으로 정리합니다.",
    serviceChipTitles: ["사이즈 맞춤", "내구 설계", "현장 마감"],
    region: "경기 중심",
    contactButtonText: "실측 상담받기",
    detailButtonText: "예시 보기",
    shareText: "기성품으로 빈틈 채운 맞춤 가구 안내입니다.",
  },
  {
    listLabel: "오래 쓰는",
    marketingTitle: "오래 쓰는 가구를 정성껏",
    tagline: "디자인과 실용성을 함께 생각합니다.",
    detailDescription:
      "생활 동선과 수납 습관을 고려해 오래 사용할 수 있는 가구를 만듭니다.",
    serviceChipTitles: ["원목 선택", "도장 마감", "AS 안내"],
    region: "서울 · 경기",
    contactButtonText: "문의하기",
    detailButtonText: "제작 과정 안내",
    shareText: "실생활 패턴까지 반영한 가구입니다.",
  },
  {
    listLabel: "수납 해결",
    marketingTitle: "수납 고민을 가구로 해결합니다",
    tagline: "작은 공간도 넓게 쓰는 맞춤 제작",
    detailDescription:
      "현관, 주방, 거실, 방마다 필요한 수납 구조를 제안합니다.",
    serviceChipTitles: ["주방 수납", "드레스룸", "거실 장"],
    region: "수도권",
    contactButtonText: "상담하기",
    detailButtonText: "사례 모아보기",
    shareText: "공간마다 들어맞는 수납 구조를 제안합니다.",
  },
  {
    listLabel: "상담부터",
    marketingTitle: "당신의 공간에 맞춘 하나의 가구",
    tagline: "상담부터 제작까지 함께합니다.",
    detailDescription:
      "상담, 실측, 디자인, 제작 과정을 명함 링크에서 쉽게 안내합니다.",
    serviceChipTitles: ["실측", "설계 확인", "납품·설치"],
    region: "서울 · 경기 · 인천",
    contactButtonText: "제작 문의하기",
    detailButtonText: "진행 절차 보기",
    shareText: "진행 과정을 투명하게 링크에 올려 두었습니다.",
  },
];

const GENERIC_CLEAN: SamplePhrase[] = [
  {
    listLabel: "입주·이사",
    marketingTitle: "새 공간은 청결한 출발부터",
    tagline: "입주·이사 청소와 정리·수납까지 한 번에 상담합니다.",
    detailDescription:
      "공간 크기와 오염 정도에 맞춰 범위를 나누고, 일정·견적을 투명하게 안내합니다. 필요하면 정기 관리까지 이어질 수 있습니다.",
    serviceChipTitles: ["입주 청소", "정리·수납", "정기 방문"],
    region: "서울 · 수도권",
    contactButtonText: "견적 문의하기",
    detailButtonText: "서비스 범위 보기",
    shareText: "입주·이사 전 청소·정리 범위를 링크에서 먼저 확인해 보세요.",
  },
  {
    listLabel: "바쁜 일정",
    marketingTitle: "바쁜 날에도 집은 반짝이게",
    tagline: "상황에 맞는 인력과 체크리스트로 빠짐없이 마무리합니다.",
    detailDescription:
      "집·사무실·소규모 매장까지 규모에 맞게 일정을 잡고, 작업 전후를 체크리스트로 확인해 드립니다.",
    serviceChipTitles: ["예약 접수", "현장 점검", "맞춤 견적"],
    region: "경기 · 인천",
    contactButtonText: "예약 문의하기",
    detailButtonText: "작업 순서 안내",
    shareText: "체크리스트 기반으로 어디를 어떻게 정리했는지 한눈에 보실 수 있어요.",
  },
  {
    listLabel: "전후 투명",
    marketingTitle: "결과가 보이는 청소·정리",
    tagline: "작업 전후와 예상 소요 시간을 미리 공유합니다.",
    detailDescription:
      "사진으로 현장을 파악한 뒤 견적과 일정을 제안합니다. 진행 중 궁금한 점은 같은 페이지의 문의로 연결됩니다.",
    serviceChipTitles: ["사진 상담", "견적 안내", "작업 보고"],
    region: "서울 · 수도권",
    contactButtonText: "무료 상담하기",
    detailButtonText: "사례 보기",
    shareText: "전후 비교가 가능한 청소·정리 서비스입니다.",
  },
  {
    listLabel: "부분 맞춤",
    marketingTitle: "필요한 곳만 골라 맞춤",
    tagline: "부분 청소부터 전체 패키지까지 부담 없이 선택하세요.",
    detailDescription:
      "화장실·주방·거실 등 원하는 구역만 지정할 수 있어 처음 이용하시기에도 부담이 적습니다. 대형 폐기물 이동도 별도 문의 가능합니다.",
    serviceChipTitles: ["부분 청소", "정리 패키지", "폐기물 안내"],
    region: "인천 · 경기",
    contactButtonText: "문의하기",
    detailButtonText: "범위 선택 안내",
    shareText: "구역만 골라도 견적받을 수 있어요.",
  },
  {
    listLabel: "정기 케어",
    marketingTitle: "한 번이 아니라 계속 깨끗하게",
    tagline: "일회 청소부터 정기 방문까지 같은 링크로 관리합니다.",
    detailDescription:
      "가정·사무 공간에 맞는 주기를 제안하고, 재방문 시에는 이전 작업 내역을 참고해 효율적으로 이어갑니다.",
    serviceChipTitles: ["일회 청소", "정기 케어", "문의·변경"],
    region: "서울 전역",
    contactButtonText: "정기 케어 문의",
    detailButtonText: "이용 안내 보기",
    shareText: "정기 이용 문의와 일정 안내를 한 페이지에 모았습니다.",
  },
];

const GENERIC_BEAUTY: SamplePhrase[] = [
  {
    listLabel: "맞춤 상담",
    marketingTitle: "내 얼굴과 두피에 맞춘 디자인",
    tagline: "상담 후 시술·관리 방법까지 함께 안내합니다.",
    detailDescription:
      "두피·모질 상태와 라이프스타일을 먼저 듣고 스타일·시술 옵션을 제안합니다. 예약 시간과 준비 사항도 이 링크에서 확인하실 수 있습니다.",
    serviceChipTitles: ["디자인 상담", "시술", "홈 케어 안내"],
    region: "우리 동네",
    contactButtonText: "예약 문의하기",
    detailButtonText: "메뉴·시술 안내",
    shareText: "상담 맥락을 담아 예약까지 이어지는 매장 페이지입니다.",
  },
  {
    listLabel: "과정 안내",
    marketingTitle: "과정부터 유지까지 투명하게",
    tagline: "시술 단계와 유지 기간을 미리 확인해 보세요.",
    detailDescription:
      "첫 방문 고객도 이해하기 쉽게 단계별로 설명하고, 유지 기간과 주의 사항을 정리해 두었습니다. 문의는 같은 페이지에서 남겨 주시면 빠르게 답변드립니다.",
    serviceChipTitles: ["시술 단계", "유지 관리", "문의"],
    region: "서울 · 수도권",
    contactButtonText: "상담 예약",
    detailButtonText: "시술 안내 보기",
    shareText: "시술 전후 가이드가 정리된 링크예요.",
  },
  {
    listLabel: "자연스러운 밸런스",
    marketingTitle: "트렌드보다 어울림을 먼저",
    tagline: "얼굴형과 생활 패턴에 맞는 스타일을 제안합니다.",
    detailDescription:
      "과한 변화보다 일상에서 편한 밸런스를 추구합니다. 컬러·컷·펌 등 옵션별로 유지감과 관리 팁을 함께 안내합니다.",
    serviceChipTitles: ["컷·스타일", "컬러", "관리 팁"],
    region: "강남 · 홍대 인근",
    contactButtonText: "예약하기",
    detailButtonText: "스타일 참고 보기",
    shareText: "얼굴형·생활 패턴을 고려한 스타일 제안을 받아 보세요.",
  },
  {
    listLabel: "여유 있는 예약",
    marketingTitle: "약속 시간을 지키는 살롱",
    tagline: "예약 간격을 두어 여유 있게 시술받을 수 있도록 합니다.",
    detailDescription:
      "대기 시간 스트레스를 줄이기 위해 예약 단위를 조정하고, 변경·지연 시에도 빠르게 소통할 수 있도록 연락처를 한곳에 모았습니다.",
    serviceChipTitles: ["예약 안내", "시술", "일정 변경"],
    region: "수도권",
    contactButtonText: "예약 문의",
    detailButtonText: "오시는 길",
    shareText: "예약제로 여유 있게 시술받는 살롱입니다.",
  },
  {
    listLabel: "재방문 케어",
    marketingTitle: "집에서도 이어지는 관리",
    tagline: "시술 후 홈 케어와 재방문 혜택을 안내합니다.",
    detailDescription:
      "일상에서 지킬 수 있는 간단한 루틴과 제품 사용 팁을 정리하고, 재방문 시 혜택이나 이벤트도 이 페이지에서 확인하실 수 있습니다.",
    serviceChipTitles: ["홈 케어", "재방문 안내", "이벤트"],
    region: "로컬 매장",
    contactButtonText: "혜택 문의하기",
    detailButtonText: "케어 루틴 보기",
    shareText: "시술 후 관리까지 이어지는 안내 링크입니다.",
  },
];

const GENERIC_EDUCATION: SamplePhrase[] = [
  {
    listLabel: "로드맵",
    marketingTitle: "목표에 맞게 짜는 학습 설계",
    tagline: "현재 수준을 확인한 뒤 과정과 과제 구조를 제안합니다.",
    detailDescription:
      "시험·이직·업무 역량 등 목표에 맞춰 커리큘럼을 나누고, 주차별 과제와 피드백 방식까지 한 페이지에 정리합니다. 온·오프라인 병행도 문의해 주세요.",
    serviceChipTitles: ["수준 점검", "학습 로드맵", "코칭"],
    region: "온라인 · 오프라인",
    contactButtonText: "상담 신청하기",
    detailButtonText: "과정 개요 보기",
    shareText: "진단부터 로드맵까지 링크로 먼저 확인해 보세요.",
  },
  {
    listLabel: "직장인 맞춤",
    marketingTitle: "바쁜 일정에 맞춘 밀도 높은 코스",
    tagline: "주중 야간·주말 슬롯으로 짧은 기간에 집중할 수 있게 구성합니다.",
    detailDescription:
      "기간 안에 끝낼 분량과 주간 과제를 명확히 정해 자기주도 학습으로 이어지도록 돕습니다. 녹화 복습이 가능한 구성도 선택할 수 있습니다.",
    serviceChipTitles: ["집중 코스", "주간 과제", "피드백"],
    region: "온라인 중심",
    contactButtonText: "일정 문의하기",
    detailButtonText: "패키지 설명",
    shareText: "짧은 기간에 습관을 만드는 학습 패키지입니다.",
  },
  {
    listLabel: "기업·팀",
    marketingTitle: "팀이 같은 방향으로 성장하도록",
    tagline: "사내 교육·워크숍을 직무·직급에 맞게 구성합니다.",
    detailDescription:
      "워크숍, 과제형 실습, 간단 리포팅까지 옵션을 나누어 제안합니다. 교육 자료와 진행 매뉴얼 제공도 가능하니 견적 시 함께 문의해 주세요.",
    serviceChipTitles: ["워크숍", "과제형 실습", "정리 리포트"],
    region: "수도권 출장 가능",
    contactButtonText: "견적 문의하기",
    detailButtonText: "진행 형태 안내",
    shareText: "사내 교육을 맞춤으로 설계해 드립니다.",
  },
  {
    listLabel: "멘토링·코칭",
    marketingTitle: "한 번의 세션으로 방향부터 잡기",
    tagline: "경력·전환 고민을 구조화해 다음 행동까지 정리합니다.",
    detailDescription:
      "현재 상황과 목표를 정리한 뒤, 우선순위와 실행 계획을 함께 만듭니다. 후속 멘토링 세션은 필요할 때만 추가하실 수 있습니다.",
    serviceChipTitles: ["1:1 세션", "실행 과제", "후속 선택"],
    region: "서울 대면 · 전국 온라인",
    contactButtonText: "멘토링 신청",
    detailButtonText: "진행 방식 보기",
    shareText: "멘토링이 처음이셔도 단계가 보이도록 안내합니다.",
  },
  {
    listLabel: "실무 스킬",
    marketingTitle: "배운 것이 일로 이어지게",
    tagline: "도구 익히기부터 실무형 과제·코드 리뷰까지.",
    detailDescription:
      "강의와 실습 과제를 묶어 바로 업무에 쓸 수 있는 흐름으로 구성합니다. 질문 채널과 자료 위치도 이 링크에서 안내합니다.",
    serviceChipTitles: ["도구·기초", "실습 과제", "리뷰·피드백"],
    region: "라이브 · VOD",
    contactButtonText: "과정 문의하기",
    detailButtonText: "커리큘럼 보기",
    shareText: "실무형 커리큘럼과 과제 구조를 링크에서 확인하세요.",
  },
];

export const STORE_SAMPLE_PHRASES: SamplePhrase[] = [
  {
    listLabel: "동네 스팟",
    marketingTitle: "가까운 곳에서 만나는 우리 매장",
    tagline: "위치, 영업시간, 대표 상품을 한눈에 보여드립니다.",
    detailDescription: "방문 전 필요한 정보를 쉽게 확인하고 바로 문의할 수 있습니다.",
    serviceChipTitles: ["위치 안내", "영업 시간", "대표 메뉴"],
    region: "우리 동네",
    contactButtonText: "방문 문의하기",
    detailButtonText: "위치 보기",
    shareText: "영업 시간과 대표 정보를 미리 확인하실 수 있습니다.",
  },
  {
    listLabel: "오늘 추천",
    marketingTitle: "오늘 방문하기 좋은 곳",
    tagline: "매장 정보와 대표 메뉴를 바로 확인하세요.",
    detailDescription:
      "영업시간, 위치, 예약 안내, 대표 상품을 한 페이지에 담았습니다.",
    serviceChipTitles: ["대표 메뉴", "예약 정보", "주차 안내"],
    region: "동네 기준",
    contactButtonText: "예약하기",
    detailButtonText: "메뉴 보기",
    shareText: "오늘 방문 가능 여부부터 메뉴까지 한 번에.",
  },
  {
    listLabel: "한 링크 소개",
    marketingTitle: "우리 매장을 쉽게 소개하세요",
    tagline: "고객이 보고 바로 찾아올 수 있는 매장 명함입니다.",
    detailDescription:
      "지도, 연락처, 상품 소개를 연결해 방문 문의까지 이어지게 합니다.",
    serviceChipTitles: ["지도 안내", "연락처", "상품 라인업"],
    region: "로컬 상권",
    contactButtonText: "문의하기",
    detailButtonText: "찾아오는 길",
    shareText: "링크로 매장 분위기와 오시는 길을 공유했습니다.",
  },
  {
    listLabel: "한눈에 정보",
    marketingTitle: "사진보다 먼저 기억되는 매장 정보",
    tagline: "필요한 정보를 보기 쉽게 정리합니다.",
    detailDescription:
      "고객이 궁금해하는 위치, 운영시간, 가격, 예약 방법을 한 번에 보여줍니다.",
    serviceChipTitles: ["가격대", "운영 시간", "예약 방법"],
    region: "지역별 상이 (문의 시 안내)",
    contactButtonText: "문의하기",
    detailButtonText: "FAQ 보기",
    shareText: "가격대와 예약 방법을 놓치지 않았습니다.",
  },
  {
    listLabel: "찾아오기 쉽게",
    marketingTitle: "손님이 길 잃지 않도록",
    tagline: "매장 소개부터 방문 안내까지 이어집니다.",
    detailDescription:
      "링크 하나로 매장의 첫인상을 만들고 고객 방문을 도와줍니다.",
    serviceChipTitles: ["외관 안내", "방문 순서", "문의 채널"],
    region: "동네 거점",
    contactButtonText: "방문 안내 받기",
    detailButtonText: "지도 열기",
    shareText: "외관 안내와 찾아오는 길을 링크에 모았습니다.",
  },
];

export function phrasesFor(kind: SampleFlowKind, sub: SampleSubcategoryId): SamplePhrase[] {
  switch (kind) {
    case "personal":
      return PERSONAL_SAMPLE_PHRASES;
    case "business":
      if (sub === "interior") return INTERIOR_SAMPLE_PHRASES;
      if (sub === "furniture") return FURNITURE_SAMPLE_PHRASES;
      if (sub === "cleaning") return GENERIC_CLEAN;
      if (sub === "beauty") return GENERIC_BEAUTY;
      if (sub === "education") return GENERIC_EDUCATION;
      return PERSONAL_SAMPLE_PHRASES;
    case "store":
      return STORE_SAMPLE_PHRASES;
    default:
      return PERSONAL_SAMPLE_PHRASES;
  }
}

export function heroBackgroundFor(kind: SampleFlowKind, sub: SampleSubcategoryId): string | null {
  if (kind === "personal") return BG_PROFILE;
  if (kind === "business") {
    const map: Partial<Record<BusinessSubcategoryId, string>> = {
      interior: BG_INTERIOR,
      furniture: BG_FURNITURE,
      cleaning: BG_CLEAN,
      beauty: BG_BEAUTY,
      education: BG_EDU,
    };
    return map[sub as BusinessSubcategoryId] ?? BG_INTERIOR;
  }
  if (kind === "store") {
    const map: Partial<Record<StoreSubcategoryId, string>> = {
      cafe: BG_CAFE,
      restaurant: BG_RESTAURANT,
      workshop: BG_WORKSHOP,
      salon: BG_BEAUTY,
      localshop: BG_STORE,
    };
    return map[sub as StoreSubcategoryId] ?? BG_STORE;
  }
  return BG_PROFILE;
}

function roleTitleForPersonal(sub: PersonalSubcategoryId): string {
  const m: Record<PersonalSubcategoryId, string> = {
    instructor: "강사 · 워크숍 진행",
    freelancer: "프리랜서 전문가",
    expert: "분야별 전문가",
    creator: "크리에이터 · 콘텐츠 제작",
    counselor: "상담 전문가",
  };
  return m[sub] ?? "전문가";
}

function slugSuffix(base: string): string {
  const s = slugify(base.trim()) || "card";
  return s.length >= 2 ? `${s}-${Math.floor(Math.random() * 899 + 100)}` : `card-${Date.now().toString(36).slice(-4)}`;
}

function servicesFromPhrase(p: SamplePhrase): CardEditorDraft["services"] {
  return p.serviceChipTitles.map((title) => ({
    title,
    body: `${title} 안내 및 상세 상담을 도와 드립니다.`,
  }));
}

export type SampleLinkSeed = { contactLabel: string; detailLabel: string; tel: string };

export type SampleLinkRow = { id: string; label: string; type: "phone" | "website"; url: string };

export function seedLinkTemplates(seed: SampleLinkSeed): SampleLinkRow[] {
  const digits = seed.tel.replace(/\D/g, "");
  return [
    {
      id: crypto.randomUUID(),
      label: seed.contactLabel,
      type: "phone",
      url: `tel:${digits}`,
    },
    {
      id: crypto.randomUUID(),
      label: seed.detailLabel,
      type: "website",
      url: "#services",
    },
  ];
}

export function previewCardTypeFor(kind: SampleFlowKind): PreviewCardType {
  if (kind === "personal") return "person";
  if (kind === "business") return "store";
  return "location";
}

export interface ApplySampleOptions {
  kind: SampleFlowKind;
  subcategoryId: SampleSubcategoryId;
  phrase: SamplePhrase;
  categoryLabel: string;
  industryLabel: string;
  emailFallback: string;
}

export function applyCardSamplePhrase(opts: ApplySampleOptions): CardEditorDraft {
  const { kind, subcategoryId, phrase, categoryLabel, industryLabel, emailFallback } = opts;
  const card_type = previewCardTypeFor(kind);
  const bgUrl = heroBackgroundFor(kind, subcategoryId);
  const svc = servicesFromPhrase(phrase);
  while (svc.length < 3) svc.push({ title: "안내", body: "아래 버튼으로 문의 주세요." });

  const draftBase = createEmptyDraft({
    email: emailFallback,
    card_type,
    theme: kind === "store" ? "slate" : "navy",
    industry: industryLabel,
    marketing_title: phrase.marketingTitle,
    tagline: phrase.tagline,
    intro: phrase.detailDescription,
    trust_metric: phrase.serviceChipTitles.join(" · "),
    phone: SAMPLE_PHONES,
    is_public: true,
    brand_image_url: bgUrl,
    imageUrl: bgUrl,
    brand_image_legacy_object_position: "center",
    gallery_urls_raw: "",
    brand_image_natural_width: null,
    brand_image_natural_height: null,
    brand_image_zoom: 1,
    brand_image_pan_x: 0,
    brand_image_pan_y: 0,
    trust_testimonials: [
      { quote: phrase.shareText, person_name: "", role: categoryLabel },
      { quote: "", person_name: "", role: "" },
    ],
    services: svc.slice(0, 5),
  });

  if (kind === "personal") {
    const sub = subcategoryId as PersonalSubcategoryId;
    return {
      ...draftBase,
      brand_name: "",
      person_name: "김민수",
      job_title: roleTitleForPersonal(sub),
      address: phrase.region,
      slug: slugSuffix(categoryLabel || "개인형"),
      website_url: "",
    };
  }

  const representative = "김민수";

  if (kind === "business") {
    const brand =
      industryLabel === "인테리어"
        ? "민노 인테리어"
        : `${industryLabel.replace(/\//g, "·").slice(0, 14)} 스튜디오`;
    return {
      ...draftBase,
      brand_name: brand,
      person_name: representative,
      job_title:
        industryLabel === "교육/컨설팅"
          ? "교육·컨설팅 디렉터"
          : `${(industryLabel.split("/")[0] ?? industryLabel).trim()} 담당`,
      address: phrase.region,
      slug: slugSuffix(brand),
      website_url: "",
    };
  }

  const storeMeta = SAMPLE_STORE_CATEGORIES.find((x) => x.id === subcategoryId);
  const storeLabel = storeMeta?.label ?? "매장";
  const brands: Partial<Record<StoreSubcategoryId, string>> = {
    cafe: "옆집 카페",
    restaurant: "골목 한식당",
    workshop: "손글씨 공방",
    salon: "동네 헤어살롱",
    localshop: "동네 라이프샵",
  };
  const b = brands[subcategoryId as StoreSubcategoryId] ?? `${storeLabel} 매장`;
  const titles: Partial<Record<StoreSubcategoryId, string>> = {
    cafe: "시그니처 · 계절 음료",
    restaurant: "점심 · 저녁 대표 코스",
    workshop: "체험 · 맞춤 제작",
    salon: "헤어 · 케어",
    localshop: "대표 상품 · 추천 라인",
  };

  return {
    ...draftBase,
    brand_name: b,
    person_name: representative,
    job_title: titles[subcategoryId as StoreSubcategoryId] ?? "대표 메뉴 · 상품",
    address: `평일 11:00 - 20:00 (예시 일정)\n${phrase.region} 인근 거리`,
    slug: slugSuffix(b),
    website_url: "",
  };
}
