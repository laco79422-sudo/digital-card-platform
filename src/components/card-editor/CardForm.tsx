import { ImageUploader } from "@/components/card-editor/ImageUploader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { buildCardShareUrl, editorOriginFallback } from "@/lib/cardShareUrl";
import { parseCardEditorDraft } from "@/lib/cardEditorSchema";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { cn } from "@/lib/utils";
import { slugify } from "@/stores/appDataStore";
import { useCardEditorDraftStore } from "@/stores/cardEditorDraftStore";
import { Copy, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type FieldErrors = Partial<Record<string, string>>;

function StudioSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
      {subtitle ? (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{subtitle}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function CardForm({
  errors = {},
  variant = "default",
  midSlot,
}: {
  errors?: FieldErrors;
  /** studio: 양식 느낌 완화, 실시간 명함 조정 톤 */
  variant?: "default" | "studio";
  midSlot?: ReactNode;
}) {
  const draft = useCardEditorDraftStore((s) => s.draft);
  const setDraft = useCardEditorDraftStore((s) => s.setDraft);
  const setServiceRow = useCardEditorDraftStore((s) => s.setServiceRow);
  const appendServiceRow = useCardEditorDraftStore((s) => s.appendServiceRow);
  const removeServiceRow = useCardEditorDraftStore((s) => s.removeServiceRow);
  const setTrustTestimonialRow = useCardEditorDraftStore((s) => s.setTrustTestimonialRow);

  const [linkOrigin, setLinkOrigin] = useState("");
  const [slugCopyDone, setSlugCopyDone] = useState(false);
  const [slugKakaoHint, setSlugKakaoHint] = useState(false);

  useEffect(() => {
    setLinkOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const previewCardUrl = useMemo(() => {
    const origin = editorOriginFallback(linkOrigin);
    return buildCardShareUrl(origin, draft.slug.trim()) ?? "";
  }, [draft.slug, linkOrigin]);

  const slugShareReady = useMemo(() => {
    const parsed = parseCardEditorDraft(draft);
    if (!parsed.success || !draft.is_public) return false;
    return draft.slug.trim().length >= 2;
  }, [draft]);

  const copySlugLink = useCallback(async () => {
    if (!previewCardUrl) return;
    try {
      await navigator.clipboard.writeText(previewCardUrl);
      setSlugCopyDone(true);
      window.setTimeout(() => setSlugCopyDone(false), 2200);
    } catch {
      window.prompt("링크를 복사해 주세요", previewCardUrl);
    }
  }, [previewCardUrl]);

  const kakaoSlugShare = useCallback(async () => {
    if (!previewCardUrl) return;
    const title = `${draft.brand_name || draft.person_name || "내"} 디지털 명함`;
    const r = await shareCardLinkNativeOrder({
      shareUrl: previewCardUrl,
      title,
      shortMessage: "내 디지털 명함 페이지 링크예요.",
    });
    if (r === "clipboard") {
      setSlugKakaoHint(true);
      window.setTimeout(() => setSlugKakaoHint(false), 2800);
    }
  }, [draft.brand_name, draft.person_name, previewCardUrl]);

  const onSlugFromBrand = () => {
    const s = slugify(draft.brand_name || "my-card");
    if (s) setDraft({ slug: s });
  };

  const isStudio = variant === "studio";
  const labelCls = cn("text-base font-medium text-slate-800", isStudio && "text-slate-900");
  const hintCls = "mt-0.5 text-xs font-medium text-brand-600";

  const basicBlock = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>
            브랜드 / 회사명
            {isStudio ? <span className={hintCls}> · 위 명함에 바로 반영</span> : null}
          </label>
          <Input
            className="mt-1"
            value={draft.brand_name}
            onChange={(e) => setDraft({ brand_name: e.target.value })}
            autoComplete="organization"
          />
          {errors.brand_name ? <p className="mt-1 text-xs text-red-600">{errors.brand_name}</p> : null}
        </div>
        <div>
          <label className={labelCls}>
            이름
            {isStudio ? <span className={hintCls}> · 즉시 반영</span> : null}
          </label>
          <Input
            className="mt-1"
            value={draft.person_name}
            onChange={(e) => setDraft({ person_name: e.target.value })}
            autoComplete="name"
          />
          {errors.person_name ? <p className="mt-1 text-xs text-red-600">{errors.person_name}</p> : null}
        </div>
        <div>
          <label className={labelCls}>
            직함
            {isStudio ? <span className={hintCls}> · 즉시 반영</span> : null}
          </label>
          <Input
            className="mt-1"
            value={draft.job_title}
            onChange={(e) => setDraft({ job_title: e.target.value })}
          />
          {errors.job_title ? <p className="mt-1 text-xs text-red-600">{errors.job_title}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>
            소개
            {isStudio ? <span className={hintCls}> · 입력할 때마다 완성되는 문장</span> : null}
          </label>
          <Textarea
            className="mt-1"
            rows={4}
            value={draft.intro}
            onChange={(e) => setDraft({ intro: e.target.value })}
          />
          {errors.intro ? <p className="mt-1 text-xs text-red-600">{errors.intro}</p> : null}
        </div>
      </div>

      <div className={cn("rounded-xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5", isStudio && "border-brand-200/80 bg-gradient-to-b from-brand-50/60 to-white")}>
        {isStudio ? (
          <p className="mb-3 text-sm font-semibold text-brand-900">첫 인상을 만드는 대표 이미지</p>
        ) : null}
        <ImageUploader
          label={isStudio ? "이미지 업로드 & 구도 조정" : "브랜드 대표 이미지"}
            value={draft.brand_image_url}
            naturalWidth={draft.brand_image_natural_width}
            naturalHeight={draft.brand_image_natural_height}
            zoom={draft.brand_image_zoom}
            panX={draft.brand_image_pan_x}
            panY={draft.brand_image_pan_y}
            legacyObjectPosition={draft.brand_image_legacy_object_position}
            onUrlChange={(url, meta) => {
              useCardEditorDraftStore.setState((s) => {
                const reset = meta?.reset;
                return {
                  draft: {
                    ...s.draft,
                    brand_image_url: url,
                    ...(reset
                      ? {
                          brand_image_natural_width: meta?.naturalW ?? null,
                          brand_image_natural_height: meta?.naturalH ?? null,
                          brand_image_zoom: 1,
                          brand_image_pan_x: 0,
                          brand_image_pan_y: 0,
                          brand_image_legacy_object_position: null,
                        }
                      : {}),
                  },
                };
              });
            }}
            onZoomChange={(brand_image_zoom) => setDraft({ brand_image_zoom })}
            onPanChange={(brand_image_pan_x, brand_image_pan_y) =>
              setDraft({ brand_image_pan_x, brand_image_pan_y })
            }
            onNaturalMeasured={(w, h) =>
              setDraft({
                brand_image_natural_width: w,
                brand_image_natural_height: h,
                brand_image_legacy_object_position: null,
                brand_image_zoom: 1,
                brand_image_pan_x: 0,
                brand_image_pan_y: 0,
              })
            }
          />
      </div>

          <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div className="sm:col-span-2 rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50/35 to-white p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label className="text-base font-semibold text-slate-900">나를 전달하는 링크 이름</label>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">브랜드처럼 적어 보세요</span>
              </div>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                이 링크를 고객에게 보내면,
                <br />
                당신의 명함이 바로 열립니다.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                카카오톡, 문자, SNS 어디든
                <br />
                이 링크 하나로 나를 소개할 수 있습니다
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">/c/</span>
                  <Input
                    className="flex-1 pl-[2.35rem] font-medium"
                    placeholder="민호 · 디자인 · linko"
                    value={draft.slug}
                    onChange={(e) => setDraft({ slug: e.target.value })}
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full shrink-0 sm:w-auto sm:min-w-[7.5rem]"
                  onClick={onSlugFromBrand}
                >
                  브랜드명으로 채우기
                </Button>
              </div>
              {errors.slug ? <p className="mt-2 text-xs text-red-600">{errors.slug}</p> : null}

              <div className="mt-3 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3 text-sm leading-relaxed text-slate-700">
                <p className="font-medium text-slate-900">💡 이름이나 브랜드로 만들면 기억하기 쉽습니다</p>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                  예: <span className="font-mono text-slate-800">/민호</span>,{" "}
                  <span className="font-mono text-slate-800">/디자인</span>,{" "}
                  <span className="font-mono text-slate-800">/linko</span>
                </p>
              </div>

              {previewCardUrl ? (
                <div className="mt-4 space-y-2">
                  <p className="text-center text-sm font-bold text-slate-900">
                    👉 당신의 명함 링크 <span className="text-xs font-normal text-slate-500">(/c/주소)</span>
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    홈 주소가 아니라, 지금 입력한 공개 주소로 열리는 개인 명함입니다.
                  </p>
                  <div className="break-all rounded-2xl border-2 border-brand-200/80 bg-white px-4 py-3 text-sm font-bold text-brand-900 shadow-inner sm:text-base">
                    {previewCardUrl}
                  </div>
                  {slugShareReady ? (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11 w-full flex-1 gap-2"
                          onClick={() => void copySlugLink()}
                        >
                          <Copy className="h-4 w-4 shrink-0" aria-hidden />
                          {slugCopyDone ? "복사됨!" : "링크 복사하기"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-11 w-full flex-1 gap-2"
                          onClick={() => void kakaoSlugShare()}
                        >
                          <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                          카카오톡으로 보내기
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-11 w-full gap-2 border-2 border-brand-200/80 bg-white hover:bg-brand-50/80"
                        onClick={() => void kakaoSlugShare()}
                      >
                        내 카카오톡으로 테스트 보내기
                      </Button>
                      {slugKakaoHint ? (
                        <p className="text-center text-xs font-medium text-brand-800 sm:text-sm">
                          명함 링크를 복사했어요. 카카오톡에 붙여넣어 보내 보세요.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950">
                      명함을 <span className="font-semibold">공개</span>로 두고 필수 정보를 맞추면, 위 주소로 실제
                      열리는 링크를 카카오톡으로 바로 테스트할 수 있어요.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  링크 이름을 2자 이상 입력하면 바로 복사·공유할 수 있어요.
                </p>
              )}
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">테마</label>
              <Select
                className="mt-1"
                value={draft.theme}
                onChange={(e) => setDraft({ theme: e.target.value as typeof draft.theme })}
              >
                <option value="navy">네이비 블루</option>
                <option value="slate">슬레이트 그레이</option>
                <option value="midnight">미드나이트</option>
              </Select>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">공개 여부</label>
              <Select
                className="mt-1"
                value={draft.is_public ? "true" : "false"}
                onChange={(e) => setDraft({ is_public: e.target.value === "true" })}
              >
                <option value="true">공개</option>
                <option value="false">비공개</option>
              </Select>
            </div>
          </div>
    </>
  );

  return (
    <div className="space-y-6">
      {isStudio ? (
        <StudioSection
          title="명함을 다듬어 보세요"
          subtitle="입력하는 순간, 위 미리보기와 똑같이 바뀝니다. 폼이 아니라 실시간 완성 화면이라고 생각해 주세요."
        >
          {basicBlock}
        </StudioSection>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>
          </CardHeader>
          <CardContent className="space-y-4">{basicBlock}</CardContent>
        </Card>
      )}

      {midSlot ? <div className="py-2">{midSlot}</div> : null}

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
              value={draft.tagline}
              onChange={(e) => setDraft({ tagline: e.target.value })}
            />
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">성과·신뢰 수치 (한 줄)</label>
            <Input
              className="mt-1"
              placeholder="예: 100+ 명함 제작 · 프로젝트 200건+"
              value={draft.trust_metric}
              onChange={(e) => setDraft({ trust_metric: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-500">신뢰 영역 상단에 강조됩니다. Supabase 연동 시 로컬에만 저장될 수 있습니다.</p>
          </div>
          <div className="space-y-3">
            <p className="text-base font-medium text-slate-800">고객 후기 (최대 2건)</p>
            {([0, 1] as const).map((idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <span className="text-xs font-semibold text-slate-600">후기 {idx + 1}</span>
                <Textarea
                  className="mt-2"
                  rows={2}
                  placeholder="예: 명함 하나로 문의가 늘었습니다"
                  value={draft.trust_testimonials[idx].quote}
                  onChange={(e) => setTrustTestimonialRow(idx, { quote: e.target.value })}
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="고객 이름"
                    value={draft.trust_testimonials[idx].person_name}
                    onChange={(e) => setTrustTestimonialRow(idx, { person_name: e.target.value })}
                  />
                  <Input
                    placeholder="직업 · 업종"
                    value={draft.trust_testimonials[idx].role}
                    onChange={(e) => setTrustTestimonialRow(idx, { role: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500">
              저장 시 첫 번째 후기는 기존 「신뢰 한 줄」필드와 동기화됩니다. 비워 두면 예시 후기가 표시됩니다.
            </p>
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">프로젝트·작업 이미지 URL (줄마다 하나, 3~6장 권장)</label>
            <Textarea
              className="mt-1 font-mono text-sm"
              rows={5}
              placeholder={"https://...\nhttps://..."}
              value={draft.gallery_urls_raw}
              onChange={(e) => setDraft({ gallery_urls_raw: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-500">비어 있으면 예시 이미지가 표시됩니다.</p>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-base font-medium text-slate-800">서비스 (최대 5개)</label>
              {draft.services.length < 5 ? (
                <Button type="button" variant="outline" size="sm" onClick={() => appendServiceRow()}>
                  추가
                </Button>
              ) : null}
            </div>
            <div className="mt-3 space-y-3">
              {draft.services.map((row, idx) => (
                <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">서비스 {idx + 1}</span>
                    {draft.services.length > 3 ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeServiceRow(idx)}>
                        삭제
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    className="mt-2"
                    placeholder="제목"
                    value={row.title}
                    onChange={(e) => setServiceRow(idx, { title: e.target.value })}
                  />
                  <Textarea
                    className="mt-2"
                    rows={2}
                    placeholder="짧은 설명"
                    value={row.body}
                    onChange={(e) => setServiceRow(idx, { body: e.target.value })}
                  />
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
            <Input
              className="mt-1"
              value={draft.phone}
              onChange={(e) => setDraft({ phone: e.target.value })}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">이메일</label>
            <Input
              className="mt-1"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ email: e.target.value })}
              autoComplete="email"
            />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-base font-medium text-slate-800">웹사이트</label>
            <Input
              className="mt-1"
              value={draft.website_url}
              onChange={(e) => setDraft({ website_url: e.target.value })}
            />
            {errors.website_url ? <p className="mt-1 text-xs text-red-600">{errors.website_url}</p> : null}
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">블로그</label>
            <Input className="mt-1" value={draft.blog_url} onChange={(e) => setDraft({ blog_url: e.target.value })} />
            {errors.blog_url ? <p className="mt-1 text-xs text-red-600">{errors.blog_url}</p> : null}
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">유튜브</label>
            <Input
              className="mt-1"
              value={draft.youtube_url}
              onChange={(e) => setDraft({ youtube_url: e.target.value })}
            />
            {errors.youtube_url ? <p className="mt-1 text-xs text-red-600">{errors.youtube_url}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-base font-medium text-slate-800">카카오 채널</label>
            <Input
              className="mt-1"
              value={draft.kakao_url}
              onChange={(e) => setDraft({ kakao_url: e.target.value })}
            />
            {errors.kakao_url ? <p className="mt-1 text-xs text-red-600">{errors.kakao_url}</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
