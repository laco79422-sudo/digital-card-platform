import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";
import type { ZodIssue } from "zod";
import { z } from "zod";

const optionalUrl = z.string().url().or(z.literal(""));

export const cardEditorSubmitSchema = z.object({
  brand_name: z.string().min(1, "브랜드명을 입력하세요"),
  person_name: z.string().min(1, "이름을 입력하세요"),
  job_title: z.string().min(1, "직함을 입력하세요"),
  intro: z.string().min(1, "소개를 입력하세요"),
  slug: z.string().min(2, "공개 주소는 2자 이상이어야 합니다"),
  phone: z.string().optional(),
  email: z.string().email("올바른 이메일 형식이 아닙니다").or(z.literal("")),
  website_url: optionalUrl,
  blog_url: optionalUrl,
  youtube_url: optionalUrl,
  kakao_url: optionalUrl,
  theme: z.enum(["navy", "slate", "midnight"]),
  is_public: z.boolean(),
  tagline: z.string().optional(),
  trust_metric: z.string().optional(),
  trust_testimonials: z
    .array(
      z.object({
        quote: z.string(),
        person_name: z.string(),
        role: z.string(),
      }),
    )
    .length(2),
  gallery_urls_raw: z.string().optional(),
  services: z.array(z.object({ title: z.string(), body: z.string() })).max(5),
  brand_image_url: z.string().nullable().optional(),
  brand_image_frame_ratio: z.string().max(16).optional(),
  brand_image_natural_width: z.number().int().positive().nullable().optional(),
  brand_image_natural_height: z.number().int().positive().nullable().optional(),
  brand_image_zoom: z.number().min(1).max(3).optional(),
  brand_image_pan_x: z.number().min(-1).max(1).optional(),
  brand_image_pan_y: z.number().min(-1).max(1).optional(),
  brand_image_legacy_object_position: z.string().max(48).nullable().optional(),
});

export function parseCardEditorDraft(draft: CardEditorDraft) {
  return cardEditorSubmitSchema.safeParse(draft);
}

export function zodIssuesToFieldErrors(issues: ZodIssue[]): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
}
