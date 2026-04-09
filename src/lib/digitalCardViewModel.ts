import type { BusinessCard, CardLink, DigitalCardServiceLine } from "@/types/domain";

const PLACEHOLDER_GALLERY = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  "https://images.unsplash.com/photo-1600880292203-75761962e213?w=800&q=80",
];

export function effectiveTagline(card: BusinessCard): string {
  const t = card.tagline?.trim();
  if (t) return t;
  const job = card.job_title.trim();
  const brand = card.brand_name.trim();
  return `${job} · ${brand} — 디지털 명함으로 만나는 첫인상`;
}

export function effectiveTrustLine(card: BusinessCard): string {
  const t = card.trust_line?.trim();
  if (t) return t;
  return "문의부터 제안까지 한 흐름으로 연결해 드립니다.";
}

export function galleryImages(card: BusinessCard): string[] {
  const g = card.gallery_urls?.filter((u) => u.trim().length > 0) ?? [];
  if (g.length > 0) return g.slice(0, 6);
  return PLACEHOLDER_GALLERY;
}

export function serviceBlocks(card: BusinessCard): DigitalCardServiceLine[] {
  const s = card.services?.filter((x) => x.title.trim() && x.body.trim()) ?? [];
  if (s.length > 0) return s.slice(0, 5);
  const job = card.job_title.trim() || "전문 서비스";
  return [
    {
      title: `${job} 맞춤 제안`,
      body: "필요에 맞춘 범위와 일정을 먼저 나누고, 투명하게 진행합니다.",
    },
    {
      title: "빠른 소통",
      body: "전화·카카오·메일로 바로 연결되어 놓치는 문의가 없도록 합니다.",
    },
    {
      title: "신뢰 가능한 포트폴리오",
      body: "아래 작업 사진과 채널 링크로 스타일과 톤을 미리 확인해 보세요.",
    },
  ];
}

export type CtaAction = { label: string; href: string; external: boolean };

export type HeroCtaBundle = {
  primary: CtaAction;
  secondary: CtaAction;
  /** 전화번호가 없고 링크가 2개 이상이면 상단 2버튼을 링크 순서로 사용 */
  mode: "from-links" | "legacy";
  primaryLinkType?: CardLink["type"];
  secondaryLinkType?: CardLink["type"];
};

function telHref(phone: string): string {
  const p = phone.replace(/\s/g, "");
  if (p.startsWith("tel:")) return p;
  return `tel:${p}`;
}

function mailHref(email: string): string {
  if (email.startsWith("mailto:")) return email;
  return `mailto:${email}`;
}

export function sortedUsableLinks(links: CardLink[]): CardLink[] {
  return [...links]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((l) => {
      const u = l.url.trim();
      return Boolean(l.label.trim() && u && !u.startsWith("#"));
    });
}

/**
 * Hero 상단 2버튼: 전화번호가 있으면 전화·상담 우선(기존),
 * 없고 등록된 링크가 2개 이상이면 상단 2개 링크(전환형 명함)로 표시합니다.
 */
export function resolveHeroCtas(card: BusinessCard, links: CardLink[]): HeroCtaBundle {
  const usable = sortedUsableLinks(links);
  const useLinkHero = !card.phone?.trim() && usable.length >= 2;

  if (useLinkHero) {
    const a = usable[0];
    const b = usable[1];
    return {
      primary: { label: a.label, href: a.url.trim(), external: true },
      secondary: { label: b.label, href: b.url.trim(), external: true },
      mode: "from-links",
      primaryLinkType: a.type,
      secondaryLinkType: b.type,
    };
  }

  const kakaoLink =
    card.kakao_url?.trim() ||
    links.find((l) => l.type === "kakao")?.url ||
    links.find((l) => /카카오|kakao/i.test(l.label))?.url;

  const primary: CtaAction = card.phone?.trim()
    ? { label: "전화하기", href: telHref(card.phone), external: true }
    : card.email?.trim()
      ? { label: "문의하기", href: mailHref(card.email), external: true }
      : {
          label: "웹사이트",
          href: card.website_url || links.find((l) => l.type === "website")?.url || "#",
          external: true,
        };

  let secondary: CtaAction;
  if (kakaoLink) {
    secondary = { label: "상담하기", href: kakaoLink, external: true };
  } else if (card.email?.trim()) {
    secondary = { label: "상담하기", href: mailHref(card.email), external: true };
  } else {
    const web = card.website_url || links.find((l) => l.type === "website")?.url;
    secondary = web
      ? { label: "상담하기", href: web, external: true }
      : { label: "서비스 보기", href: "#services", external: false };
  }

  return {
    primary,
    secondary,
    mode: "legacy",
    primaryLinkType: card.phone?.trim() ? "phone" : card.email?.trim() ? "email" : "website",
    secondaryLinkType: kakaoLink ? "kakao" : card.email?.trim() ? "email" : "website",
  };
}

/** 하단 sticky: 전화 / 상담 / 문의 */
export function resolveStickyCtas(card: BusinessCard, links: CardLink[]): CtaAction[] {
  const out: CtaAction[] = [];
  if (card.phone?.trim()) {
    out.push({ label: "전화", href: telHref(card.phone), external: true });
  }
  const kakao =
    card.kakao_url?.trim() ||
    links.find((l) => l.type === "kakao")?.url ||
    links.find((l) => /카카오|상담/i.test(l.label))?.url;
  if (kakao) {
    out.push({ label: "상담", href: kakao, external: true });
  }
  if (card.email?.trim()) {
    out.push({ label: "문의", href: mailHref(card.email), external: true });
  }
  if (out.length === 0 && card.website_url) {
    out.push({ label: "웹사이트", href: card.website_url, external: true });
  }
  return out.slice(0, 3);
}

export function seoTitle(card: BusinessCard): string {
  return `${card.person_name} · ${card.brand_name} | ${card.job_title} 디지털 명함`;
}

export function seoDescription(card: BusinessCard): string {
  const line = effectiveTagline(card);
  const intro = card.intro.trim().slice(0, 140);
  return `${line} ${intro}`.trim().slice(0, 200);
}
