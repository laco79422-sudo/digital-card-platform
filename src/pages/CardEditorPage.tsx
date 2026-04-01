import { DigitalCardPublicView } from "@/components/digital-card/DigitalCardPublicView";
import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { brandCta } from "@/lib/brand";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { getLinksForCard, slugify, useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard, CardLink, CardLinkType } from "@/types/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const optionalUrl = z.string().url().or(z.literal(""));

const serviceLineSchema = z.object({
  title: z.string(),
  body: z.string(),
});

const schema = z.object({
  brand_name: z.string().min(1, "브랜드명을 입력하세요"),
  person_name: z.string().min(1),
  job_title: z.string().min(1),
  intro: z.string().min(1),
  slug: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().or(z.literal("")),
  website_url: optionalUrl,
  blog_url: optionalUrl,
  youtube_url: optionalUrl,
  kakao_url: optionalUrl,
  theme: z.enum(["navy", "slate", "midnight"]),
  is_public: z.enum(["true", "false"]),
  tagline: z.string().optional(),
  trust_line: z.string().optional(),
  gallery_urls_raw: z.string().optional(),
  services: z.array(serviceLineSchema).max(5),
});

type FormValues = z.infer<typeof schema>;

type LinkRow = { id: string; label: string; type: CardLinkType; url: string };

function mapLinksToRows(links: CardLink[]): LinkRow[] {
  if (!links.length) {
    return [{ id: crypto.randomUUID(), label: "웹사이트", type: "website", url: "https://" }];
  }
  return links.map((l) => ({
    id: l.id,
    label: l.label,
    type: l.type,
    url: l.url,
  }));
}

function defaultServiceRows(existing: BusinessCard | undefined): { title: string; body: string }[] {
  const s = existing?.services?.length ? [...existing.services] : [];
  while (s.length < 3) s.push({ title: "", body: "" });
  return s.slice(0, 5);
}

