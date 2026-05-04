import { RewardAdsSection } from "@/components/reward-ads/RewardAdsSection";
import { PostSaveGrowthPanel } from "@/components/card/PostSaveGrowthPanel";
import { GuestSavePrompt } from "@/components/card/SavePrompt";
import { CardQrAndExportPanel } from "@/components/card-print/CardQrAndExportPanel";
import type { BrandImagePersistPayload } from "@/components/card-editor/ImageUploader";
import { CardForm } from "@/components/card-editor/CardForm";
import { CardEditorGrowthLadder } from "@/components/card-editor/CardEditorGrowthLadder";
import { CardEditorSaveCompletionPanel } from "@/components/card-editor/CardEditorSaveCompletionPanel";
import { CardPreview } from "@/components/card-editor/CardPreview";
import { FillSampleWizardModal, type FillSampleWizardResult } from "@/components/card-editor/FillSampleWizardModal";
import { GuestHeroImageAuthModal } from "@/components/card-editor/GuestHeroImageAuthModal";
import { GuestSaveAuthModal } from "@/components/card-editor/GuestSaveAuthModal";
import { LoggedInGuestCreateRedirect } from "@/components/card/LoggedInGuestCreateRedirect";
import { DelegateExpertChoiceModal } from "@/components/card-editor/ExpertAssistModals";
import { IndustryPickSection } from "@/components/card-editor/IndustryPickSection";
import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  applyCtaLabelToPrimaryLinkLabel,
  cardIndustryPayloadFromTemplateId,
  getIndustryTemplate,
  mergeIndustryCopyIntoDraft,
  parseIndustryQuery,
  resolvePromoShareTextWithIndustryTemplate,
} from "@/data/industryTemplates";
import {
  buildRevenueCardDraft,
  buildRevenueTemplateLinkRows,
  parseRevenueTemplateSearch,
  type RevenueCardTemplateId,
} from "@/data/revenueCardTemplates";
import { getPendingImageBucket } from "@/lib/brandImagePendingUpload";
import { getCardHeroImageUrl } from "@/lib/businessCardHeroImage";
import { buildCardShareUrl, buildTempPreviewUrl, editorOriginFallback } from "@/lib/cardShareUrl";
import { canonicalSiteOrigin } from "@/lib/siteOrigin";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { parseCardEditorDraft, zodIssuesToFieldErrors } from "@/lib/cardEditorSchema";
import { syncTempPreviewRemote } from "@/lib/syncTempPreviewRemote";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import {
  MAIN_CTA_EXISTING_CARD_NOTICE,
  MAIN_CTA_MULTI_CARD_CHOOSE_NOTICE,
  ROUTE_STATE_MAIN_CTA_EXISTING_CARD,
  ROUTE_STATE_MAIN_CTA_PICK_CARD,
} from "@/lib/linkoFlowCopy";
import { useAuthStore } from "@/stores/authStore";
import {
  DEFAULT_CARD_PERSON_NAME,
  createEmptyDraft,
  draftFromBusinessCard,
  draftToBusinessCard,
  mergeDraftDefaults,
  useCardEditorDraftStore,
  type CardEditorDraft,
} from "@/stores/cardEditorDraftStore";
import { getLinksForCard, useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard, CardLink, CardLinkType, User } from "@/types/domain";
import { parseWantsSample } from "@/lib/cardEditorSampleData";
import {
  applyCardSamplePhrase,
  SAMPLE_TEMPLATE_PHONE,
  seedLinkTemplates,
} from "@/data/cardSampleTemplates";
import { clearEditorLiveCardId } from "@/lib/editorLiveCardStorage";
import {
  clearGuestTempId,
  getOrCreateGuestTempId,
  resetGuestTempId,
  setGuestTempSessionId,
} from "@/lib/guestTempSession";
import { INSTANT_GUEST_USER_ID } from "@/lib/instantCardCreate";
import { recordPaymentAndReferralReward } from "@/services/referralRewardsService";
import { clearInstantCardId } from "@/lib/instantCardStorage";
import {
  clearLandingEmail,
  clearPendingCardDraft,
  getLandingEmail,
  peekPendingCardDraft,
  savePendingCardDraft,
  peekPendingHeroResumeAfterAuth,
  setPendingHeroResumeAfterAuth,
} from "@/lib/pendingCardStorage";
import { removeTempCard, saveTempCard } from "@/lib/tempCardStorage";
import {
  fetchBusinessCardByIdForOwner,
  fetchCardLinks,
  fetchMyCardsForUser,
  isSlugTakenOnRemoteByAnotherCard,
  patchCardBrandHeroRemote,
  upsertCardRemote,
} from "@/services/cardsService";
import { syncQrImageAfterSave } from "@/services/cardQrSync";
import { SHOW_PENDING_CARD_SAVED_STATE } from "@/services/pendingCardDraftFlush";
import { useAuthReady } from "@/hooks/useAuthReady";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cardBelongsToUser(card: BusinessCard, user: User): boolean {
  const email = user.email.trim().toLowerCase();
  return (
    card.user_id === user.id ||
    card.owner_id === user.id ||
    Boolean(email && (card.owner_email?.trim().toLowerCase() === email || card.email?.trim().toLowerCase() === email))
  );
}

function sortOwnedCardsByCreatedDesc(rows: BusinessCard[]): BusinessCard[] {
  return [...rows].sort((a, b) => {
    const ta = Date.parse(a.created_at) || 0;
    const tb = Date.parse(b.created_at) || 0;
    return tb - ta;
  });
}

