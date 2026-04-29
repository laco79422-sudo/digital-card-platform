import type { BusinessCard, CardLink } from "@/types/domain";

export const INSTANT_GUEST_USER_ID = "__linko_instant_guest__";

function slugifyLocal(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-가-힣]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function parseContactInput(raw: string): { phone: string | null; email: string | null } {
  const t = raw.trim();
  if (!t) return { phone: null, email: null };
  if (/\S+@\S+\.\S+/.test(t)) return { phone: null, email: t };
  return { phone: t.replace(/\s/g, ""), email: null };
}

export function uniqueSlugForCards(desiredBase: string, cards: BusinessCard[]): string {
  const taken = new Set(cards.map((c) => c.slug));
  let base = slugifyLocal(desiredBase);
  if (!base) base = "card";
  if (!taken.has(base)) return base;
  for (let i = 0; i < 24; i++) {
    const suffix = Math.random().toString(36).slice(2, 7);
    const cand = `${base}-${suffix}`;
    if (!taken.has(cand)) return cand;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function buildQuickShareCard(opts: {
  cardId: string;
  slug: string;
  user_id: string;
  person_name: string;
  job_title: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}): BusinessCard {
  const intro = `${opts.person_name} · ${opts.job_title}의 디지털 명함입니다. 연락 주세요.`.slice(0, 500);
  return {
    id: opts.cardId,
    user_id: opts.user_id,
    slug: opts.slug,
    brand_name: opts.person_name.trim(),
    person_name: opts.person_name.trim(),
    job_title: opts.job_title.trim(),
    intro,
    phone: opts.phone,
    email: opts.email,
    website_url: null,
    blog_url: null,
    youtube_url: null,
    kakao_url: null,
    kakao_chat_url: null,
    theme: "navy",
    is_public: true,
    created_at: opts.created_at,
    tagline: `${opts.job_title.trim()} · ${opts.person_name.trim()}`,
  };
}

export function buildInstantCardLinks(cardId: string, phone: string | null, email: string | null): CardLink[] {
  const rows: CardLink[] = [];
  let order = 0;
  if (phone?.trim()) {
    rows.push({
      id: crypto.randomUUID(),
      card_id: cardId,
      label: "전화하기",
      type: "phone",
      url: phone.startsWith("tel:") ? phone : `tel:${phone}`,
      sort_order: order++,
    });
  }
  if (email?.trim()) {
    rows.push({
      id: crypto.randomUUID(),
      card_id: cardId,
      label: "메일 보내기",
      type: "email",
      url: email.startsWith("mailto:") ? email : `mailto:${email}`,
      sort_order: order++,
    });
  }
  if (rows.length === 0) {
    rows.push({
      id: crypto.randomUUID(),
      card_id: cardId,
      label: "연락하기",
      type: "custom",
      url: "#services",
      sort_order: 0,
    });
  }
  return rows;
}
