import type { CreatorProfile, CreatorType } from "@/types/domain";

/** 구 스토어 타입 문자열을 신규 표준으로 교정합니다 */
const LEGACY_CREATOR_TYPES: Record<string, CreatorType> = {
  blog_writer: "blog",
  youtube_producer: "video",
  shortform_editor: "video",
  thumbnail_designer: "card_design",
};

export function migrateCreatorProfileRow(c: CreatorProfile): CreatorProfile {
  const key = String(c.creator_type);
  const next = LEGACY_CREATOR_TYPES[key];
  return next ? { ...c, creator_type: next } : c;
}
