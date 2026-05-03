import type { BrandImagePersistPayload } from "@/components/card-editor/ImageUploader";
import { ImageUploader } from "@/components/card-editor/ImageUploader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { buildCardShareUrl, buildTempPreviewUrl, editorOriginFallback } from "@/lib/cardShareUrl";
import { CARD_DESIGN_LABEL } from "@/lib/cardDesignLabels";
import { parseCardEditorDraft } from "@/lib/cardEditorSchema";
import {
  ONBOARD_LINKO_CARD_TYPES,
  ONBOARD_LINKO_CARD_TYPE_LABEL,
  coerceOnboardCardType,
} from "@/lib/previewCardType";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { previewKakaoFeedFromDraft } from "@/lib/previewShareMeta";
import { cn } from "@/lib/utils";
import { slugify } from "@/stores/appDataStore";
import type { CardDesignType } from "@/types/domain";
import { useCardEditorDraftStore } from "@/stores/cardEditorDraftStore";
import { Copy, Loader2, Share2 } from "lucide-react";
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
  guestTempPreviewUrl = null,
  guestTempId = null,
  onPrepareGuestKakaoShare,
  persistBrandImageCardId = null,
  getPersistBrandImageCardId,
  onBrandImagePersist,
  guestHeroStorageHint = false,
  gateGuestHeroImagePick = false,
  onGuestHeroImagePickBlocked,
  postAuthHeroImageReminder = false,
  onDismissPostAuthHeroReminder,
}: {
  errors?: FieldErrors;
  /** studio: 양식 느낌 완화, 실시간 명함 조정 톤 */
  variant?: "default" | "studio";
  midSlot?: ReactNode;
  /** 게스트 체험: `/preview/{tempId}` — 있으면 /c/ 대신 이 주소로 복사·카카오 */
  guestTempPreviewUrl?: string | null;
  guestTempId?: string | null;
  onPrepareGuestKakaoShare?: () => Promise<boolean>;
  persistBrandImageCardId?: string | null;
  getPersistBrandImageCardId?: () => string | null;
  onBrandImagePersist?: (payload: BrandImagePersistPayload) => Promise<void>;
  guestHeroStorageHint?: boolean;
  gateGuestHeroImagePick?: boolean;
  onGuestHeroImagePickBlocked?: () => void;
  /** 가입 후 히어로 재선택 안내 */
  postAuthHeroImageReminder?: boolean;
  onDismissPostAuthHeroReminder?: () => void;
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
  const [slugKakaoPreparing, setSlugKakaoPreparing] = useState(false);
  const [slugKakaoError, setSlugKakaoError] = useState<string | null>(null);

  useEffect(() => {
    setLinkOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const previewCardUrl = useMemo(() => {
    const g = guestTempPreviewUrl?.trim();
    if (g) return g;
    const origin = editorOriginFallback(linkOrigin);
    return buildCardShareUrl(origin, draft.slug.trim()) ?? "";
  }, [draft.slug, linkOrigin, guestTempPreviewUrl]);

  const slugShareReady = useMemo(() => {
    const parsed = parseCardEditorDraft(draft);
    if (!parsed.success || !draft.is_public) return false;
    if (guestTempPreviewUrl?.trim() && guestTempId) return true;
    return draft.slug.trim().length >= 2;
  }, [draft, guestTempId, guestTempPreviewUrl]);

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
    if (slugKakaoPreparing) return;
    setSlugKakaoPreparing(true);
    setSlugKakaoError(null);
    const origin = editorOriginFallback(linkOrigin);
    const state: "guest" | "member" = guestTempPreviewUrl?.trim() && guestTempId ? "guest" : "member";
    const shareUrl =
      state === "guest" && guestTempId
        ? buildTempPreviewUrl(origin, guestTempId, draft.card_type) ?? previewCardUrl
        : previewCardUrl;
    console.log("공유 링크:", shareUrl);
    console.log("state:", state);
    console.log("tempId:", guestTempId ?? "");
    let r: Awaited<ReturnType<typeof shareCardLinkNativeOrder>>;
    try {
      if (guestTempPreviewUrl?.trim() && guestTempId) {
        const ready = onPrepareGuestKakaoShare ? await onPrepareGuestKakaoShare() : true;
        if (!ready) {
          setSlugKakaoError(
            "공유 링크 준비에 실패했습니다. 다시 시도해 주세요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
          );
          return;
        }
        const feed = previewKakaoFeedFromDraft(draft, { tempId: guestTempId, origin });
        r = await shareCardLinkNativeOrder({
          shareUrl,
          title: feed.title,
          shortMessage: feed.description,
          kakaoDescription: feed.description,
          kakaoImageUrl: feed.imageUrl,
        });
      } else {
        const title = `${draft.brand_name || draft.person_name || "내"} 디지털 명함`;
        r = await shareCardLinkNativeOrder({
          shareUrl,
          title,
          shortMessage: "내 디지털 명함 페이지 링크예요.",
        });
      }
      if (r === "clipboard") {
        setSlugKakaoHint(true);
        window.setTimeout(() => setSlugKakaoHint(false), 2800);
      }
    } finally {
      setSlugKakaoPreparing(false);
    }
  }, [
    draft,
    guestTempId,
    guestTempPreviewUrl,
    linkOrigin,
    onPrepareGuestKakaoShare,
    previewCardUrl,
    slugKakaoPreparing,
  ]);

  const onSlugFromBrand = () => {
    const s = slugify(draft.brand_name || draft.person_name || "my-card");
    if (s) setDraft({ slug: s });
  };

  const isStudio = variant === "studio";
  const labelCls = cn("text-base font-medium text-slate-800", isStudio && "text-slate-900");
  const hintCls = "mt-0.5 text-xs font-medium text-brand-600";
  const onboardKind = coerceOnboardCardType(draft.card_type);

  const basicBlock = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>
            명함 유형
            {isStudio ? <span className={hintCls}> · 이미지형 명함과 상세 페이지 구성이 달라집니다</span> : null}
          </label>
          <Select
            className="mt-1"
            value={onboardKind}
            onChange={(e) => setDraft({ card_type: e.target.value as typeof draft.card_type })}
          >
            {ONBOARD_LINKO_CARD_TYPES.map((t) => (
              <option key={t} value={t}>
                {ONBOARD_LINKO_CARD_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>

        {onboardKind === "person" ? (
          <div className="sm:col-span-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium leading-relaxed text-slate-600">
            개인형은 상호 없이 이름만으로 시작할 수 있어요. 스튜디오·회사명이 있으면 아래에 적어 주세요.
          </div>
        ) : null}

        {onboardKind === "store" || onboardKind === "location" ? (
          <div className="sm:col-span-2">
            <label className={labelCls}>
              {onboardKind === "store" ? "상호명" : "매장명"}
              {isStudio ? <span className={hintCls}> · 이미지형 명함 상단에 크게 보입니다</span> : null}
            </label>
            <Input
              className="mt-1"
              placeholder={onboardKind === "store" ? "예: 미노 인테리어" : "예: 옥토 가구공방"}
              value={draft.brand_name}
              onChange={(e) => setDraft({ brand_name: e.target.value })}
              autoComplete="organization"
            />
            {errors.brand_name ? <p className="mt-1 text-xs text-red-600">{errors.brand_name}</p> : null}
          </div>
        ) : null}

        {onboardKind === "person" ? (
          <div className="sm:col-span-2">
            <label className={labelCls}>
              회사·스튜디오명 (선택)
              {isStudio ? <span className={hintCls}> · 비워 두면 이름만 강조됩니다</span> : null}
            </label>
            <Input
              className="mt-1"
              placeholder="예: ○○ 인테리어 스튜디오"
              value={draft.brand_name}
              onChange={(e) => setDraft({ brand_name: e.target.value })}
              autoComplete="organization"
            />
            {errors.brand_name ? <p className="mt-1 text-xs text-red-600">{errors.brand_name}</p> : null}
          </div>
        ) : null}

        <div>
          <label className={labelCls}>
            {onboardKind === "location" ? "담당자 이름 (선택)" : onboardKind === "store" ? "대표자명" : "이름"}
            {isStudio ? <span className={hintCls}> · 즉시 반영</span> : null}
          </label>
          <Input
            className="mt-1"
            placeholder={onboardKind === "store" ? "예: 김민수" : "예: 김민수"}
            value={draft.person_name}
            onChange={(e) => setDraft({ person_name: e.target.value })}
            autoComplete="name"
          />
          {errors.person_name ? <p className="mt-1 text-xs text-red-600">{errors.person_name}</p> : null}
        </div>
        <div>
          <label className={labelCls}>
            {onboardKind === "person"
              ? "직함 / 역할"
              : onboardKind === "store"
                ? "업종"
                : "대표 상품 / 서비스"}
          </label>
          <Input
            className="mt-1"
            placeholder={
              onboardKind === "person"
                ? "예: 인테리어 디렉터"
                : onboardKind === "store"
                  ? "예: 주거 · 상업공간 인테리어"
                  : "예: 맞춤 수납장 · 원목 테이블"
            }
            value={draft.job_title}
            onChange={(e) => setDraft({ job_title: e.target.value })}
          />
          {errors.job_title ? <p className="mt-1 text-xs text-red-600">{errors.job_title}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>
            이미지형 명함 큰 제목
            {isStudio ? <span className={hintCls}> · 고객이 먼저 읽는 한 줄</span> : null}
          </label>
          <Input
            className="mt-1"
            placeholder="예: 공간을 바꾸면 삶이 바뀝니다"
            value={draft.marketing_title}
            onChange={(e) => setDraft({ marketing_title: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>
            한 줄 소개
            {isStudio ? <span className={hintCls}> · 카드·공유 카피 보조 줄</span> : null}
          </label>
          <Textarea
            className="mt-1"
            rows={2}
            placeholder="예: 하는 일과 연락 방법을 한눈에 보여드립니다"
            value={draft.tagline}
            onChange={(e) => setDraft({ tagline: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>
            상세 페이지 본문
            {isStudio ? <span className={hintCls}> · 링크로 열리는 페이지</span> : null}
          </label>
          <Textarea
            className="mt-1"
            rows={4}
            placeholder="예: 경력과 서비스, 상담 절차를 적어 주세요."
            value={draft.intro}
            onChange={(e) => setDraft({ intro: e.target.value })}
          />
          {errors.intro ? <p className="mt-1 text-xs text-red-600">{errors.intro}</p> : null}
        </div>

        {onboardKind === "person" ? (
          <>
            <div className="sm:col-span-2">
              <label className={labelCls}>주요 분야 · 태그 (선택)</label>
              <Input
                className="mt-1"
                placeholder="예: 상담 · 포트폴리오 강조"
                value={draft.trust_metric}
                onChange={(e) => setDraft({ trust_metric: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>활동 지역</label>
              <Input
                className="mt-1"
                placeholder="예: 서울 · 경기"
                value={draft.address}
                onChange={(e) => setDraft({ address: e.target.value })}
              />
            </div>
          </>
        ) : null}

        {onboardKind === "store" ? (
          <div className="sm:col-span-2">
            <label className={labelCls}>활동 지역 · 오시는 길 안내</label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder="예: 서울 · 경기 출장\n또는 매장 주소 한 줄"
              value={draft.address}
              onChange={(e) => setDraft({ address: e.target.value })}
            />
          </div>
        ) : null}

        {onboardKind === "location" ? (
          <div className="sm:col-span-2">
            <label className={labelCls}>
              영업시간 · 주소
              {isStudio ? <span className={hintCls}> · 여러 줄로 적어도 됩니다</span> : null}
            </label>
            <Textarea
              className="mt-1"
              rows={4}
              placeholder={"예:\n평일 10:00 - 18:00\n경기 남양주시 ○○로 12"}
              value={draft.address}
              onChange={(e) => setDraft({ address: e.target.value })}
            />
          </div>
        ) : null}
      </div>

      <div className={cn("rounded-xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5", isStudio && "border-brand-200/80 bg-gradient-to-b from-brand-50/60 to-white")}>
        {isStudio ? (
          <p className="mb-3 text-sm font-semibold text-brand-900">첫 인상을 만드는 대표 이미지</p>
        ) : null}
        {postAuthHeroImageReminder ? (
          <div
            role="status"
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm leading-relaxed text-emerald-950 sm:px-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 flex-1">
                회원가입이 완료되었습니다. 아래에서 <strong className="font-semibold">이미지를 다시 선택</strong>해 주세요.
                저장하면 내 공간에 명함이 올라갑니다.
              </p>
              {onDismissPostAuthHeroReminder ? (
                <button
                  type="button"
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
                  onClick={onDismissPostAuthHeroReminder}
                >
                  닫기
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        <ImageUploader
          label={
            isStudio
              ? "이미지 업로드 & 구도 조정"
              : onboardKind === "person"
                ? "대표 이미지"
                : onboardKind === "store"
                  ? "로고 또는 대표 이미지"
                  : "매장 이미지"
          }
            value={draft.imageUrl ?? draft.brand_image_url}
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
                    imageUrl: url,
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
            persistBrandImageCardId={persistBrandImageCardId}
            getPersistBrandImageCardId={getPersistBrandImageCardId}
            onBrandImagePersist={onBrandImagePersist}
          gateGuestPick={gateGuestHeroImagePick}
          onGuestPickBlocked={onGuestHeroImagePickBlocked}
          sectionAnchorId="linko-editor-hero-upload"
        />
          {guestHeroStorageHint ? (
            <p className="mt-2 text-xs font-medium text-slate-600">이미지는 회원가입 후 안전하게 저장됩니다.</p>
          ) : null}
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
                    {guestTempPreviewUrl?.trim() ? (
                      <>
                        👉 임시 미리보기 링크{" "}
                        <span className="text-xs font-normal text-slate-500">(/preview/…)</span>
                      </>
                    ) : (
                      <>
                        👉 당신의 명함 링크 <span className="text-xs font-normal text-slate-500">(/c/주소)</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {guestTempPreviewUrl?.trim()
                      ? "저장 전 임시 주소입니다. 가입 후 저장하면 /c/주소로 바꿀 수 있어요."
                      : "홈 주소가 아니라, 지금 입력한 공개 주소로 열리는 개인 명함입니다."}
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
                          disabled={slugKakaoPreparing}
                        >
                          {slugKakaoPreparing ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                          ) : (
                            <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                          )}
                          {slugKakaoPreparing ? "준비 중..." : "카카오톡으로 보내기"}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-11 w-full gap-2 border-2 border-brand-200/80 bg-white hover:bg-brand-50/80"
                        onClick={() => void kakaoSlugShare()}
                        disabled={slugKakaoPreparing}
                      >
                        {slugKakaoPreparing ? "준비 중..." : "내 카카오톡으로 테스트 보내기"}
                      </Button>
                      {slugKakaoPreparing ? (
                        <div className="rounded-xl border border-brand-200/80 bg-brand-50/70 px-3 py-3 text-sm text-brand-900">
                          <p className="font-semibold">공유 링크를 준비하고 있어요</p>
                          <p className="mt-1">잠시만 기다려 주세요</p>
                          <p className="mt-1">명함을 정리한 뒤 카카오톡으로 열어드릴게요</p>
                        </div>
                      ) : null}
                      {slugKakaoError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
                          {slugKakaoError}
                        </p>
                      ) : null}
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
              <label className="text-base font-medium text-slate-800">출력 템플릿</label>
              <p className="mt-0.5 text-xs text-slate-500">명함 이미지·PDF 인쇄 시 적용되는 스타일입니다.</p>
              <Select
                className="mt-1"
                value={draft.design_type}
                onChange={(e) => setDraft({ design_type: e.target.value as CardDesignType })}
              >
                {(Object.entries(CARD_DESIGN_LABEL) as [CardDesignType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
          title="명함 유형과 기본 정보"
          subtitle="먼저 유형을 고르면, 그에 맞는 입력란이 정리됩니다. 입력할 때마다 위 미리보기에 반영됩니다."
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
            상단 히어로·신뢰·서비스 영역에 반영됩니다. 필요할 때만 추가로 다듬어 주세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.card_type === "location" ? (
            <div>
              <label className="text-base font-medium text-slate-800">보조 한 줄 (선택, SEO·히어로)</label>
              <Input
                className="mt-1"
                placeholder="예: 방문 전 예약을 권장합니다"
                value={draft.tagline}
                onChange={(e) => setDraft({ tagline: e.target.value })}
              />
            </div>
          ) : null}
          {draft.card_type !== "person" ? (
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
          ) : null}
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
            <label className="text-base font-medium text-slate-800">전화번호</label>
            <Input
              className="mt-1"
              value={draft.phone}
              onChange={(e) => setDraft({ phone: e.target.value })}
              placeholder="01012345678"
              inputMode="tel"
              autoComplete="tel"
            />
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              문의하기 버튼에 연결될 전화번호입니다.
            </p>
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
          <div className="sm:col-span-2">
            <label className="text-base font-medium text-slate-800">카카오톡 상담 링크</label>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              카카오톡 상담 링크를 입력하면 고객이 버튼 하나로 상담을 시작할 수 있습니다.
            </p>
            <Input
              className="mt-1"
              placeholder="https://open.kakao.com/..."
              value={draft.kakao_chat_url}
              onChange={(e) => setDraft({ kakao_chat_url: e.target.value })}
            />
            {errors.kakao_chat_url ? <p className="mt-1 text-xs text-red-600">{errors.kakao_chat_url}</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
