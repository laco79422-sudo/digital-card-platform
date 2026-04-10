/** 무료 구조 프리뷰 — 입력 기반 자동 조합(템플릿). 서버 없이 클라이언트에서 생성 */

export type StructureGoal = "promo" | "inquiry" | "sales";

export type StructureBlueprintInput = {
  industry: string;
  goal: StructureGoal;
  concern: string;
};

export type StructureButtonSuggestion = {
  label: string;
  hint: string;
};

export type StructureBlueprintResult = {
  headline: string;
  intro: string;
  buttons: StructureButtonSuggestion[];
  shareTips: string[];
  promotionDirection: string;
};

function trimIndustry(raw: string): string {
  const t = raw.trim();
  return t.length > 0 ? t : "당신의 업종";
}

export function buildStructureBlueprint(input: StructureBlueprintInput): StructureBlueprintResult {
  const industry = trimIndustry(input.industry);
  const concern = input.concern.trim();
  const concernLine =
    concern.length > 0
      ? `지금 말씀해 주신 고민—「${concern.slice(0, 120)}${concern.length > 120 ? "…" : ""}」—을 반영해 보면,`
      : "지금 고민을 데이터로 남기고,";

  let headline: string;
  let intro: string;
  let promotionDirection: string;

  switch (input.goal) {
    case "promo":
      headline = `${industry}를 한눈에 알리는 헤드라인 — 링크만 보내도 기억에 남게`;
      intro = `${concernLine} 먼저 **누구인지·무엇을 잘하는지**가 한 문장으로 읽히게 만드는 게 첫 단계예요. 방문자가 3초 안에 “아, 이 사람이구나”라고 느끼도록 소개와 시각 요소를 맞춥니다.`;
      promotionDirection = `홍보 목적이라면 검색·SNS·명함 링크가 모두 같은 메시지를 가리키게 정리하는 것이 중요합니다. ${industry}에 맞는 키워드 한 줄과, 고객이 바로 행동할 버튼(상담·샘플·예약) 순서를 제안한 뒤, 블로그·쇼츠로 그 메시지를 반복 노출해 유입을 넓힙니다.`;
      break;
    case "inquiry":
      headline = `${industry} 상담·문의로 바로 연결되는 디지털 명함`;
      intro = `${concernLine} 연락까지의 **마찰을 줄이는 것**이 핵심이에요. 카카오·전화·예약 중 어디로 보낼지 한 화면에 모아 두고, 방문자가 “문의해도 되겠다”고 느끼는 문장과 신뢰 요소(후기·수치)를 배치합니다.`;
      promotionDirection = `문의 중심이면 공유 메시지는 “한 번 눌러 상담” 톤이 잘 맞습니다. 명함 링크 → 짧은 소개 글(블로그) → 쇼츠로 동일한 CTA를 반복해, 들어온 사람이 같은 버튼을 누르게 만드는 구조를 짭니다.`;
      break;
    case "sales":
      headline = `${industry} · 신뢰부터 문의까지 한 번에 담는 명함 구조`;
      intro = `${concernLine} **신뢰(왜 나인가)**와 **다음 행동(지금 무엇을 할까)**를 한 흐름으로 연결합니다. 서비스·가격·사례가 한눈에 들어오게 배치하고, 마지막에만 구매·예약·견적 요청을 두어 이탈을 줄입니다.`;
      promotionDirection = `판매·계약이 목표면 유입 이후 첫 화면에서 이야기가 끊기지 않게 해야 합니다. 명함 → 블로그(상세 설득) → 영상(감성·증거) 순으로 깊이를 더하고, 모든 채널에서 같은 제안과 연락처로 수렴시키는 “깔때기” 구조를 제안합니다.`;
      break;
    default:
      headline = `${industry}를 위한 맞춤 명함 구조`;
      intro = `${concernLine} 목표에 맞게 헤드라인·소개·버튼 순서를 조정합니다.`;
      promotionDirection = "채널별로 메시지를 맞추되, 결국 같은 명함 링크로 모이게 설계합니다.";
  }

  const buttons: StructureButtonSuggestion[] =
    input.goal === "promo"
      ? [
          { label: "포트폴리오 보기", hint: "첫 신뢰 — 무엇을 해왔는지" },
          { label: "카카오로 문의", hint: "마찰 없이 연결" },
          { label: "최신 소식·이벤트", hint: "재방문 이유" },
        ]
      : input.goal === "inquiry"
        ? [
            { label: "1:1 상담 요청", hint: "메인 CTA" },
            { label: "자주 묻는 질문", hint: "망설임 감소" },
            { label: "전화·예약", hint: "바로 연결" },
          ]
        : [
            { label: "견적·상담 신청", hint: "전환 1순위" },
            { label: "서비스·가격", hint: "비교·설득" },
            { label: "고객 사례", hint: "사회적 증거" },
          ];

  const shareTips =
    input.goal === "promo"
      ? [
          "카카오톡: 짧은 한 줄 + 명함 링크 (스팸 느낌 나지 않게)",
          "인스타/스레드: 프로필 링크 고정 + 게시물마다 같은 문구로 반복",
          "이메일 서명·PDF 명함: QR과 웹 주소 병기",
        ]
      : input.goal === "inquiry"
        ? [
            "첫 메시지는 ‘부담 없이 질문’ 톤 + 링크 한 개만",
            "블로그 첫 문단에 명함 링크 삽입해 검색 유입 시 바로 문의로",
            "쇼츠 끝 화면에 동일한 문의 버튼 문구 고정",
          ]
        : [
            "가격·혜택은 명함에서 한 번만 명확히, 세부는 블로그로",
            "영상은 ‘문제 공감 → 해결 → CTA’ 3단 구조",
            "모든 채널에서 같은 ‘다음 한 걸음’만 제시",
          ];

  return {
    headline,
    intro: intro.replace(/\*\*(.+?)\*\*/g, "$1"),
    buttons,
    shareTips,
    promotionDirection,
  };
}
