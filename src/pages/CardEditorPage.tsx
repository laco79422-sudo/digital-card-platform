import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { getLinksForCard, slugify, useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard, CardLink, CardLinkType } from "@/types/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const optionalUrl = z.string().url().or(z.literal(""));

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
    };
  }, [existing, user]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const [linkRows, setLinkRows] = useState<LinkRow[]>(() => mapLinksToRows(existingLinks));

  useEffect(() => {
    setLinkRows(mapLinksToRows(existingLinks));
  }, [existing?.id]);

  const brandWatch = watch("brand_name");

  const onSlugFromBrand = () => {
    const s = slugify(brandWatch || "my-card");
    if (s) setValue("slug", s);
  };

  const onSave = handleSubmit(async (values) => {
    if (!user) return;
    const cardId = existing?.id ?? crypto.randomUUID();
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
          {isNew ? "새 명함" : "명함 편집"}
        </h1>
        <Link
          to="/cards"
          className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-brand-700"
        >
          목록으로
        </Link>
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
                <label className="text-base font-medium text-slate-800">공개 슬러그 (URL)</label>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Input className="flex-1" placeholder="harbor-marketing" {...register("slug")} />
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
                <p className="mt-1 text-xs text-slate-400">주소: /c/{watch("slug") || "..."}</p>
              </div>
              <div>
                <label className="text-base font-medium text-slate-800">테마</label>
                <Select className="mt-1" {...register("theme")}>
                  <option value="navy">Navy</option>
                  <option value="slate">Slate</option>
                  <option value="midnight">Midnight</option>
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
                  <label className="text-sm font-medium text-slate-800">URL</label>
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
          <Link to="/cards" className="w-full sm:w-auto">
            <Button type="button" variant="secondary" className="w-full min-h-[52px] sm:min-h-11">
              취소
            </Button>
          </Link>
          <Button type="submit" className="w-full min-h-[52px] sm:w-auto sm:min-h-11" size="lg" loading={isSubmitting}>
            저장
          </Button>
        </div>
      </form>
    </div>
  );
}
