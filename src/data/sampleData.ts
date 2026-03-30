import type {
  BusinessCard,
  CardClick,
  CardLink,
  CardView,
  CreatorProfile,
  MainBanner,
  Payment,
  ServiceApplication,
  ServiceRequest,
  Subscription,
  User,
} from "@/types/domain";

const now = new Date().toISOString();

export const SAMPLE_USERS: User[] = [
  {
    id: "user-client-1",
    role: "client",
    name: "김민준",
    email: "minjun@sample.co.kr",
    phone: "010-1234-5678",
    avatar_url: null,
    created_at: now,
  },
  {
    id: "user-creator-1",
    role: "creator",
    name: "이서연",
    email: "seoyeon.creator@gmail.com",
    phone: "010-9876-5432",
    avatar_url: null,
    created_at: now,
  },
  {
    id: "user-admin-1",
    role: "admin",
    name: "플랫폼 관리자",
    email: "admin@bizcardconnect.app",
    phone: null,
    avatar_url: null,
    created_at: now,
  },
  {
    id: "user-creator-2",
    role: "creator",
    name: "최우진",
    email: "woojin.video@gmail.com",
    phone: null,
    avatar_url: null,
    created_at: now,
  },
  {
    id: "user-creator-3",
    role: "creator",
    name: "한지민",
    email: "jimin.short@gmail.com",
    phone: null,
    avatar_url: null,
    created_at: now,
  },
];

export const SAMPLE_CARDS: BusinessCard[] = [
  {
    id: "card-1",
    user_id: "user-client-1",
    slug: "harbor-marketing",
    brand_name: "하버 마케팅",
    person_name: "김민준",
    job_title: "대표 · 퍼포먼스 마케터",
    intro:
      "B2B 리드 제너레이션과 콘텐츠 기반 세일즈 퍼널을 설계합니다. 명함으로 상담 예약부터 제작 의뢰까지 연결해 보세요.",
    phone: "010-1234-5678",
    email: "minjun@sample.co.kr",
    website_url: "https://harbor-marketing.example",
    blog_url: "https://blog.example/harbor",
    youtube_url: "https://youtube.com/@harbor",
    kakao_url: "https://open.kakao.com/o/sample",
    theme: "navy",
    is_public: true,
    created_at: now,
  },
  {
    id: "card-2",
    user_id: "user-client-1",
    slug: "studio-vertex",
    brand_name: "스튜디오 버텍스",
    person_name: "박지훈",
    job_title: "크리에이티브 디렉터",
    intro: "브랜드 필름, 숏폼, 썸네일 아트 디렉션까지. 팀 단위 제작 파트너를 찾고 계신가요?",
    phone: "02-555-0101",
    email: "hello@vertex.studio",
    website_url: "https://vertex.studio",
    blog_url: null,
    youtube_url: "https://youtube.com/@vertexstudio",
    kakao_url: null,
    theme: "midnight",
    is_public: true,
    created_at: now,
  },
];

export const SAMPLE_CARD_LINKS: CardLink[] = [
  {
    id: "lnk-1",
    card_id: "card-1",
    label: "회사 웹사이트",
    type: "website",
    url: "https://harbor-marketing.example",
    sort_order: 0,
  },
  {
    id: "lnk-2",
    card_id: "card-1",
    label: "블로그 의뢰 문의",
    type: "custom",
    url: "#request-blog",
    sort_order: 1,
  },
  {
    id: "lnk-3",
    card_id: "card-1",
    label: "유튜브 채널",
    type: "youtube",
    url: "https://youtube.com/@harbor",
    sort_order: 2,
  },
  {
    id: "lnk-4",
    card_id: "card-2",
    label: "포트폴리오 PDF",
    type: "custom",
    url: "https://vertex.studio/work",
    sort_order: 0,
  },
];

export const SAMPLE_CREATORS: CreatorProfile[] = [
  {
    id: "creator-prof-1",
    user_id: "user-creator-1",
    creator_type: "blog_writer",
    intro: "IT·핀테크 전문 브랜디드 기사, SEO 롱폼 200편 이상. 톤앤매너 가이드 준수.",
    portfolio_url: "https://notion.so/sample-portfolio",
    portfolio_items_json: ["핀테크 시리즈 A 라운드 보도자료", "SaaS 온보딩 블로그 시리즈"],
    min_price: 350000,
    region: "서울 / 원격",
    categories_json: ["B2B", "핀테크", "SEO"],
    is_verified: true,
    created_at: now,
    display_name: "이서연",
  },
  {
    id: "creator-prof-2",
    user_id: "user-creator-2",
    creator_type: "youtube_producer",
    intro: "기업 인터뷰·제품 런칭 필름. 촬영·편집·자막·썸네일 원스톱.",
    portfolio_url: "https://vimeo.com/sample",
    portfolio_items_json: ["Series B 발표 영상", "제품 데모 90초 스팟"],
    min_price: 1200000,
    region: "경기 / 출장",
    categories_json: ["기업영상", "런칭"],
    is_verified: true,
    created_at: now,
    display_name: "최우진",
  },
  {
    id: "creator-prof-3",
    user_id: "user-creator-3",
    creator_type: "shortform_editor",
    intro: "릴스·쇼츠 리텐션 편집, 자막 훅 최적화. 주당 15편 이상 가능.",
    portfolio_url: null,
    portfolio_items_json: ["뷰티 브랜드 쇼츠 30일 캠페인"],
    min_price: 80000,
    region: "전국 원격",
    categories_json: ["숏폼", "뷰티"],
    is_verified: false,
    created_at: now,
    display_name: "한지민",
  },
];