export function CardEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardLinks = useAppDataStore((s) => s.cardLinks);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const setCardLinks = useAppDataStore((s) => s.setCardLinks);

  const isNew = !id || id === "new";
  const existing = useMemo(
    () => (!isNew && id ? businessCards.find((c) => c.id === id) : undefined),
    [businessCards, id, isNew],
  );

  const existingLinks = useMemo(() => {
    if (!existing) return [];
    return getLinksForCard(existing.id, cardLinks);
  }, [cardLinks, existing]);

  const defaultValues: FormValues = useMemo(() => {
    if (existing) {
      return {
        brand_name: existing.brand_name,
        person_name: existing.person_name,
        job_title: existing.job_title,
        intro: existing.intro,
        slug: existing.slug,
        phone: existing.phone ?? "",
        email: existing.email ?? "",
        website_url: existing.website_url ?? "",
        blog_url: existing.blog_url ?? "",
        youtube_url: existing.youtube_url ?? "",
        kakao_url: existing.kakao_url ?? "",
        theme: existing.theme,
        is_public: existing.is_public ? "true" : "false",
        tagline: existing.tagline ?? "",
        trust_line: existing.trust_line ?? "",
        gallery_urls_raw: existing.gallery_urls?.join("\n") ?? "",
        services: defaultServiceRows(existing),
      };
    }
    return {
      brand_name: "",
      person_name: user?.name ?? "",
      job_title: "",
      intro: "",
      slug: "",
      phone: "",
      email: user?.email ?? "",
      website_url: "",
      blog_url: "",
      youtube_url: "",
      kakao_url: "",
      theme: "navy",
      is_public: "true",
      tagline: "",
      trust_line: "",
      gallery_urls_raw: "",
      services: defaultServiceRows(undefined),
    };
  }, [existing, user]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control,
    name: "services",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const [linkRows, setLinkRows] = useState<LinkRow[]>(() => mapLinksToRows(existingLinks));

  useEffect(() => {
    setLinkRows(mapLinksToRows(existingLinks));
  }, [existing?.id]);

  const brandWatch = watch("brand_name");
  const w = watch();

  const previewCard: BusinessCard = {
    id: existing?.id ?? "preview",
    user_id: user?.id ?? "preview",
    slug: w.slug?.trim() || "preview",
    brand_name: w.brand_name?.trim() || "브랜드명",
    person_name: w.person_name?.trim() || "이름",
    job_title: w.job_title?.trim() || "직함",
    intro: w.intro?.trim() || "소개 문구가 여기에 표시됩니다.",
    phone: w.phone?.trim() || null,
    email: w.email?.trim() || null,
    website_url: w.website_url?.trim() || null,
    blog_url: w.blog_url?.trim() || null,
    youtube_url: w.youtube_url?.trim() || null,
    kakao_url: w.kakao_url?.trim() || null,
    theme: w.theme,
    is_public: w.is_public === "true",
    created_at: existing?.created_at ?? new Date().toISOString(),
    tagline: w.tagline?.trim() || null,
    trust_line: w.trust_line?.trim() || null,
    gallery_urls:
      w.gallery_urls_raw
        ?.split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0) ?? null,
    services:
      (w.services ?? []).filter((s) => s.title.trim() && s.body.trim()).length > 0
        ? (w.services ?? []).filter((s) => s.title.trim() && s.body.trim())
        : null,
  };

  const previewLinks: CardLink[] = linkRows
    .filter((r) => r.label.trim() && r.url.trim())
    .map((r, i) => ({
      id: r.id,
      card_id: "preview",
      label: r.label,
      type: r.type,
      url: r.url,
      sort_order: i,
    }));

  const onSlugFromBrand = () => {
    const s = slugify(brandWatch || "my-card");
    if (s) setValue("slug", s);
  };

  const onSave = handleSubmit(async (values) => {
    if (!user) return;
    const cardId = existing?.id ?? crypto.randomUUID();
    const galleryList =
      values.gallery_urls_raw
        ?.split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0) ?? [];
    const serviceList = values.services.filter((s) => s.title.trim() && s.body.trim());

    const card: BusinessCard = {
      id: cardId,
      user_id: user.id,
      slug: values.slug.trim(),
      brand_name: values.brand_name,
      person_name: values.person_name,
      job_title: values.job_title,
      intro: values.intro,
      phone: values.phone || null,
      email: values.email || null,
      website_url: values.website_url || null,
      blog_url: values.blog_url || null,
      youtube_url: values.youtube_url || null,
      kakao_url: values.kakao_url || null,
      theme: values.theme,
      is_public: values.is_public === "true",
      created_at: existing?.created_at ?? new Date().toISOString(),
      tagline: values.tagline?.trim() || null,
      trust_line: values.trust_line?.trim() || null,
      gallery_urls: galleryList.length > 0 ? galleryList : null,
      services: serviceList.length > 0 ? serviceList : null,
    };
    upsertBusinessCard(card);
    const links: CardLink[] = linkRows
      .filter((r) => r.label && r.url)
      .map((r, i) => ({
        id: r.id,
        card_id: cardId,
        label: r.label,
        type: r.type,
        url: r.url,
        sort_order: i,
      }));
    const finalLinks: CardLink[] =
      links.length > 0
        ? links
        : [
            {
              id: crypto.randomUUID(),
              card_id: cardId,
              label: "웹사이트",
              type: "website",
              url: values.website_url || "https://example.com",
              sort_order: 0,
            },
          ];
    setCardLinks(cardId, finalLinks);
    navigate("/cards");
  });

  return (
    <div className={cn(layout.pageEditor, "py-10 sm:py-12")}>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
          {isNew ? brandCta.createDigitalCard : "명함 수정하기"}
        </h1>
        <Link
          to="/cards"
          className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-brand-700"
        >
          목록으로
        </Link>
      </div>

      {isNew ? (
        <div className="mb-10 space-y-4 text-center sm:mb-12">
          <p className="mx-auto max-w-2xl break-keep text-balance text-base font-medium leading-relaxed text-slate-800 sm:text-lg">
            나를 소개하는 가장 쉬운 방법, 린코 디지털 명함
          </p>
          <p className="mx-auto max-w-2xl break-keep text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
            한 번 만들면 링크로 퍼지는 나만의 디지털 명함
          </p>
          <p className="mx-auto max-w-xl break-keep text-balance text-sm font-medium leading-relaxed text-brand-800 sm:text-base">
            이름을 남기는 명함에서, 고객과 연결되는 명함으로
          </p>
        </div>
      ) : null}

      <div className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        <p className="border-b border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800">
          실시간 미리보기 · 저장 전 공개 페이지와 동일한 구조
        </p>
        <div className="max-h-[min(72vh,640px)] overflow-y-auto overscroll-contain bg-slate-100">
          <DigitalCardPublicView
            card={previewCard}
            links={previewLinks}
            onLinkClick={() => {}}
            compact
            hideSticky
            qrDataUrl={null}
          />
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-base font-medium text-slate-800">브랜드 / 회사명</label>
                <Input className="mt-1" {...register("brand_name")} />
                {errors.brand_name ? (
                  <p className="mt-1 text-xs text-red-600">{errors.brand_name.message}</p>
                ) : null}
              </div>
              <div>
                <label className="text-base font-medium text-slate-800">이름</label>
                <Input className="mt-1" {...register("person_name")} />
              </div>
              <div>
                <label className="text-base font-medium text-slate-800">직함</label>
                <Input className="mt-1" {...register("job_title")} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-base font-medium text-slate-800">소개</label>
                <Textarea className="mt-1" rows={4} {...register("intro")} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-base font-medium text-slate-800">공개 주소 이름</label>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Input className="flex-1" placeholder="hong-studio" {...register("slug")} />
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full shrink-0 sm:w-auto sm:min-w-[7rem]"
                    onClick={onSlugFromBrand}
                  >
                    자동 생성
                  </Button>
                </div>
                {errors.slug ? <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p> : null}
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  이 주소가 나만의 디지털 명함 링크로 사용됩니다.
                </p>
                <p className="mt-1 text-xs text-slate-500 break-all sm:break-normal">
                  링크: /c/{watch("slug") || "..."}
                </p>
              </div>
              <div>
                <label className="text-base font-medium text-slate-800">테마</label>
                <Select className="mt-1" {...register("theme")}>
                  <option value="navy">네이비 블루</option>
                  <option value="slate">슬레이트 그레이</option>
                  <option value="midnight">미드나이트</option>
                </Select>
              </div>
              <div>
                <label className="text-base font-medium text-slate-800">공개 여부</label>
                <Select className="mt-1" {...register("is_public")}>
                  <option value="true">공개</option>
                  <option value="false">비공개</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">공개 명함 · 랜딩</h2>
            <p className="text-sm text-slate-500">
              상단 히어로·신뢰·서비스 영역에 반영됩니다. 키워드는 자연스럽게 한 줄 설명과 소개에 녹여 주세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-base font-medium text-slate-800">한 줄 설명 (SEO·히어로)</label>
              <Input
                className="mt-1"
                placeholder="예: B2B 퍼포먼스 마케팅 · 리드 제너레이션 전문"
                {...register("tagline")}
              />
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">신뢰 한 줄 (후기·성과)</label>
              <Input className="mt-1" placeholder="예: 누적 컨설팅 120건 이상" {...register("trust_line")} />
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">작업 사진 URL (줄마다 하나)</label>
              <Textarea
                className="mt-1 font-mono text-sm"
                rows={4}
                placeholder="https://..."
                {...register("gallery_urls_raw")}
              />
              <p className="mt-1 text-xs text-slate-500">비어 있으면 예시 이미지가 표시됩니다.</p>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-base font-medium text-slate-800">서비스 (최대 5개)</label>
                {serviceFields.length < 5 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendService({ title: "", body: "" })}
                  >
                    추가
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 space-y-3">
                {serviceFields.map((field, idx) => (
                  <div key={field.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500">서비스 {idx + 1}</span>
                      {serviceFields.length > 3 ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeService(idx)}>
                          삭제
                        </Button>
                      ) : null}
                    </div>
                    <Input className="mt-2" placeholder="제목" {...register(`services.${idx}.title`)} />
                    <Textarea className="mt-2" rows={2} placeholder="짧은 설명" {...register(`services.${idx}.body`)} />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">제목·설명이 모두 비어 있으면 기본 서비스 안내가 표시됩니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">연락처 · 채널</h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-base font-medium text-slate-800">전화</label>
              <Input className="mt-1" {...register("phone")} />
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">이메일</label>
              <Input className="mt-1" type="email" {...register("email")} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-base font-medium text-slate-800">웹사이트</label>
              <Input className="mt-1" {...register("website_url")} />
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">블로그</label>
              <Input className="mt-1" {...register("blog_url")} />
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">유튜브</label>
              <Input className="mt-1" {...register("youtube_url")} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-base font-medium text-slate-800">카카오 채널</label>
              <Input className="mt-1" {...register("kakao_url")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">명함 버튼 (링크)</h2>
            <p className="text-sm text-slate-500">클릭 시 통계에 기록됩니다.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkRows.map((row, idx) => (
              <div
                key={row.id}
                className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-12"
              >
                <div className="sm:col-span-4">
                  <label className="text-sm font-medium text-slate-800">라벨</label>
                  <Input
                    className="mt-1"
                    value={row.label}
                    onChange={(e) =>
                      setLinkRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-sm font-medium text-slate-800">유형</label>
                  <Select
                    className="mt-1"
                    value={row.type}
                    onChange={(e) =>
                      setLinkRows((rows) =>
                        rows.map((r, i) =>
                          i === idx ? { ...r, type: e.target.value as CardLinkType } : r,
                        ),
                      )
                    }
                  >
                    <option value="website">웹사이트</option>
                    <option value="blog">블로그</option>
                    <option value="youtube">유튜브</option>
                    <option value="kakao">카카오</option>
                    <option value="email">이메일</option>
                    <option value="phone">전화</option>
                    <option value="custom">기타</option>
                  </Select>
                </div>
                <div className="sm:col-span-5">
                  <label className="text-sm font-medium text-slate-800">링크 주소</label>
                  <Input
                    className="mt-1"
                    value={row.url}
                    onChange={(e) =>
                      setLinkRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)),
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLinkRows((rows) => [
                  ...rows,
                  {
                    id: crypto.randomUUID(),
                    label: "",
                    type: "custom",
                    url: "",
                  },
                ])
              }
            >
              링크 추가
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-2">
          <Link
            to="/cards"
            className={cn(
              "w-full sm:w-auto",
              linkButtonClassName({
                variant: "secondary",
                size: "lg",
                className: "w-full sm:min-h-11 sm:w-auto",
              }),
            )}
          >
            취소
          </Link>
          <Button type="submit" className="w-full min-h-[52px] sm:w-auto sm:min-h-11" size="lg" loading={isSubmitting}>
            저장
          </Button>
        </div>
      </form>
    </div>
  );
}
