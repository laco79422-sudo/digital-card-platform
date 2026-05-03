/** 스키마: 업종 선택 결과(일반·린코 소속 구분) */

export type LinkoMemberIndustryType =
  | "card_design_expert"
  | "blog_expert"
  | "video_expert"
  | "program_expert"
  | "helper_partner"
  | "teacher"
  | "ai_training_teacher";

export type CardIndustryPayload =
  | { group: "general"; type: string; label: string }
  | { group: "linko_member"; type: LinkoMemberIndustryType; label: string };

export function parseCardIndustryPayload(raw: unknown): CardIndustryPayload | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const group = o.group;
  const type = o.type;
  const label = o.label;
  if (group !== "general" && group !== "linko_member") return null;
  if (typeof type !== "string" || !type.trim()) return null;
  if (typeof label !== "string" || !label.trim()) return null;
  if (group === "general") return { group: "general", type: type.trim(), label: label.trim() };
  const allowed: LinkoMemberIndustryType[] = [
    "card_design_expert",
    "blog_expert",
    "video_expert",
    "program_expert",
    "helper_partner",
    "teacher",
    "ai_training_teacher",
  ];
  const t = type.trim() as LinkoMemberIndustryType;
  if (!allowed.includes(t)) return null;
  return { group: "linko_member", type: t, label: label.trim() };
}