export const SAMPLE_REQUESTS: ServiceRequest[] = [
  {
    id: "req-1",
    client_user_id: "user-client-1",
    request_type: "blog",
    title: "클라우드 ERP 도입 사례 블로그 4편",
    description:
      "중견 제조사 타깃, 리드 폼 연동 CTA 포함. 인터뷰 소스는 내부에서 제공합니다.",
    budget_min: 1200000,
    budget_max: 2000000,
    deadline: "2026-05-01",
    status: "open",
    created_at: now,
    client_name: "김민준",
  },
  {
    id: "req-2",
    client_user_id: "user-client-1",
    request_type: "youtube",
    title: "신제품 런칭 2분 인터뷰 필름",
    description: "서울 강남 스튜디오 촬영 1일, 자막 KR/EN, 16:9 및 9:16 버전.",
    budget_min: 2500000,
    budget_max: 4000000,
    deadline: "2026-04-20",
    status: "matched",
    created_at: now,
    client_name: "김민준",
  },
];

export const SAMPLE_APPLICATIONS: ServiceApplication[] = [
  {
    id: "app-1",
    request_id: "req-1",
    creator_user_id: "user-creator-1",
    proposal_text:
      "제조 DX 레퍼런스 6건 작성 경험이 있습니다. 2주 내 1·2편 퍼스트 드래프트 가능합니다.",
    proposed_price: 1600000,
    estimated_days: 21,
    status: "pending",
    created_at: now,
    creator_name: "이서연",
    request_title: "클라우드 ERP 도입 사례 블로그 4편",
  },
];

export const SAMPLE_VIEWS: CardView[] = Array.from({ length: 14 }).map((_, i) => ({
  id: `view-${i}`,
  card_id: "card-1",
  viewed_at: new Date(Date.now() - i * 86400000).toISOString(),
  referrer: i % 3 === 0 ? "instagram" : "direct",
  user_agent: "Mozilla/5.0",
}));

export const SAMPLE_CLICKS: CardClick[] = [
  { id: "clk-1", card_id: "card-1", action_type: "website", clicked_at: now },
  { id: "clk-2", card_id: "card-1", action_type: "youtube", clicked_at: now },
];

export const SAMPLE_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-1",
    user_id: "user-client-1",
    plan_name: "Pro",
    status: "active",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
  },
];

export const SAMPLE_PAYMENTS: Payment[] = [
  {
    id: "pay-1",
    user_id: "user-client-1",
    amount: 59000,
    payment_type: "subscription",
    status: "completed",
    created_at: now,
  },
  {
    id: "pay-2",
    user_id: "user-creator-1",
    amount: 19000,
    payment_type: "creator_membership",
    status: "completed",
    created_at: now,
  },
];

export const SAMPLE_BANNERS: MainBanner[] = [
  {
    id: "bnr-1",
    title: "명함 하나로, 고객 연결부터 콘텐츠 제작 의뢰까지",
    subtitle: "BizCard Connect에서 블로그·유튜브·숏폼 제작자를 만나보세요.",
    cta_label: "무료로 시작하기",
    cta_href: "/signup",
    sort_order: 0,
  },
];

export const FEATURED_CREATOR_IDS = ["creator-prof-1", "creator-prof-2", "creator-prof-3"];

export const LANDING_TESTIMONIALS = [
  {
    quote: "명함 링크만 보냈는데 상담 예약이 눈에 띄게 늘었습니다. 의뢰도 같은 화면에서 관리돼요.",
    name: "정다은",
    role: "스타트업 CMO",
  },
  {
    quote: "제작자 풀이 넓어서 브리핑 후 바로 매칭됐습니다. 수수료 구조도 투명했습니다.",
    name: "오현석",
    role: "에이전시 대표",
  },
  {
    quote: "Creator Plus 덕분에 의뢰 알림이 정리되고, 포트폴리오 노출이 좋아졌습니다.",
    name: "이서연",
    role: "블로그 작가",
  },
];

export const LANDING_FAQ = [
  {
    q: "무료로 명함을 몇 개까지 만들 수 있나요?",
    a: "Free 플랜에서는 공개 명함 1개와 기본 통계를 제공합니다. 팀 단위는 Business 플랜을 확인해 주세요.",
  },
  {
    q: "의뢰 매칭 후 결제는 어떻게 하나요?",
    a: "플랫폼에서 제작자를 선택하면 안전결제 플로우로 연결됩니다. (데모에서는 UI만 제공됩니다.)",
  },
  {
    q: "Supabase만 연결하면 실데이터로 바뀌나요?",
    a: "환경 변수에 프로젝트 URL과 anon key를 넣으면 Auth와 DB 연동 레이어를 확장할 수 있습니다.",
  },
];