function EditorFlowHint({ phase }: { phase: "hero" | "mid" | "bottom" }) {
  const goStudio = () => scrollToId("studio-fields");

  const softBtn =
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 sm:w-auto";

  if (phase === "hero") {
    return (
      <div className="mt-8 flex w-full max-w-lg justify-center sm:mx-auto sm:max-w-xl">
        <button type="button" className={softBtn} onClick={goStudio}>
          입력란으로 이동
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-5 sm:px-6 sm:py-6">
      <p className="text-center text-sm font-semibold text-slate-800">
        {phase === "mid" ? "아래만 채우면 공유할 준비가 됩니다" : "맨 아래에서 저장하면 공유·복사 화면으로 바로 이어져요"}
      </p>
      <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
        게스트는 저장 단계에서 가입으로 연결됩니다. 미리보기 링크로 먼저 결과를 확인해 보세요.
      </p>
    </div>
  );
}

type LinkRow = { id: string; label: string; type: CardLinkType; url: string };

const DEFAULT_EDITOR_SAMPLE_REVENUE_ID: RevenueCardTemplateId = "interior";

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

function draftLinkRowsToCardLinks(draft: CardEditorDraft, rows: LinkRow[], cardId: string): CardLink[] {
  const filtered = rows.filter((r) => r.label.trim() && r.url.trim());
  if (filtered.length > 0) {
    return filtered.map((r, i) => ({
      id: r.id,
      card_id: cardId,
      label: r.label,
      type: r.type,
      url: r.url,
      sort_order: i,
    }));
  }
  return [
    {
      id: crypto.randomUUID(),
      card_id: cardId,
      label: "웹사이트",
      type: "website",
      url: draft.website_url.trim() || "https://example.com",
      sort_order: 0,
    },
  ];
}

export function CardEditorPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const authReady = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const isGuestCreationPath =
    location.pathname === "/create-card" || location.pathname === "/card/create";
  const isGuestRoute = Boolean(isGuestCreationPath && authReady && !user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardLinks = useAppDataStore((s) => s.cardLinks);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const setCardLinks = useAppDataStore((s) => s.setCardLinks);
  const addPayment = useAppDataStore((s) => s.addPayment);
  const addToPromotionPool = useAppDataStore((s) => s.addToPromotionPool);

  const isNew = !id || id === "new";
  const wantsSample = useMemo(() => parseWantsSample(location.search), [location.search]);

  const revenueTemplateId = useMemo((): RevenueCardTemplateId | null => {
    if (!isNew) return null;
    const fromIndustry = parseIndustryQuery(location.search);
    if (fromIndustry) return fromIndustry;
    return parseRevenueTemplateSearch(location.search);
  }, [isNew, location.search]);

  const routeKey = useMemo(() => {
    if (isGuestRoute) {
      if (wantsSample) return "create-card-sample";
      return revenueTemplateId ? `create-card-${revenueTemplateId}` : "create-card";
    }
    if (!isNew && id) return id;
    if (revenueTemplateId) return `new-revenue-${revenueTemplateId}`;
    return wantsSample ? "new-sample" : "new";
  }, [isGuestRoute, isNew, id, wantsSample, revenueTemplateId]);

  const existing = useMemo(
    () => (!isNew && id ? businessCards.find((c) => c.id === id) : undefined),
    [businessCards, id, isNew],
  );

  const existingLinks = useMemo(() => {
    if (!existing) return [];
    return getLinksForCard(existing.id, cardLinks);
  }, [cardLinks, existing]);

  const replaceDraft = useCardEditorDraftStore((s) => s.replaceDraft);
  const setHydratedKey = useCardEditorDraftStore((s) => s.setHydratedKey);
  const setDraft = useCardEditorDraftStore((s) => s.setDraft);

  useEffect(() => {
    if (!existing?.brand_image_pending_path?.trim() || existing.brand_image_status !== "pending") return;
    if (!isSupabaseConfigured || !supabase) return;
    const path = existing.brand_image_pending_path.trim();
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.storage
        .from(getPendingImageBucket())
        .createSignedUrl(path, 3600);
      if (cancelled || error || !data?.signedUrl) return;
      const approvedKeep =
        existing.brand_image_url?.trim() || existing.image_url?.trim() || existing.imageUrl?.trim() || null;
      setDraft({
        imageUrl: data.signedUrl,
        brand_image_url: data.signedUrl,
        brand_image_status: "pending",
        brand_image_pending_path: path,
        approved_public_hero_url: approvedKeep,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    existing?.brand_image_pending_path,
    existing?.brand_image_status,
    existing?.brand_image_url,
    existing?.image_url,
    existing?.imageUrl,
    setDraft,
  ]);

  const [linkRows, setLinkRows] = useState<LinkRow[]>(() => mapLinksToRows(existingLinks));
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autosaveBump, setAutosaveBump] = useState(0);
  const [shareExpandCue, setShareExpandCue] = useState(0);
  const [shareOrigin, setShareOrigin] = useState("");
  const [journeyStep, setJourneyStep] = useState<"start" | "promotion" | "education" | "instructor">("start");
  const [expansionTrack, setExpansionTrack] = useState<"blog" | "video" | "automation" | null>(null);
  const [userSkillLevel, setUserSkillLevel] = useState<"low" | "high">("low");
  const [educationMode, setEducationMode] = useState<"online" | "offline">("online");
  const [sampleLadderActive, setSampleLadderActive] = useState(() => wantsSample);
  const [sampleWizardOpen, setSampleWizardOpen] = useState(false);
  const [delegateAssistOpen, setDelegateAssistOpen] = useState(false);
  const [growthFlash, setGrowthFlash] = useState<string | null>(null);
  const [paidBusy, setPaidBusy] = useState(false);
  /** 스토어에 카드가 없을 때 Supabase에서 단건 로드 (직접 URL 진입 등) */
  const [editorBootstrap, setEditorBootstrap] = useState<"pending" | "ready" | "missing">("pending");

  const newCardIdRef = useRef<string | null>(null);
  /** 신규 편집용 임시 카드 UUID — 업로드·원격 업서트에 사용 (저장 버튼과 동일한 id 우선 확보) */
  const [stagingEditorCardId, setStagingEditorCardId] = useState<string | null>(null);
  /** 가입 후 첫 저장 시 로컬 임시 미리보기 삭제 */
  const pendingTempIdRef = useRef<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draft = useCardEditorDraftStore((s) => s.draft);

  /** 저장된 카드 편집 시 QR·인쇄 패널용 스냅샷 */
  const exportCardForPrint = useMemo(() => {
    if (!existing?.id || !user || isGuestRoute) return null;
    const c = draftToBusinessCard(draft, {
      id: existing.id,
      user_id: user.id,
      created_at: existing.created_at,
    });
    return {
      ...c,
      expire_at: existing.expire_at ?? c.expire_at,
      status: existing.status ?? c.status,
      qr_image_url: existing.qr_image_url ?? c.qr_image_url,
      design_type: c.design_type ?? existing.design_type,
    };
  }, [draft, existing, user, isGuestRoute]);

  const [searchParams] = useSearchParams();
  const savedHighlight = searchParams.get("saved") === "1";
  const welcomeHighlight = searchParams.get("welcome") === "1";

  const [guestTempId, setGuestTempId] = useState<string | null>(null);
  const [guestAuthSaveOpen, setGuestAuthSaveOpen] = useState(false);
  const [guestHeroAuthOpen, setGuestHeroAuthOpen] = useState(false);
  const [postAuthHeroReminderOpen, setPostAuthHeroReminderOpen] = useState(false);

  /** 히어로 가입 플로우: 동일 페이지 생명 주기 안에서 안내 배너·스크롤을 한 번만 띄웁니다 */
  const postAuthHeroCueOnceRef = useRef(false);

  const hydratedKey = useCardEditorDraftStore((s) => s.hydratedKey);
  const persistGuestPendingFromEditor = useCallback(() => {
    const landing = getLandingEmail()?.trim();
    const current = useCardEditorDraftStore.getState().draft;
    if (landing && !current.email.trim()) {
      replaceDraft({ ...current, email: landing });
    }
    const tid = guestTempId ?? getOrCreateGuestTempId();
    setGuestTempId(tid);
    savePendingCardDraft({
      draft: useCardEditorDraftStore.getState().draft,
      linkRows,
      tempId: tid,
      deferAutoFlush: true,
    });
  }, [guestTempId, linkRows, replaceDraft]);

  const prepareGuestHeroImageSignupResume = useCallback(() => {
    persistGuestPendingFromEditor();
    setPendingHeroResumeAfterAuth();
  }, [persistGuestPendingFromEditor]);

  const completionShareUrl = useMemo(() => {
    const o = canonicalSiteOrigin();
    return buildCardShareUrl(o, draft.slug.trim());
  }, [draft.slug]);

  const promoShareText = useMemo(
    () =>
      completionShareUrl ? resolvePromoShareTextWithIndustryTemplate(completionShareUrl, draft) : "",
    [completionShareUrl, draft],
  );

  const blogShareSnippet = useMemo(() => {
    if (!completionShareUrl) return "";
    const introLines = draft.intro
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const body =
      introLines.slice(0, 2).join("\n") ||
      "공간을 바꾸면 삶이 바뀐다는 마음으로 인테리어 상담을 진행하고 있습니다.";
    return `안녕하세요.\n${body}\n\n아래 링크에서 시공 분야와 상담 방법을 확인하실 수 있습니다.\n\n${completionShareUrl}\n`;
  }, [completionShareUrl, draft.intro]);

  const assetPreviewCard = useMemo(() => {
    if (!user || !id || id === "new") return null;
    return draftToBusinessCard(draft, {
      id,
      user_id: user.id,
      created_at: existing?.created_at ?? new Date().toISOString(),
    });
  }, [draft, existing?.created_at, id, user]);

  const heroImageUrlForDownload = assetPreviewCard ? getCardHeroImageUrl(assetPreviewCard) : "";

  useEffect(() => {
    setShareOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (isGuestRoute || !isNew || existing || !user) return;
    if (!newCardIdRef.current) newCardIdRef.current = crypto.randomUUID();
    setStagingEditorCardId((prev) => prev ?? newCardIdRef.current);
  }, [isGuestRoute, isNew, existing, user]);

  useEffect(() => {
    if (wantsSample) setSampleLadderActive(true);
  }, [wantsSample]);

  useEffect(() => {
    if (!growthFlash) return;
    const t = window.setTimeout(() => setGrowthFlash(null), 6500);
    return () => window.clearTimeout(t);
  }, [growthFlash]);

  useEffect(() => {
    if (!savedHighlight || !welcomeHighlight || !draft.is_public || !completionShareUrl) return;
    const el = document.getElementById("card-save-complete");
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [savedHighlight, welcomeHighlight, draft.is_public, completionShareUrl]);

  useEffect(() => {
    if (!user || !isNew || existing || isGuestRoute) return;
    if (!peekPendingHeroResumeAfterAuth()) return;
    if (hydratedKey !== routeKey) return;
    if (postAuthHeroCueOnceRef.current) return;
    postAuthHeroCueOnceRef.current = true;
    setPostAuthHeroReminderOpen(true);
    requestAnimationFrame(() => scrollToId("linko-editor-hero-upload"));
  }, [user, isNew, existing, isGuestRoute, hydratedKey, routeKey]);

  useEffect(() => {
    if (isGuestRoute) return;
    setLinkRows(mapLinksToRows(existingLinks));
  }, [existing?.id, existingLinks, isGuestRoute]);

  /** 게스트 /create-card · 가입 후 복원 · ?sample=true 등 · 일반 신규 순으로 주입 */
  useEffect(() => {
    if (isGuestRoute && !user) {
      const state = useCardEditorDraftStore.getState();
      if (state.hydratedKey === routeKey) return;

      const emailHint = getLandingEmail()?.trim();
      if (wantsSample) {
        replaceDraft(
          createEmptyDraft({
            email: emailHint ?? "",
          }),
        );
        setLinkRows(mapLinksToRows([]));
        setGuestTempId(resetGuestTempId());
        queueMicrotask(() => setSampleWizardOpen(true));
      } else {
        const pending = peekPendingCardDraft();
        if (pending?.draft) {
          replaceDraft(mergeDraftDefaults(pending.draft));
          setLinkRows(
            pending.linkRows?.length
              ? pending.linkRows.map((r) => ({
                  id: r.id,
                  label: r.label,
                  type: r.type,
                  url: r.url,
                }))
              : mapLinksToRows([]),
          );
          if (pending.tempId) {
            setGuestTempSessionId(pending.tempId);
            setGuestTempId(pending.tempId);
          } else {
            setGuestTempId(getOrCreateGuestTempId());
          }
        } else if (revenueTemplateId) {
          const emailHintFallback = emailHint ?? "";
          replaceDraft({
            ...mergeIndustryCopyIntoDraft(
              buildRevenueCardDraft(revenueTemplateId, {
                person_name: DEFAULT_CARD_PERSON_NAME,
                email: emailHintFallback,
              }),
              getIndustryTemplate(revenueTemplateId),
            ),
            card_industry: cardIndustryPayloadFromTemplateId(revenueTemplateId),
          });
          const tmpl = getIndustryTemplate(revenueTemplateId);
          const primaryLabel = applyCtaLabelToPrimaryLinkLabel(tmpl.ctaText);
          const rawLinks = buildRevenueTemplateLinkRows(revenueTemplateId);
          setLinkRows(
            rawLinks.map((r, i) => ({
              id: r.id,
              label: i === 0 ? primaryLabel : r.label,
              type: r.type as CardLinkType,
              url: r.url,
            })),
          );
          setGuestTempId(getOrCreateGuestTempId());
        } else {
          replaceDraft(createEmptyDraft({ email: emailHint ?? "" }));
          setLinkRows(mapLinksToRows([]));
          setGuestTempId(getOrCreateGuestTempId());
        }
      }
      setHydratedKey(routeKey);
      return;
    }

    if (!isGuestRoute && location.pathname === "/cards/new" && isNew && user) {
      const pending = peekPendingCardDraft();
      if (pending) {
        pendingTempIdRef.current = pending.tempId ?? null;
        replaceDraft(mergeDraftDefaults(pending.draft));
        setLinkRows(
          pending.linkRows && pending.linkRows.length > 0
            ? pending.linkRows.map((r) => ({
                id: r.id,
                label: r.label,
                type: r.type,
                url: r.url,
              }))
            : mapLinksToRows([]),
        );
        clearLandingEmail();
        setHydratedKey(routeKey);
        return;
      }
    }

    if (
      !isGuestRoute &&
      location.pathname === "/cards/new" &&
      isNew &&
      user &&
      revenueTemplateId &&
      !wantsSample &&
      !existing
    ) {
      const st = useCardEditorDraftStore.getState();
      if (st.hydratedKey === routeKey) return;
      replaceDraft({
        ...mergeIndustryCopyIntoDraft(
          buildRevenueCardDraft(revenueTemplateId, {
            person_name: user.name?.trim() || DEFAULT_CARD_PERSON_NAME,
            email: user.email ?? "",
          }),
          getIndustryTemplate(revenueTemplateId),
        ),
        card_industry: cardIndustryPayloadFromTemplateId(revenueTemplateId),
      });
      const tmplMem = getIndustryTemplate(revenueTemplateId);
      const primaryLabelMem = applyCtaLabelToPrimaryLinkLabel(tmplMem.ctaText);
      const rawLinksMem = buildRevenueTemplateLinkRows(revenueTemplateId);
      setLinkRows(
        rawLinksMem.map((r, i) => ({
          id: r.id,
          label: i === 0 ? primaryLabelMem : r.label,
          type: r.type as CardLinkType,
          url: r.url,
        })),
      );
      setHydratedKey(routeKey);
      return;
    }

    if (
      !isGuestRoute &&
      location.pathname === "/cards/new" &&
      isNew &&
      user &&
      wantsSample &&
      !existing
    ) {
      const state = useCardEditorDraftStore.getState();
      if (state.hydratedKey === routeKey) return;
      replaceDraft(
        createEmptyDraft({
          person_name: user.name?.trim() || DEFAULT_CARD_PERSON_NAME,
          email: user.email?.trim() ?? "",
        }),
      );
      setLinkRows(mapLinksToRows([]));
      setHydratedKey(routeKey);
      queueMicrotask(() => setSampleWizardOpen(true));
      return;
    }

    if (!isNew && id && !existing) return;
    const state = useCardEditorDraftStore.getState();
    if (state.hydratedKey === routeKey) return;

    if (existing) {
      replaceDraft(draftFromBusinessCard(existing));
    } else if (isNew && user) {
      replaceDraft(
        createEmptyDraft({
          person_name: user.name?.trim() || DEFAULT_CARD_PERSON_NAME,
          email: user?.email ?? "",
        }),
      );
    }
    setHydratedKey(routeKey);
  }, [
    isGuestRoute,
    wantsSample,
    user,
    location.pathname,
    routeKey,
    isNew,
    id,
    existing,
    user?.name,
    user?.email,
    replaceDraft,
    setHydratedKey,
    revenueTemplateId,
  ]);

  useEffect(() => {
    const hydrated = useCardEditorDraftStore.getState().hydratedKey === routeKey;
    if (!hydrated) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const dly = useCardEditorDraftStore.getState().draft;
      const parsed = parseCardEditorDraft(dly);
      const rowPayload = linkRows.map((r) => ({
        id: r.id,
        label: r.label,
        type: r.type,
        url: r.url,
      }));

      setAutosaveStatus("saving");

      if (isGuestRoute && !user) {
        const tid = guestTempId;
        if (tid && parsed.success) {
          saveTempCard(tid, { draft: dly, linkRows: rowPayload });
          void syncTempPreviewRemote({
            tempId: tid,
            draft: dly,
            linkRows: rowPayload,
            shareUrl: buildTempPreviewUrl(window.location.origin, tid, dly.card_type) ?? undefined,
            state: "guest",
          }).then((ok) => {
            if (ok === false) setAutosaveStatus("error");
            else {
              setAutosaveStatus("saved");
              if (autosaveStatusTimerRef.current) clearTimeout(autosaveStatusTimerRef.current);
              autosaveStatusTimerRef.current = setTimeout(() => setAutosaveStatus("idle"), 2200);
            }
          }).catch(() => setAutosaveStatus("error"));
        }
        savePendingCardDraft({
          draft: dly,
          linkRows: rowPayload,
          tempId: tid ?? undefined,
          deferAutoFlush: true,
        });
        if (!tid || !parsed.success) {
          if (autosaveStatusTimerRef.current) clearTimeout(autosaveStatusTimerRef.current);
          setAutosaveStatus("saved");
          autosaveStatusTimerRef.current = setTimeout(() => setAutosaveStatus("idle"), 2200);
        }
        return;
      }

      if (parsed.success) {
        let cardId: string | undefined = existing?.id;
        if (!cardId && user && !isGuestRoute && isNew) {
          if (!newCardIdRef.current) newCardIdRef.current = crypto.randomUUID();
          cardId = newCardIdRef.current;
        }
        if (cardId) {
          const uid = user?.id ?? INSTANT_GUEST_USER_ID;
          const card = draftToBusinessCard(dly, {
            id: cardId,
            user_id: uid,
            created_at: existing?.created_at ?? new Date().toISOString(),
          });
          upsertBusinessCard({
            ...card,
            expire_at: existing?.expire_at ?? card.expire_at,
            status: existing?.status ?? card.status,
            qr_image_url: existing?.qr_image_url ?? card.qr_image_url,
          });
          setCardLinks(cardId, draftLinkRowsToCardLinks(dly, linkRows, cardId));
        }
      }

      if (autosaveStatusTimerRef.current) clearTimeout(autosaveStatusTimerRef.current);
      setAutosaveStatus("saved");
      autosaveStatusTimerRef.current = setTimeout(() => setAutosaveStatus("idle"), 2200);
    }, 620);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (autosaveStatusTimerRef.current) clearTimeout(autosaveStatusTimerRef.current);
    };
  }, [
    draft,
    linkRows,
    routeKey,
    autosaveBump,
    existing?.id,
    existing?.created_at,
    user,
    isGuestRoute,
    isNew,
    upsertBusinessCard,
    setCardLinks,
    guestTempId,
  ]);

  const heroShareEligible = useMemo(() => {
    const parsed = parseCardEditorDraft(draft);
    return parsed.success && draft.is_public;
  }, [draft]);

  const heroShareUrl = useMemo(() => {
    if (!heroShareEligible) return "";
    const origin = editorOriginFallback(shareOrigin);
    if (!origin) return "";
    if (isGuestRoute && !user && guestTempId) {
      return buildTempPreviewUrl(origin, guestTempId, draft.card_type) ?? "";
    }
    return buildCardShareUrl(origin, draft.slug.trim()) ?? "";
  }, [heroShareEligible, shareOrigin, draft.slug, isGuestRoute, user, guestTempId]);

  const prepareGuestPreviewForKakao = useCallback(async (): Promise<boolean> => {
    if (!(isGuestRoute && !user && guestTempId)) return true;
    const rowPayload = linkRows.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      url: r.url,
    }));
    saveTempCard(guestTempId, { draft, linkRows: rowPayload });
    savePendingCardDraft({
      draft,
      linkRows: rowPayload,
      tempId: guestTempId,
      deferAutoFlush: true,
    });
    return syncTempPreviewRemote({
      tempId: guestTempId,
      draft,
      linkRows: rowPayload,
      shareUrl: buildTempPreviewUrl(window.location.origin, guestTempId, draft.card_type) ?? undefined,
      state: "guest",
    });
  }, [draft, guestTempId, isGuestRoute, linkRows, user]);

  const applyPhraseFromWizard = useCallback(
    (r: FillSampleWizardResult) => {
      const emailFallback = getLandingEmail()?.trim() || user?.email?.trim() || "hello@linko.app";
      replaceDraft(
        applyCardSamplePhrase({
          kind: r.kind,
          subcategoryId: r.subcategoryId,
          phrase: r.phrase,
          categoryLabel: r.categoryLabel,
          industryLabel: r.industryLabel,
          emailFallback,
        }),
      );
      setLinkRows(
        seedLinkTemplates({
          contactLabel: r.phrase.contactButtonText,
          detailLabel: r.phrase.detailButtonText,
          tel: SAMPLE_TEMPLATE_PHONE,
        }).map((row) => ({
          id: row.id,
          label: row.label,
          type: row.type as CardLinkType,
          url: row.url,
        })),
      );
      setFieldErrors({});
      if (isGuestRoute && !user) {
        setGuestTempId(resetGuestTempId());
      } else {
        clearEditorLiveCardId();
      }
      clearInstantCardId();
      newCardIdRef.current = null;
      setStagingEditorCardId(null);
      setSampleLadderActive(true);
      setSampleWizardOpen(false);
    },
    [replaceDraft, user?.email, isGuestRoute, user],
  );

  const applyEmptyDraft = useCallback(() => {
    replaceDraft(
      createEmptyDraft({
        email: getLandingEmail()?.trim() || user?.email?.trim() || "",
        person_name: user?.name?.trim() || DEFAULT_CARD_PERSON_NAME,
      }),
    );
    setLinkRows(mapLinksToRows([]));
    setFieldErrors({});
    if (isGuestRoute && !user) {
      setGuestTempId(resetGuestTempId());
    } else {
      clearEditorLiveCardId();
    }
    clearInstantCardId();
    newCardIdRef.current = null;
    setStagingEditorCardId(null);
    setSampleLadderActive(false);
  }, [replaceDraft, user?.email, user?.name, isGuestRoute, user]);

  const applyInstantIndustrySample = useCallback(() => {
    if (!isNew) return;

    const tid = revenueTemplateId ?? DEFAULT_EDITOR_SAMPLE_REVENUE_ID;
    const persona = user?.name?.trim() || DEFAULT_CARD_PERSON_NAME;
    const emailFallback = user?.email?.trim() || getLandingEmail()?.trim() || "";

    replaceDraft({
      ...mergeIndustryCopyIntoDraft(
        buildRevenueCardDraft(tid, {
          person_name: persona,
          email: emailFallback,
        }),
        getIndustryTemplate(tid),
      ),
      card_industry: cardIndustryPayloadFromTemplateId(tid),
    });

    const tmpl = getIndustryTemplate(tid);
    const primaryLabel = applyCtaLabelToPrimaryLinkLabel(tmpl.ctaText);
    const rawLinks = buildRevenueTemplateLinkRows(tid);
    setLinkRows(
      rawLinks.map((r, i) => ({
        id: r.id,
        label: i === 0 ? primaryLabel : r.label,
        type: r.type as CardLinkType,
        url: r.url,
      })),
    );

    setFieldErrors({});
    clearInstantCardId();
    newCardIdRef.current = null;
    setStagingEditorCardId(null);
    setSampleLadderActive(true);
    setSampleWizardOpen(false);

    if (!isGuestRoute && user && location.pathname === "/cards/new") {
      navigate(`/cards/new?industry=${encodeURIComponent(tid)}`, { replace: true });
    } else if (isGuestRoute && !user) {
      const sp = new URLSearchParams(location.search);
      sp.set("industry", tid);
      const qs = sp.toString();
      navigate(`/card/create${qs ? `?${qs}` : ""}`, { replace: true });
    }

    const nextHydrationKey = isGuestRoute
      ? wantsSample
        ? "create-card-sample"
        : `create-card-${tid}`
      : wantsSample
        ? "new-sample"
        : `new-revenue-${tid}`;

    setHydratedKey(nextHydrationKey);
    requestAnimationFrame(() => scrollToId("card-preview-hero"));
  }, [
    isNew,
    revenueTemplateId,
    user?.name,
    user?.email,
    user,
    isGuestRoute,
    wantsSample,
    replaceDraft,
    setHydratedKey,
    navigate,
    location.pathname,
    location.search,
  ]);

  const persistUploadedHero = useCallback(
    async (payload: BrandImagePersistPayload) => {
      if (!user || isGuestRoute) return;
      const cid = existing?.id ?? stagingEditorCardId;
      if (!cid) return;
      if (!payload.pendingPath) return;

      let dly = useCardEditorDraftStore.getState().draft;
      const stagedSlug =
        dly.slug.trim().length >= 2 ? dly.slug.trim() : `staging-${cid.replace(/-/g, "").slice(0, 18)}`;
      if (dly.slug.trim().length < 2) {
        setDraft({ slug: stagedSlug });
        dly = useCardEditorDraftStore.getState().draft;
      }

      const introFallback = dly.intro.trim() || "-";
      const jobFallback = dly.job_title.trim() || "-";
      let brand = dly.brand_name.trim();
      if ((dly.card_type === "store" || dly.card_type === "location") && !brand) {
        brand = "브랜드명";
      }
      if (introFallback !== dly.intro.trim() || jobFallback !== dly.job_title.trim() || brand !== dly.brand_name.trim()) {
        setDraft({
          intro: introFallback,
          job_title: jobFallback,
          brand_name: brand,
        });
        dly = useCardEditorDraftStore.getState().draft;
      }

      const nw = payload.naturalW ?? 1;
      const nh = payload.naturalH ?? 1;
      const prev = businessCards.find((c) => c.id === cid);
      const approvedKeep =
        prev?.brand_image_url?.trim() || prev?.image_url?.trim() || prev?.imageUrl?.trim() || null;

      setDraft({
        imageUrl: payload.displayUrl,
        brand_image_url: payload.displayUrl,
        brand_image_status: "pending",
        brand_image_pending_path: payload.pendingPath,
        brand_image_reject_reason: null,
        approved_public_hero_url: approvedKeep,
        brand_image_natural_width: nw,
        brand_image_natural_height: nh,
        brand_image_zoom: 1,
        brand_image_pan_x: 0,
        brand_image_pan_y: 0,
        brand_image_legacy_object_position: null,
      });

      const d2 = useCardEditorDraftStore.getState().draft;
      const cardRow = draftToBusinessCard(d2, {
        id: cid,
        user_id: user.id,
        created_at: existing?.created_at ?? new Date().toISOString(),
      });
      const nowIso = new Date().toISOString();
      const next = {
        ...cardRow,
        profile_image_url: null as string | null,
        brand_image_object_position: null as string | null,
        brand_image_status: "pending" as const,
        brand_image_pending_path: payload.pendingPath,
        brand_image_reject_reason: null as string | null,
        brand_image_pending_uploaded_at: nowIso,
        brand_image_natural_width: nw,
        brand_image_natural_height: nh,
        brand_image_zoom: 1 as number | null,
        brand_image_pan_x: 0 as number | null,
        brand_image_pan_y: 0 as number | null,
      };
      const persistedCard = {
        ...next,
        expire_at: existing?.expire_at ?? next.expire_at,
        status: existing?.status ?? next.status,
        qr_image_url: existing?.qr_image_url ?? next.qr_image_url,
      };
      upsertBusinessCard(persistedCard);
      await upsertCardRemote(persistedCard);
    },
    [
      user,
      isGuestRoute,
      existing?.id,
      existing?.created_at,
      existing?.expire_at,
      existing?.status,
      existing?.qr_image_url,
      stagingEditorCardId,
      businessCards,
      upsertBusinessCard,
      upsertCardRemote,
      setDraft,
    ],
  );

  const persistClearHero = useCallback(async () => {
    if (!user || isGuestRoute) return;
    const cid = existing?.id ?? stagingEditorCardId;
    if (!cid) return;
    const patch = {
      imageUrl: null as string | null,
      brand_image_url: null as string | null,
      image_url: null as string | null,
      profile_image_url: null as string | null,
      brand_image_natural_width: null as number | null,
      brand_image_natural_height: null as number | null,
      brand_image_zoom: null as number | null,
      brand_image_pan_x: null as number | null,
      brand_image_pan_y: null as number | null,
      brand_image_object_position: null as string | null,
      brand_image_status: null as BusinessCard["brand_image_status"],
      brand_image_pending_path: null as string | null,
      brand_image_reject_reason: null as string | null,
      brand_image_pending_uploaded_at: null as string | null,
    };
    const remoteOk = await patchCardBrandHeroRemote(cid, patch);
    const row = businessCards.find((c) => c.id === cid);
    if (remoteOk && row) upsertBusinessCard({ ...row, ...patch });
    if (remoteOk) {
      setDraft({
        imageUrl: null,
        brand_image_url: null,
        approved_public_hero_url: null,
        brand_image_status: null,
        brand_image_pending_path: null,
        brand_image_reject_reason: null,
        brand_image_natural_width: null,
        brand_image_natural_height: null,
        brand_image_zoom: 1,
        brand_image_pan_x: 0,
        brand_image_pan_y: 0,
        brand_image_legacy_object_position: null,
      });
    }
  }, [businessCards, existing?.id, isGuestRoute, stagingEditorCardId, user, upsertBusinessCard, setDraft]);

  const handleBrandImagePersist = persistUploadedHero;

  const runPaidActivation = useCallback(async () => {
    if (isGuestRoute && !user) {
      setGrowthFlash("가입 후 명함을 저장하면 프로 기능을 이용할 수 있어요.");
      scrollToId("final-save");
      return;
    }
    const d = useCardEditorDraftStore.getState().draft;
    const parsed = parseCardEditorDraft(d);
    if (!parsed.success) {
      setFieldErrors(zodIssuesToFieldErrors(parsed.error.issues));
      setGrowthFlash("필수 정보를 채운 뒤 활성화할 수 있어요.");
      scrollToId("studio-fields");
      return;
    }
    const price = 9900;
    if (
      !window.confirm(
        `데모 결제 시뮬레이션: ${price.toLocaleString()}원이 청구되는 것으로 처리하고, 명함을 저장하고 공개로 켤까요?`,
      )
    )
      return;

    setPaidBusy(true);
    try {
      let cardId: string | undefined = existing?.id;
      if (!cardId && user && !isGuestRoute && isNew) {
        if (!newCardIdRef.current) newCardIdRef.current = crypto.randomUUID();
        cardId = newCardIdRef.current;
      }
      if (!cardId) cardId = crypto.randomUUID();

      const uid = user?.id ?? INSTANT_GUEST_USER_ID;
      const nextDraft = { ...d, is_public: true };
      setDraft({ is_public: true });
      const card = draftToBusinessCard(nextDraft, {
        id: cardId,
        user_id: uid,
        created_at: existing?.created_at ?? new Date().toISOString(),
      });
      const persistedCard = {
        ...card,
        expire_at: existing?.expire_at ?? card.expire_at,
        status: existing?.status ?? card.status,
      };
      upsertBusinessCard(persistedCard);
      setCardLinks(cardId, draftLinkRowsToCardLinks(nextDraft, linkRows, cardId));
      addPayment({
        id: crypto.randomUUID(),
        user_id: uid,
        amount: price,
        payment_type: "linko_card_pro",
        status: "completed",
        created_at: new Date().toISOString(),
      });
      if (uid !== INSTANT_GUEST_USER_ID) {
        const remoteOk = await upsertCardRemote(persistedCard);
        if (!remoteOk) {
          setGrowthFlash("결제 처리는 했지만 서버에 명함을 저장하지 못했습니다. 「저장」으로 다시 시도해 주세요.");
        } else {
          await recordPaymentAndReferralReward({ planType: "linko_card_pro", amount: price });
          setGrowthFlash("결제(데모) 완료 · 서버 명함 저장 · 공개가 켜졌습니다.");
        }
      } else {
        setGrowthFlash("결제(데모) 완료 · 명함 저장 · 공개가 켜졌습니다.");
      }
    } finally {
      setPaidBusy(false);
    }
  }, [
    addPayment,
    existing?.created_at,
    existing?.id,
    isGuestRoute,
    isNew,
    linkRows,
    setCardLinks,
    setDraft,
    upsertBusinessCard,
    upsertCardRemote,
    user,
  ]);

  const runPromotionRequest = useCallback(() => {
    if (isGuestRoute && !user) {
      setGrowthFlash("가입 후 명함을 저장하면 홍보 풀에 올릴 수 있어요.");
      return;
    }
    const d = useCardEditorDraftStore.getState().draft;
    const parsed = parseCardEditorDraft(d);
    if (!parsed.success) {
      setFieldErrors(zodIssuesToFieldErrors(parsed.error.issues));
      setGrowthFlash("필수 정보를 먼저 맞춰 주세요.");
      scrollToId("studio-fields");
      return;
    }
    if (!d.is_public) {
      setGrowthFlash("공개 명함만 홍보 풀에 올릴 수 있어요. 먼저 「실제 사용하기」로 공개를 켜거나 공개 설정을 저장해 주세요.");
      scrollToId("studio-fields");
      return;
    }

    let cardId = existing?.id ?? newCardIdRef.current;
    if (!cardId) {
      setGrowthFlash("명함이 저장되는 중이에요. 잠시 후 다시 눌러 주세요.");
      return;
    }

    const added = addToPromotionPool({
      card_id: cardId,
      slug: d.slug.trim(),
      brand_name: d.brand_name.trim() || d.person_name.trim() || "명함",
      person_name: d.person_name.trim() || d.brand_name.trim() || "",
    });
    setGrowthFlash(
      added ? "홍보 풀에 등록되었습니다. 홍보 파트너 화면에 노출돼요." : "이미 홍보 풀에 등록된 명함이에요.",
    );
  }, [addToPromotionPool, existing?.id, isGuestRoute, user]);

  const startExpansionJourney = useCallback(
    (track: "blog" | "video" | "automation") => {
      setExpansionTrack(track);
      setJourneyStep("promotion");
      setGrowthFlash(
        track === "blog"
          ? "블로그 확장 흐름을 열었어요. 필요한 수준에 맞춰 교육 또는 제작 전문가 위임을 선택해 보세요."
          : track === "video"
            ? "영상 확장 흐름을 열었어요. 혼자 진행이 어렵다면 교육/제작 전문가 위임으로 이어집니다."
            : "자동화 시스템 흐름을 열었어요. 학습 또는 위임으로 빠르게 구축할 수 있어요.",
      );
    },
    [],
  );

  const moveToEducationStep = useCallback(() => {
    setJourneyStep("education");
    navigate(`/education?track=${encodeURIComponent(expansionTrack || "both")}&mode=${educationMode}`);
  }, [educationMode, expansionTrack, navigate]);

  const isLiveGenerator = isGuestRoute || isNew;

  const dismissSaveBanner = useCallback(() => {
    if (!id) return;
    navigate(`/cards/${id}/edit`, { replace: true });
  }, [id, navigate]);

  const handleQuickThreeSecondCard = useCallback(async () => {
    const tid = revenueTemplateId;
    if (!tid || !user || !location.pathname.includes("/cards/new")) return;
    setSubmitting(true);
    try {
      const tmpl = getIndustryTemplate(tid);
      let nextDraft = buildRevenueCardDraft(tid, {
        person_name: user.name?.trim() || DEFAULT_CARD_PERSON_NAME,
        email: user.email ?? "",
      });
      nextDraft = mergeIndustryCopyIntoDraft(nextDraft, tmpl);
      nextDraft = { ...nextDraft, card_industry: cardIndustryPayloadFromTemplateId(tid) ?? null };
      const cardId = crypto.randomUUID();
      const card = draftToBusinessCard(nextDraft, {
        id: cardId,
        user_id: user.id,
        created_at: new Date().toISOString(),
      });
      upsertBusinessCard(card);
      const persisted = await upsertCardRemote(card);
      if (!persisted) {
        setGrowthFlash("서버에 명함을 저장하지 못했습니다. 네트워크 또는 Supabase 설정을 확인한 뒤 다시 시도해 주세요.");
        return;
      }
      try {
        const synced = await syncQrImageAfterSave(card);
        upsertBusinessCard(synced);
        const qrOk = await upsertCardRemote(synced);
        if (!qrOk) console.warn("[CardEditorPage] quick QR 서버 업데이트 실패");
      } catch (err) {
        console.warn("[CardEditorPage] quick QR 동기화", err);
      }
      const rawLinks = buildRevenueTemplateLinkRows(tid);
      const primaryLabel = applyCtaLabelToPrimaryLinkLabel(tmpl.ctaText);
      const links: CardLink[] = rawLinks.map((r, i) => ({
        id: r.id,
        card_id: cardId,
        label: i === 0 ? primaryLabel : r.label,
        type: r.type,
        url: r.url,
        sort_order: i,
      }));
      setCardLinks(cardId, links);
      clearPendingCardDraft();
      const slugQuick = nextDraft.slug.trim();
      if (nextDraft.is_public && slugQuick) {
        navigate(`/cards/${cardId}/edit?saved=1&welcome=1`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true, state: { [SHOW_PENDING_CARD_SAVED_STATE]: true } });
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    revenueTemplateId,
    user,
    location.pathname,
    upsertBusinessCard,
    upsertCardRemote,
    setGrowthFlash,
    setCardLinks,
    navigate,
  ]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const draft = useCardEditorDraftStore.getState().draft;
    const parsed = parseCardEditorDraft(draft);
    if (!parsed.success) {
      setFieldErrors(zodIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    if (isGuestRoute && !user) {
      setGuestAuthSaveOpen(true);
      return;
    }

    if (!user) return;

    setSubmitting(true);
    try {
      let cardId = existing?.id ?? newCardIdRef.current;
      if (!cardId) cardId = crypto.randomUUID();

      const slugTrim = draft.slug.trim();
      if (businessCards.some((c) => c.slug === slugTrim && c.id !== cardId)) {
        setFieldErrors({ slug: "이미 사용 중인 공개 주소예요. 다른 이름을 입력해 주세요." });
        return;
      }

      const remoteTaken = await isSlugTakenOnRemoteByAnotherCard(slugTrim, cardId);
      if (remoteTaken === true) {
        setFieldErrors({ slug: "이미 사용 중인 공개 주소예요. 다른 이름을 입력해 주세요." });
        return;
      }

      if (!existing) newCardIdRef.current = cardId;

      const card = draftToBusinessCard(draft, {
        id: cardId,
        user_id: user.id,
        created_at: existing?.created_at ?? new Date().toISOString(),
      });
      const nextCard = {
        ...card,
        expire_at: existing?.expire_at ?? card.expire_at,
        status: existing?.status ?? card.status,
      };
      upsertBusinessCard(nextCard);
      const persisted = await upsertCardRemote(nextCard);
      if (!persisted) {
        setGrowthFlash("서버에 명함을 저장하지 못했습니다. 네트워크 또는 Supabase 설정을 확인한 뒤 다시 시도해 주세요.");
        return;
      }

      try {
        const synced = await syncQrImageAfterSave(nextCard);
        upsertBusinessCard(synced);
        const qrSynced = await upsertCardRemote(synced);
        if (!qrSynced) {
          console.warn("[CardEditorPage] QR 정보 서버 저장 실패");
        }
      } catch (err) {
        console.warn("[CardEditorPage] QR 이미지 동기화", err);
      }

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
                url: draft.website_url.trim() || "https://example.com",
                sort_order: 0,
              },
            ];
      setCardLinks(cardId, finalLinks);
      const clearTemp = pendingTempIdRef.current;
      if (clearTemp) {
        removeTempCard(clearTemp);
        clearGuestTempId();
        pendingTempIdRef.current = null;
      }
      if (isNew) {
        clearPendingCardDraft();
      }
      const firstCreationPath =
        user &&
        isNew &&
        (location.pathname === "/cards/new" ||
          location.pathname === "/create-card" ||
          location.pathname === "/card/create");
      const canShareCompletion = Boolean(draft.is_public && slugTrim && firstCreationPath);
      if (canShareCompletion) {
        navigate(`/cards/${cardId}/edit?saved=1&welcome=1`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true, state: { [SHOW_PENDING_CARD_SAVED_STATE]: true } });
      }
    } finally {
      setSubmitting(false);
    }
  };

  useLayoutEffect(() => {
    if (isGuestRoute || isNew || !id) {
      setEditorBootstrap("ready");
      return;
    }
    if (existing) {
      setEditorBootstrap("ready");
    }
  }, [isGuestRoute, isNew, id, existing]);

  useEffect(() => {
    if (isGuestRoute || isNew || !id || existing || !user) return;
    let cancelled = false;
    void (async () => {
      const result = await fetchBusinessCardByIdForOwner(id, user);
      if (cancelled) return;
      if (result.card) {
        upsertBusinessCard(result.card);
        const links = await fetchCardLinks(result.card.id);
        if (links && links.length > 0) {
          setCardLinks(result.card.id, links);
        }
        setEditorBootstrap("ready");
      } else {
        setEditorBootstrap("missing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isGuestRoute, isNew, id, user, existing, upsertBusinessCard, setCardLinks]);

  /** 직링크(/cards/new)에서 스토어가 비었을 때도 서버 기준 명함 분기 동기화 */
  useEffect(() => {
    if (isGuestRoute || !user?.id || !isNew || location.pathname !== "/cards/new") return;
    let cancelled = false;
    void fetchMyCardsForUser({ id: user.id, email: user.email ?? null }).then((result) => {
      if (cancelled || result.status !== "ok") return;
      result.cards.forEach((c) => upsertBusinessCard(c));
    });
    return () => {
      cancelled = true;
    };
  }, [isGuestRoute, user?.id, user?.email, isNew, location.pathname, upsertBusinessCard]);

  const ownedMineSorted = useMemo(() => {
    if (!user) return [];
    return sortOwnedCardsByCreatedDesc(businessCards.filter((c) => cardBelongsToUser(c, user)));
  }, [businessCards, user]);

  const ownedCardsCount = ownedMineSorted.length;

  const existingBannerRaw = (
    location.state as Record<string, unknown> | null | undefined
  )?.[ROUTE_STATE_MAIN_CTA_EXISTING_CARD];
  const existingCardBannerFromRouter =
    typeof existingBannerRaw === "string" && existingBannerRaw.trim() ? existingBannerRaw : null;

  if (!isGuestRoute && !isNew && id && editorBootstrap === "missing") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isGuestRoute && !isNew && id && editorBootstrap === "pending") {
    return (
      <div className={cn(layout.pageEditor, "flex min-h-[50vh] flex-col items-center justify-center gap-3 py-16")}>
        <Loader2 className="h-10 w-10 animate-spin text-brand-700" aria-hidden />
        <p className="text-sm font-medium text-slate-600">명함을 불러오는 중…</p>
      </div>
    );
  }

  if (isGuestCreationPath && !authReady) {
    return (
      <div className={cn(layout.pageEditor, "flex min-h-[45vh] flex-col items-center justify-center gap-3 py-16")}>
        <Loader2 className="h-10 w-10 animate-spin text-brand-700" aria-hidden />
        <p className="text-sm font-medium text-slate-600">인증 상태를 확인하는 중…</p>
      </div>
    );
  }

  if (isGuestCreationPath && user) {
    return <LoggedInGuestCreateRedirect search={location.search} />;
  }

  if (!isGuestRoute && user && location.pathname === "/cards/new" && isNew && ownedCardsCount >= 1) {
    if (ownedMineSorted.length >= 2) {
      return (
        <Navigate
          to="/cards"
          replace
          state={{ [ROUTE_STATE_MAIN_CTA_PICK_CARD]: MAIN_CTA_MULTI_CARD_CHOOSE_NOTICE }}
        />
      );
    }
    const primary = ownedMineSorted[0];
    return primary ? (
      <Navigate
        to={`/cards/${encodeURIComponent(primary.id)}/edit`}
        replace
        state={{
          [ROUTE_STATE_MAIN_CTA_EXISTING_CARD]: MAIN_CTA_EXISTING_CARD_NOTICE,
        }}
      />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  return (
    <div className={cn(layout.pageEditor, "pb-28 pt-4 sm:pb-10 sm:pt-8")}>
      {/* 상단 고정 바 */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
            <span className="text-sm font-bold text-slate-900 sm:text-base">
              {isGuestRoute ? "명함 만들기" : isNew ? "명함 만들기" : "명함 수정"}
            </span>
            <span className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 sm:text-xs" aria-live="polite">
              {autosaveStatus === "saving" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-700" aria-hidden />
                  저장 중...
                </>
              ) : null}
              {autosaveStatus === "saved" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                  자동 저장됨
                </>
              ) : null}
              {autosaveStatus === "error" ? (
                <>
                  <span className="font-medium text-amber-800">저장 실패 · 다시 시도</span>
                  <button
                    type="button"
                    className="font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-950"
                    onClick={() => setAutosaveBump((b) => b + 1)}
                  >
                    다시 시도
                  </button>
                </>
              ) : null}
              {autosaveStatus === "idle" ? (
                <>
                  <span className="text-slate-500">변경하면 자동으로 저장합니다</span>
                </>
              ) : null}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9"
              onClick={() => scrollToId("card-preview-hero")}
            >
              미리보기
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9"
              onClick={() => setShareExpandCue((c) => c + 1)}
            >
              공유하기
            </Button>
            <Link
              to={isGuestRoute ? "/" : "/cards"}
              className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 sm:text-sm"
            >
              목록으로
            </Link>
          </div>
        </div>
      </header>

      {!isGuestRoute && !isNew && existingCardBannerFromRouter ? (
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-950">
          {existingCardBannerFromRouter}
        </div>
      ) : null}
      <div className="mx-auto mb-6 max-w-6xl space-y-2 px-4 sm:mb-8 sm:px-5">
        {!isGuestRoute && isNew && location.pathname === "/cards/new" && !wantsSample ? (
          <p className="max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm">
            ① 업종·템플릿 → ② 이름·연락처 등 최소 입력 → ③ 저장 후 「공유 설정」에서 고객에게 링크를 보냅니다.
          </p>
        ) : null}
        {isGuestRoute ? (
          <p className="max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
            입력하면 자동 저장됩니다. 링크는 아래 「공유 설정」, 저장은 페이지 하단에서 이어가면 됩니다.
          </p>
        ) : null}
      </div>

      {isGuestRoute && !user && isNew ? (
        <div className="mb-6 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-white px-4 py-4 shadow-sm sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-950">예시 명함으로 바로 체험해 보세요</p>
            <p className="mt-1 text-xs font-medium text-emerald-900/85 sm:text-[13px]">
              업종·문구가 한 번에 들어오고 오른쪽에서 바로 수정만 하면 됩니다.
            </p>
          </div>
          <Button
            type="button"
            className={cn(
              "mt-3 w-full min-h-11 shrink-0 font-extrabold shadow-md sm:mt-0 sm:w-auto sm:min-w-[10.5rem]",
              "border-0 bg-emerald-600 text-white hover:bg-emerald-500",
            )}
            onClick={() => applyInstantIndustrySample()}
          >
            샘플로 채우기
          </Button>
        </div>
      ) : null}

      {user && !isGuestRoute && isNew && location.pathname === "/cards/new" && !wantsSample ? (
        <div className="mb-8 space-y-4">
          <IndustryPickSection
            selectedId={revenueTemplateId}
            disabled={submitting}
            submitting={submitting}
            onSelectIndustry={(templateId) =>
              navigate(`/cards/new?industry=${encodeURIComponent(templateId)}`, { replace: true })
            }
            onQuickCreate={() => void handleQuickThreeSecondCard()}
            onInstantSample={applyInstantIndustrySample}
          />
        </div>
      ) : null}

      {savedHighlight && welcomeHighlight && user && !isGuestRoute && id ? (
        draft.is_public && completionShareUrl ? (
          <div className="space-y-6">
            <CardEditorSaveCompletionPanel
              shareUrl={completionShareUrl}
              promoShareText={promoShareText}
              blogShareSnippet={blogShareSnippet}
              cardTitle={`${draft.person_name || draft.brand_name || "내"} 디지털 명함`}
              qrImageUrl={existing?.qr_image_url ?? null}
              heroImageUrl={heroImageUrlForDownload || null}
              slug={draft.slug.trim()}
              quickDraft={searchParams.get("quick") === "1"}
              onDismiss={dismissSaveBanner}
            />
            <PostSaveGrowthPanel />
          </div>
        ) : (
          <div
            id="card-save-complete"
            className="mb-8 scroll-mt-28 rounded-2xl border-2 border-amber-200/90 bg-amber-50/80 px-5 py-5 sm:px-6 sm:py-6"
            role="status"
          >
            <p className="font-bold text-slate-900">명함이 저장되었습니다</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              지금은 비공개이거나 주소 이름이 덜 올라와 있어요.{" "}
              <span className="font-semibold">공개</span>로 바꾸고{" "}
              <span className="font-semibold">공개 주소(/c/이름)</span>를 완성하면, 홈이 아닌 개인 명함 링크로만
              고객에게 보낼 수 있어요.
            </p>
            <Button type="button" variant="secondary" className="mt-4" onClick={dismissSaveBanner}>
              닫기
            </Button>
          </div>
        )
      ) : null}

      {savedHighlight && welcomeHighlight && user && !isGuestRoute && id ? (
        <RewardAdsSection placement="card_complete" className="mb-8" />
      ) : null}

      <div className="studio-editor-studio mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 sm:px-5 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start xl:gap-12">
        <div className="order-2 min-w-0 space-y-5 sm:space-y-7 lg:order-1 lg:py-2">
          <div>
            <h1 className="text-balance text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-3xl md:text-[1.85rem]">
              지금 보이는 대로 저장됩니다
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              왼쪽에서 내용을 수정하면 오른쪽 명함에 바로 반영됩니다.
            </p>
            {isLiveGenerator ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
                {sampleLadderActive
                  ? "아래 카드 순서대로 수정하면 초보자도 빠르게 완성할 수 있어요. 홍보·교육 확장은 명함 저장 이후 같은 화면에서 이어집니다."
                  : "입력이 쌓이면 아래에서 홍보·교육으로 확장할 수 있습니다."}
              </p>
            ) : null}
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-700/90">
              ① 기본 정보 → ② 대표 이미지 → ③ 연락·링크 → ④ 소개 · ⑤ 공유
            </p>
          </div>

          {!heroShareUrl ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-600">
              {!draft.is_public
                ? "「공유 설정」에서 공개로 바꾸면 고객에게 보낼 주소와 링크가 만들어져요."
                : "주소 이름(slug)을 채워 주세요. 준비가 되면 「공유 설정」에서 복사·카카오톡 공유가 켜집니다."}
            </div>
          ) : isGuestRoute && !user ? (
            <button
              type="button"
              className="w-full rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-left text-sm font-medium text-brand-950 hover:bg-brand-50"
              onClick={() => setShareExpandCue((c) => c + 1)}
            >
              임시 미리보기 링크가 있어요. 「공유 설정」에서 복사·카카오톡으로 보내 보세요. <span className="block text-xs font-normal text-brand-900/85">탭하면 공유 카드로 이동합니다</span>
            </button>
          ) : (
            <p className="text-sm text-slate-600">
              링크는 아래 「<span className="font-semibold">공유 설정</span>」에서 복사·공유하면 됩니다.
            </p>
          )}

        {isLiveGenerator ? (
          <div className="mx-auto mt-6 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-center text-lg font-bold text-slate-900">고객을 더 늘리고 싶으신가요?</p>
            <p className="mt-2 text-center text-sm text-slate-600">
              명함을 시작점으로 홍보를 확장하고, 필요하면 교육·강사 단계까지 한 흐름으로 이어집니다.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Button type="button" variant="secondary" onClick={() => startExpansionJourney("blog")}>
                블로그로 확장하기
              </Button>
              <Button type="button" variant="secondary" onClick={() => startExpansionJourney("video")}>
                영상으로 확장하기
              </Button>
              <Button type="button" variant="secondary" onClick={() => startExpansionJourney("automation")}>
                자동화 시스템 만들기
              </Button>
            </div>

            {journeyStep !== "start" ? (
              <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                <p className="text-sm font-semibold text-brand-900">
                  현재 단계:{" "}
                  {journeyStep === "promotion"
                    ? "홍보 확장"
                    : journeyStep === "education"
                      ? "교육 해결"
                      : "강사 순환"}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  선택된 흐름:{" "}
                  {expansionTrack === "blog"
                    ? "블로그/콘텐츠"
                    : expansionTrack === "video"
                      ? "영상/숏폼"
                      : expansionTrack === "automation"
                        ? "자동화 시스템"
                        : "미선택"}
                </p>

                {journeyStep === "promotion" ? (
                  <>
                    <div className="mt-3">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        현재 숙련도
                      </label>
                      <Select
                        className="mt-1"
                        value={userSkillLevel}
                        onChange={(e) => setUserSkillLevel(e.target.value as "low" | "high")}
                      >
                        <option value="low">low (기초 단계)</option>
                        <option value="high">high (직접 실행 가능)</option>
                      </Select>
                    </div>
                    {userSkillLevel === "low" ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Button type="button" variant="secondary" onClick={moveToEducationStep}>
                          교육으로 배우기
                        </Button>
                <Button type="button" variant="outline" onClick={() => setDelegateAssistOpen(true)}>
                  제작 전문가에게 맡기기
                </Button>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Button type="button" variant="secondary" onClick={runPromotionRequest}>
                          지금 홍보 제작 시작하기
                        </Button>
                      </div>
                    )}
                  </>
                ) : null}

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">교육 시스템 (해결 단계)</p>
                  <p className="mt-1 text-sm text-slate-700">
                    AI 블로그 작성 · AI 영상 제작 · 자동화 프로그램 제작
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" variant={educationMode === "online" ? "secondary" : "outline"} size="sm" onClick={() => setEducationMode("online")}>
                      온라인 강의
                    </Button>
                    <Button type="button" variant={educationMode === "offline" ? "secondary" : "outline"} size="sm" onClick={() => setEducationMode("offline")}>
                      오프라인 강의
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={moveToEducationStep}>
                      교육 페이지 열기
                    </Button>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-sm font-semibold text-slate-900">이제 다른 사람을 도와보시겠습니까?</p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-2"
                      onClick={() => {
                        setJourneyStep("instructor");
                        navigate("/education#instructor");
                      }}
                    >
                      강사 신청
                    </Button>
                    {journeyStep === "instructor" ? (
                      <p className="mt-2 text-xs text-slate-600">
                        강사 단계에서는 교육 진행, 명함 제작 지원, 홍보 제작 지원으로 순환합니다.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {isLiveGenerator ? <EditorFlowHint phase="hero" /> : null}

        {isLiveGenerator && sampleLadderActive && !(isGuestRoute && !user) ? (
          <CardEditorGrowthLadder
            className="mt-8 sm:mt-10"
            feedback={growthFlash}
            paidBusy={paidBusy}
            onPaidActivate={runPaidActivation}
            onPromotionRequest={runPromotionRequest}
          />
        ) : null}

        <form id="editor-main-form" onSubmit={onSave} className="mt-0 space-y-6 sm:space-y-8 lg:space-y-8">
        <div id="studio-fields" className="scroll-mt-24 space-y-8">
          <CardForm
            errors={fieldErrors}
            variant={isLiveGenerator ? "studio" : "default"}
            guestTempPreviewUrl={
              isGuestRoute && !user && guestTempId && heroShareUrl ? heroShareUrl : null
            }
            guestTempId={isGuestRoute && !user ? guestTempId : null}
            onPrepareGuestKakaoShare={prepareGuestPreviewForKakao}
            persistBrandImageCardId={null}
            getPersistBrandImageCardId={() => existing?.id ?? stagingEditorCardId ?? null}
            onBrandImagePersist={handleBrandImagePersist}
            guestHeroStorageHint={isGuestRoute && !user}
            gateGuestHeroImagePick={isGuestRoute && !user}
            postAuthHeroImageReminder={postAuthHeroReminderOpen && !isGuestRoute && Boolean(user)}
            onDismissPostAuthHeroReminder={() => setPostAuthHeroReminderOpen(false)}
            midSlot={
              isLiveGenerator ? (
                <EditorFlowHint phase="mid" />
              ) : null
            }
            shareExpandCue={shareExpandCue}
            contactLinksSlot={
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">명함에 붙는 버튼 링크</h3>
                  <p className="mt-0.5 text-xs text-slate-500">방문 고객이 눌러 바로 행동할 수 있습니다. 저장 시 명함 카드 버튼에 반영됩니다.</p>
                </div>
                {linkRows.map((row, idx) => (
                  <div key={row.id} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-12">
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
              </div>
            }
          />
        </div>

        {exportCardForPrint ? (
          <div id="card-qr-export" className="mt-10 scroll-mt-24">
            <CardQrAndExportPanel card={exportCardForPrint} />
          </div>
        ) : null}

        {isLiveGenerator ? (
          <>
            <EditorFlowHint phase="bottom" />
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 sm:px-6 sm:py-6">
              <p className="text-center text-sm font-semibold text-slate-900">새로 시작하고 싶다면</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={applyEmptyDraft}>
                  빈 상태로 시작하기
                </Button>
              </div>
              <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-slate-600">
                {wantsSample
                  ? "유형과 문구를 고르면 예시가 채워집니다. 톤만 바꿔도 바로 활용할 수 있어요. 저장 시 그대로 반영됩니다."
                  : "폼으로 바로 고치면 오른쪽에 즉시 반영됩니다. 체험이 필요하면 샘플로 채운 뒤 톤만 바꿔도 됩니다."}
              </p>
              <p className="mt-3 text-center text-sm font-medium leading-relaxed text-slate-700">
                나를 소개하는 가장 쉬운 방법, 린코 디지털 명함 — 링크 하나로 고객과 이어지는 첫인상을 만드세요.
              </p>
            </div>
          </>
        ) : null}

        {isGuestRoute && !user ? (
          <GuestSavePrompt className="scroll-mt-8" />
        ) : null}
        {isGuestRoute && !user && peekPendingCardDraft() ? (
          <div className="flex justify-end px-1">
            <button
              type="button"
              className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800"
              onClick={() => {
                if (!window.confirm("임시 저장된 초안을 삭제할까요? 이 기기에서는 복구할 수 없습니다.")) return;
                clearPendingCardDraft();
                setGrowthFlash("브라우저 임시저장을 삭제했습니다.");
              }}
            >
              임시저장 삭제
            </button>
          </div>
        ) : null}

        <div id="final-save" className="scroll-mt-24 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-2">
          <Link
            to={isGuestRoute ? "/" : "/cards"}
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
          <Button type="submit" className="w-full min-h-[52px] sm:w-auto sm:min-h-11" size="lg" loading={submitting}>
            {isGuestRoute ? "이 명함 저장하기" : "명함 저장하기"}
          </Button>
        </div>
      </form>
        </div>
        <aside className="order-1 mb-10 w-full lg:order-2 lg:sticky lg:top-24 lg:z-30 lg:mb-0 lg:max-h-[min(calc(100vh-7rem),56rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pb-10">
          <section id="card-preview-hero" className="scroll-mt-28">
            <div className="mx-auto w-full max-w-[min(100%,26rem)] overflow-hidden rounded-[1.65rem] border border-slate-200/90 bg-slate-100 shadow-[0_28px_64px_-14px_rgba(15,23,42,0.38)] ring-1 ring-slate-900/[0.06] lg:mx-0">
              <p className="border-b border-slate-200/90 bg-white px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                {isGuestRoute && !user ? "실시간 미리보기 · 임시 링크로 확인" : "실시간 명함 · 자동 저장 · 바로 공유"}
              </p>
              <div className="max-h-[min(72vh,640px)] overflow-y-auto overscroll-contain bg-slate-100">
                <CardPreview
                  linkRows={linkRows}
                  existingCardId={existing?.id}
                  createdAt={existing?.created_at}
                  guestTempHint={Boolean(isGuestRoute && !user)}
                  isGuestPreview={!(user && !isGuestRoute)}
                  onGuestHeroImageBlocked={
                    isGuestRoute && !user ? () => setGuestHeroAuthOpen(true) : undefined
                  }
                  persistUploadedHero={user && !isGuestRoute ? persistUploadedHero : undefined}
                  persistClearHero={user && !isGuestRoute ? persistClearHero : undefined}
                  analyticsCardId={existing?.id ?? stagingEditorCardId}
                />
              </div>
            </div>
          </section>
        </aside>
      </div>

      <nav
        aria-label="빠른 작업"
        className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-sm supports-[backdrop-filter]:bg-white/85 lg:hidden"
        style={{ paddingBottom: "max(0.6rem, env(safe-area-inset-bottom))" }}
      >
        <Button type="button" variant="outline" size="sm" className="min-h-11 flex-1 shrink" onClick={() => scrollToId("card-preview-hero")}>
          미리보기
        </Button>
        <Button type="button" variant="outline" size="sm" className="min-h-11 flex-1 shrink" onClick={() => setShareExpandCue((c) => c + 1)}>
          공유
        </Button>
        <Button type="submit" form="editor-main-form" size="sm" className="min-h-11 flex-[1.2] shrink-0 font-semibold">
          저장
        </Button>
      </nav>

      <GuestHeroImageAuthModal
        open={guestHeroAuthOpen}
        onClose={() => setGuestHeroAuthOpen(false)}
        onContinueEditing={() => setGuestHeroAuthOpen(false)}
        onSignup={() => {
          prepareGuestHeroImageSignupResume();
          setGuestHeroAuthOpen(false);
          navigate("/signup", {
            state: {
              pendingCardSignupFlow: true,
              signupNotice:
                "작성 중인 명함은 임시저장되어 있어요. 가입 후 아래 안내에 따라 이미지를 다시 선택하면 안전하게 저장됩니다.",
            },
          });
        }}
      />

      <GuestSaveAuthModal
        open={guestAuthSaveOpen}
        onClose={() => setGuestAuthSaveOpen(false)}
        onContinueEditing={() => setGuestAuthSaveOpen(false)}
        onSignup={() => {
          persistGuestPendingFromEditor();
          setGuestAuthSaveOpen(false);
          navigate("/signup", {
            state: {
              pendingCardSignupFlow: true,
              signupNotice:
                "지금 만든 명함은 가입 후 내 계정에 저장할 수 있어요. 가입을 완료하면 이어서 저장됩니다.",
            },
          });
        }}
        onLogin={() => {
          persistGuestPendingFromEditor();
          setGuestAuthSaveOpen(false);
          navigate("/login", { state: { pendingCardSaveLogin: true } });
        }}
      />

      <FillSampleWizardModal
        open={sampleWizardOpen}
        onClose={() => setSampleWizardOpen(false)}
        onApply={applyPhraseFromWizard}
      />
      <DelegateExpertChoiceModal
        open={delegateAssistOpen}
        onClose={() => setDelegateAssistOpen(false)}
        cardTypeHint={draft.card_type}
      />
    </div>
  );
}
