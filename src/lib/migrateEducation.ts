import type { EducationApplication, EducationCategory, TeacherApplication } from "@/types/domain";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** 레거시 교육 신청(interest 필드) → education_applications 형태 */
export function migrateEducationApplicationRow(row: unknown): EducationApplication {
  if (!isRecord(row)) {
    return {
      id: crypto.randomUUID(),
      education_id: null,
      user_id: null,
      name: "",
      phone: "",
      email: "",
      preferred_course_label: "교육 신청",
      participation_method: "online",
      message: "",
      status: "applied",
      created_at: new Date().toISOString(),
    };
  }
  if ("interest" in row) {
    const interest = row.interest;
    const label =
      interest === "blog"
        ? "블로그 교육 (일반 신청)"
        : interest === "video"
          ? "영상 교육 (일반 신청)"
          : "블로그·영상 교육 (일반 신청)";
    return {
      id: String(row.id ?? crypto.randomUUID()),
      education_id: typeof row.education_id === "string" ? row.education_id : null,
      user_id: typeof row.user_id === "string" ? row.user_id : null,
      name: String(row.name ?? ""),
      phone: String(row.phone ?? ""),
      email: String(row.email ?? ""),
      preferred_course_label: label,
      participation_method: row.participation_method === "offline" ? "offline" : "online",
      message: String(row.message ?? ""),
      status: (row.status as EducationApplication["status"]) ?? "applied",
      created_at: String(row.created_at ?? new Date().toISOString()),
    };
  }
  if (typeof row.preferred_course_label === "string") {
    return row as unknown as EducationApplication;
  }
  return {
    id: String(row.id ?? crypto.randomUUID()),
    education_id: typeof row.education_id === "string" ? row.education_id : null,
    user_id: typeof row.user_id === "string" ? row.user_id : null,
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    preferred_course_label: "교육 신청",
    participation_method: row.participation_method === "offline" ? "offline" : "online",
    message: String(row.message ?? ""),
    status: (row.status as EducationApplication["status"]) ?? "applied",
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

const TEACHER_APP_STATUSES = new Set<TeacherApplication["status"]>(["pending", "reviewing", "approved", "rejected"]);

function normalizeCategories(v: unknown): EducationCategory[] {
  if (!Array.isArray(v)) return ["blog"];
  const allowed: EducationCategory[] = ["card_design", "blog", "video", "program", "ai_creation"];
  const out = v.filter((x): x is EducationCategory => allowed.includes(x as EducationCategory));
  return out.length ? out : ["blog"];
}

/** 레거시 강사 폼 → teacher_applications 형태 */
export function migrateTeacherApplicationRow(row: unknown): TeacherApplication {
  if (!isRecord(row)) {
    return {
      id: crypto.randomUUID(),
      user_id: null,
      name: "",
      phone: "",
      email: "",
      region: "",
      available_method: "both",
      categories: ["blog"],
      topics: "",
      career: "",
      portfolio_url: "",
      desired_time: "",
      desired_price: "",
      introduction: "",
      attachment_url: null,
      status: "pending",
      created_at: new Date().toISOString(),
      type_facets_json: null,
    };
  }
  const st = row.status;
  if (Array.isArray(row.categories) && typeof st === "string" && TEACHER_APP_STATUSES.has(st as TeacherApplication["status"])) {
    return {
      ...row,
      categories: normalizeCategories(row.categories),
    } as TeacherApplication;
  }
  return {
    id: String(row.id ?? crypto.randomUUID()),
    user_id: typeof row.user_id === "string" ? row.user_id : null,
    name: String(row.name ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    region: "",
    available_method: "both",
    categories: ["blog"],
    topics: String(row.lecture_topics ?? row.topics ?? ""),
    career: String(row.experience ?? row.career ?? ""),
    portfolio_url: String(row.portfolio_url ?? ""),
    desired_time: "",
    desired_price: "",
    introduction: "",
    attachment_url: typeof row.attachment_url === "string" ? row.attachment_url : null,
    status: "pending",
    created_at: String(row.created_at ?? new Date().toISOString()),
    type_facets_json: { legacy_specialty: row.specialty ?? null },
  };
}
