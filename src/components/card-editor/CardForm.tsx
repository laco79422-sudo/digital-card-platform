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
import { ChevronDown, Copy, Loader2, QrCode, Share2 } from "lucide-react";
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

function scrollToQrExport() {
  document.getElementById("card-qr-export")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  postAuthHeroImageReminder = false,
  onDismissPostAuthHeroReminder,
  onHeroImageFlowBlockingChange,
  contactLinksSlot = null,
  shareExpandCue = 0,
}: {
  errors?: FieldErrors;
  variant?: "default" | "studio";
  midSlot?: ReactNode;
  guestTempPreviewUrl?: string | null;
  guestTempId?: string | null;
  onPrepareGuestKakaoShare?: () => Promise<boolean>;
  persistBrandImageCardId?: string | null;
  getPersistBrandImageCardId?: () => string | null;
  onBrandImagePersist?: (payload: BrandImagePersistPayload) => Promise<void>;
  guestHeroStorageHint?: boolean;
  gateGuestHeroImagePick?: boolean;
  postAuthHeroImageReminder?: boolean;
  onDismissPostAuthHeroReminder?: () => void;
  /** 대표 이미지 2단계 검증이 끝나기 전이면 true — 상위에서 명함 저장 버튼 비활성화 */
  onHeroImageFlowBlockingChange?: (blocked: boolean) => void;
  /** 명함 버튼(링크) 편집 — 연락 카드 안에 포함 */
  contactLinksSlot?: ReactNode;
  /** 상단 헤더「공유하기」에서 증가시키면 패널이 펼쳐짐 */
  shareExpandCue?: number;
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
  /** 상세 안내 접힘 — 기본 접힘 */
  const [shareDetailsOpen, setShareDetailsOpen] = useState(false);

  useEffect(() => {
    setLinkOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (!shareExpandCue) return;
    setShareDetailsOpen(true);
    requestAnimationFrame(() => document.getElementById("editor-share-settings")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [shareExpandCue]);

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

  const imageModerationNote = useMemo(() => {
    if (draft.brand_image_status === "pending") {
      return "이미지 검수 중입니다. 승인되면 공개 명함에 반영됩니다.";
    }
    if (draft.brand_image_status === "rejected") {
      const r = draft.brand_image_reject_reason?.trim();
      return r
        ? `이미지가 승인되지 않았습니다. (${r}) 다시 업로드해 주세요.`
        : "이미지가 승인되지 않았습니다. 다시 업로드해 주세요.";
    }
    return null;
  }, [draft.brand_image_status, draft.brand_image_reject_reason]);

  const basicInfoInner = (
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
            {onboardKind === "store" ? "상호명 · 회사명" : "매장명"}
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
          placeholder="예: 김민수"
          value={draft.person_name}
          onChange={(e) => setDraft({ person_name: e.target.value })}
          autoComplete="name"
        />
        {errors.person_name ? <p className="mt-1 text-xs text-red-600">{errors.person_name}</p> : null}
      </div>
      <div>
        <label className={labelCls}>
          {onboardKind === "person"
            ? "직함 · 역할"
            : onboardKind === "store"
              ? "업종"
              : "대표 상품 · 서비스"}
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
          {isStudio ? <span className={hintCls}> · 명함 상단에서 먼저 읽히는 한 줄</span> : null}
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
    </div>
  );

  const heroInner = (
    <div className={cn(isStudio ? "rounded-xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5" : "", !isStudio && "space-y-3")}>
      {isStudio ? (
        <p className="mb-3 text-sm font-semibold text-brand-900">고객이 가장 먼저 보는 대표 이미지입니다.</p>
      ) : (
        <p className="text-sm leading-relaxed text-slate-600">고객이 가장 먼저 보는 대표 이미지입니다.</p>
      )}
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
            ? "대표 이미지"
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
            const cleared =
              url == null || (typeof url === "string" && !url.trim())
                ? {
                    brand_image_status: null,
                    brand_image_pending_path: null,
                    brand_image_reject_reason: null,
                    approved_public_hero_url: null,
                  }
                : {};
            return {
              draft: {
                ...s.draft,
                imageUrl: url,
                brand_image_url: url,
                ...cleared,
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
        onPanChange={(brand_image_pan_x, brand_image_pan_y) => setDraft({ brand_image_pan_x, brand_image_pan_y })}
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
        moderationNote={imageModerationNote}
        gateGuestPick={gateGuestHeroImagePick}
        onHeroImageFlowBlockingChange={onHeroImageFlowBlockingChange}
        sectionAnchorId="linko-editor-hero-upload"
        defaultAdvancedOpen={false}
        compactDeleteStyle
      />
      {guestHeroStorageHint ? (
        <p className="mt-2 text-xs font-medium text-slate-600">이미지는 회원가입 후 안전하게 저장됩니다.</p>
      ) : null}
    </div>
  );

  const contactInner = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={labelCls}>전화번호</label>
        <Input
          className="mt-1"
          value={draft.phone}
          onChange={(e) => setDraft({ phone: e.target.value })}
          placeholder="01012345678"
          inputMode="tel"
          autoComplete="tel"
        />
      </div>
      <div>
        <label className={labelCls}>이메일</label>
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
        <label className={labelCls}>홈페이지 · 웹사이트</label>
        <Input
          className="mt-1"
          value={draft.website_url}
          onChange={(e) => setDraft({ website_url: e.target.value })}
          placeholder="https://"
        />
        {errors.website_url ? <p className="mt-1 text-xs text-red-600">{errors.website_url}</p> : null}
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>추가 링크 (블로그 / 유튜브)</label>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <Input placeholder="블로그 URL" value={draft.blog_url} onChange={(e) => setDraft({ blog_url: e.target.value })} />
            {errors.blog_url ? <p className="mt-1 text-xs text-red-600">{errors.blog_url}</p> : null}
          </div>
          <div>
            <Input
              placeholder="유튜브 URL"
              value={draft.youtube_url}
              onChange={(e) => setDraft({ youtube_url: e.target.value })}
            />
            {errors.youtube_url ? <p className="mt-1 text-xs text-red-600">{errors.youtube_url}</p> : null}
          </div>
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>카카오 채널</label>
        <Input className="mt-1" value={draft.kakao_url} onChange={(e) => setDraft({ kakao_url: e.target.value })} />
        {errors.kakao_url ? <p className="mt-1 text-xs text-red-600">{errors.kakao_url}</p> : null}
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>카카오톡 문의 링크</label>
        <Input
          className="mt-1"
          placeholder="https://open.kakao.com/..."
          value={draft.kakao_chat_url}
          onChange={(e) => setDraft({ kakao_chat_url: e.target.value })}
        />
        {errors.kakao_chat_url ? <p className="mt-1 text-xs text-red-600">{errors.kakao_chat_url}</p> : null}
      </div>
      {contactLinksSlot ? (
        <div className="sm:col-span-2 border-t border-slate-100 pt-4">
          {contactLinksSlot}
        </div>
      ) : null}
    </div>
  );

  const detailIntroInner = (
    <div className="space-y-6">
      <div>
        <label className={labelCls}>
          상세 페이지 본문
          {isStudio ? <span className={hintCls}> · 링크로 열리는 소개 페이지</span> : null}
        </label>
        <Textarea
          className="mt-1"
          rows={5}
          placeholder="예: 경력과 서비스, 상담 절차를 적어 주세요."
          value={draft.intro}
          onChange={(e) => setDraft({ intro: e.target.value })}
        />
        {errors.intro ? <p className="mt-1 text-xs text-red-600">{errors.intro}</p> : null}
      </div>

      {draft.card_type === "location" ? (
        <div>
          <label className={labelCls}>보조 한 줄 (선택, SEO·히어로)</label>
          <Input
            className="mt-1"
            placeholder="예: 방문 전 예약을 권장합니다"
            value={draft.tagline}
            onChange={(e) => setDraft({ tagline: e.target.value })}
          />
        </div>
      ) : null}

      {draft.card_type === "person" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>주요 분야 · 태그</label>
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
        </div>
      ) : null}

      {draft.card_type === "store" ? (
        <div>
          <label className={labelCls}>활동 지역 · 오시는 길</label>
          <Textarea
            className="mt-1"
            rows={3}
            placeholder="예: 서울 · 경기 출장 또는 매장 주소"
            value={draft.address}
            onChange={(e) => setDraft({ address: e.target.value })}
          />
        </div>
      ) : null}

      {draft.card_type === "location" ? (
        <div>
          <label className={labelCls}>
            영업시간 · 주소
            {isStudio ? <span className={hintCls}> · 여러 줄 가능</span> : null}
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

      {draft.card_type !== "person" ? (
        <div>
          <label className={labelCls}>신뢰 · 성과 한 줄</label>
          <Input
            className="mt-1"
            placeholder="예: 100+ 명함 제작 · 프로젝트 200건+"
            value={draft.trust_metric}
            onChange={(e) => setDraft({ trust_metric: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">랜딩 상단 신뢰 영역에 쓰입니다.</p>
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4">
        <p className="text-base font-medium text-slate-800">고객 후기 (최대 2건)</p>
        {([0, 1] as const).map((idx) => (
          <div key={idx} className="rounded-xl border border-slate-100 bg-white p-3">
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
          비워 두면 예시 후기가 표시됩니다. 첫 번째 후기는 「신뢰 한 줄」과 동기화됩니다.
        </p>
      </div>

      <div>
        <label className={labelCls}>프로젝트 이미지 URL (줄마다 하나)</label>
        <Textarea
          className="mt-1 font-mono text-sm"
          rows={4}
          placeholder={"https://...\nhttps://..."}
          value={draft.gallery_urls_raw}
          onChange={(e) => setDraft({ gallery_urls_raw: e.target.value })}
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className={labelCls}>서비스 (최대 5개)</label>
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
      </div>
    </div>
  );

  const shareSettingsInner = (
    <div id="editor-share-settings" className="scroll-mt-28 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShareDetailsOpen(!shareDetailsOpen)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left text-base font-semibold text-slate-900"
          aria-expanded={shareDetailsOpen}
        >
          공유 링크
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", shareDetailsOpen && "rotate-180")}
            aria-hidden
          />
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="min-h-9" onClick={() => void copySlugLink()} disabled={!previewCardUrl}>
            <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
            {slugCopyDone ? "복사됨" : "복사"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-9"
            onClick={() => void kakaoSlugShare()}
            disabled={!previewCardUrl || slugKakaoPreparing}
          >
            {slugKakaoPreparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Share2 className="mr-1 h-3.5 w-3.5" aria-hidden />}
            카카오
          </Button>
          <Button type="button" variant="outline" size="sm" className="min-h-9" onClick={scrollToQrExport}>
            <QrCode className="mr-1 h-3.5 w-3.5" aria-hidden />
            QR
          </Button>
        </div>
      </div>

      {previewCardUrl ? (
        <p className="truncate rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-brand-900" title={previewCardUrl}>
          {previewCardUrl}
        </p>
      ) : (
        <p className="text-xs text-slate-500">공개 주소와 slug를 채우면 링크가 표시됩니다.</p>
      )}

      {shareDetailsOpen ? (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <label className={labelCls}>공개 주소 (/c/이름)</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
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
              <Button type="button" variant="secondary" className="w-full shrink-0 sm:w-auto" onClick={onSlugFromBrand}>
                브랜드명으로 채우기
              </Button>
            </div>
            {errors.slug ? <p className="mt-2 text-xs text-red-600">{errors.slug}</p> : null}
          </div>

          <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-3 text-sm leading-relaxed text-slate-700">
            <p className="font-medium text-slate-900">이 링크를 고객에게 보내면 명함 페이지가 바로 열립니다.</p>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              홈이 아니라 <span className="font-semibold">당신만의 /c/주소</span>예요. 이름이나 브랜드로 짓기 쉽게 만들 수 있어요.
            </p>
          </div>

          {slugShareReady ? (
            <div className="space-y-2">
              {slugKakaoPreparing ? (
                <div className="rounded-xl border border-brand-200/80 bg-brand-50/70 px-3 py-3 text-sm text-brand-900">
                  <p className="font-semibold">공유 링크를 준비하고 있어요</p>
                </div>
              ) : null}
              {slugKakaoError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{slugKakaoError}</p>
              ) : null}
              {slugKakaoHint ? (
                <p className="text-center text-xs font-medium text-brand-800">명함 링크를 복사했어요. 카카오톡에 붙여넣어 보내 보세요.</p>
              ) : null}
            </div>
          ) : (
            <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
              명함을 <span className="font-semibold">공개</span>로 두고 필수 정보를 맞추면 실제로 열리는 링크로 테스트할 수 있어요.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>테마</label>
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
              <label className={labelCls}>출력 템플릿</label>
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
              <label className={labelCls}>공개 여부</label>
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
        </div>
      ) : null}
    </div>
  );

  const wrap = (studioTitle: string, studioSubtitle: string | undefined, defaultTitle: string, inner: ReactNode) =>
    isStudio ? (
      <StudioSection title={studioTitle} subtitle={studioSubtitle}>
        {inner}
      </StudioSection>
    ) : (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">{defaultTitle}</h2>
        </CardHeader>
        <CardContent className="space-y-4">{inner}</CardContent>
      </Card>
    );

  return (
    <div className="space-y-6">
      {wrap(
        "1 · 기본 정보",
        "먼저 유형과 이름·한 줄 소개를 채우면 오른쪽 미리보기에 바로 반영됩니다.",
        "기본 정보",
        basicInfoInner,
      )}

      {wrap(
        "2 · 대표 이미지",
        "고객이 가장 먼저 보는 이미지입니다. 파일을 고른 뒤 필요할 때만 고급 조정을 열어 주세요.",
        "대표 이미지",
        heroInner,
      )}

      {midSlot ? <div className="py-1">{midSlot}</div> : null}

      {wrap(
        "3 · 연락처 · 링크",
        "전화·이메일·홈페이지와 명함에 붙는 버튼 링크를 정리합니다.",
        "연락처 · 링크",
        contactInner,
      )}

      {wrap(
        "4 · 상세 소개",
        "소개 본문, 태그·지역, 랜딩에 쓰이는 후기·서비스를 한곳에서 다룹니다.",
        "상세 소개",
        detailIntroInner,
      )}

      {wrap("5 · 공유 설정", "링크 복사·카카오·QR은 항상 사용할 수 있고, 주소 편집은 펼쳐서 확인하세요.", "공유 설정", shareSettingsInner)}
    </div>
  );
}
