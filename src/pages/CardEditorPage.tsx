import { PostSaveGrowthPanel } from "@/components/card/PostSaveGrowthPanel";
import { GuestSavePrompt } from "@/components/card/SavePrompt";
import { CardQrAndExportPanel } from "@/components/card-print/CardQrAndExportPanel";
import { CardForm } from "@/components/card-editor/CardForm";
import { CardEditorGrowthLadder } from "@/components/card-editor/CardEditorGrowthLadder";
import { CardEditorSaveCompletionPanel } from "@/components/card-editor/CardEditorSaveCompletionPanel";
import { CardPreview } from "@/components/card-editor/CardPreview";
import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { buildCardShareUrl, buildTempPreviewUrl, editorOriginFallback } from "@/lib/cardShareUrl";
import { parseCardEditorDraft, zodIssuesToFieldErrors } from "@/lib/cardEditorSchema";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { previewKakaoFeedFromDraft } from "@/lib/previewShareMeta";
import { syncTempPreviewRemote } from "@/lib/syncTempPreviewRemote";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
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
import type { CardLink, CardLinkType } from "@/types/domain";
import {
  getSampleCardDraft,
  getSampleLinkRows,
  parseWantsSample,
} from "@/lib/cardEditorSampleData";
import { clearEditorLiveCardId } from "@/lib/editorLiveCardStorage";
import {
  clearGuestTempId,
  getOrCreateGuestTempId,
  resetGuestTempId,
  setGuestTempSessionId,
} from "@/lib/guestTempSession";
import { INSTANT_GUEST_USER_ID } from "@/lib/instantCardCreate";
import { clearInstantCardId } from "@/lib/instantCardStorage";
import {
  clearLandingEmail,
  consumePendingCardDraft,
  getLandingEmail,
  peekPendingCardDraft,
  savePendingCardDraft,
} from "@/lib/pendingCardStorage";
import { removeTempCard, saveTempCard } from "@/lib/tempCardStorage";
import { buildViralShareText } from "@/lib/viralShareText";
import { upsertCardRemote } from "@/services/cardsService";
import { syncQrImageAfterSave } from "@/services/cardQrSync";
import { ArrowRight, Check, Copy, Loader2, Share2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function EditorFlowHint({
  phase,
  onTrySample,
  showTrySample,
}: {
  phase: "hero" | "mid" | "bottom";
  onTrySample: () => void;
  showTrySample: boolean;
}) {
  const goStudio = () => scrollToId("studio-fields");

  const softBtn =
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 sm:w-auto";

  if (phase === "hero") {
    return (
      <div className="mt-8 flex w-full max-w-lg flex-col gap-3 sm:mx-auto sm:max-w-xl sm:flex-row sm:justify-center">
        <button type="button" className={softBtn} onClick={goStudio}>
          입력란으로 이동
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </button>
        {showTrySample ? (
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full gap-2 sm:w-auto sm:min-w-[10rem]"
            onClick={() => {
              onTrySample();
              scrollToId("card-preview-hero");
            }}
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            샘플로 채우기
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-5 sm:px-6 sm:py-6">
      <p className="text-center text-sm font-semibold text-slate-800">
        {phase === "mid" ? "아래에서 내용을 마저 입력해 주세요" : "입력을 마친 뒤 맨 아래에서 저장할 수 있어요"}
      </p>
      <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
        가입은 저장 단계에서 이어집니다. 먼저 미리보기 링크로 결과를 확인해 보세요.
      </p>
    </div>
  );
}

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
  const user = useAuthStore((s) => s.user);
  const isGuestRoute = location.pathname === "/create-card";
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardLinks = useAppDataStore((s) => s.cardLinks);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const setCardLinks = useAppDataStore((s) => s.setCardLinks);
  const addPayment = useAppDataStore((s) => s.addPayment);
  const addToPromotionPool = useAppDataStore((s) => s.addToPromotionPool);

  const isNew = !id || id === "new";
  const wantsSample = useMemo(() => parseWantsSample(location.search), [location.search]);

  const routeKey = useMemo(() => {
    if (isGuestRoute) return wantsSample ? "create-card-sample" : "create-card";
    if (!isNew && id) return id;
    return wantsSample ? "new-sample" : "new";
  }, [isGuestRoute, isNew, id, wantsSample]);

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

  const [linkRows, setLinkRows] = useState<LinkRow[]>(() => mapLinksToRows(existingLinks));
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [shareOrigin, setShareOrigin] = useState("");
  const [heroCopyDone, setHeroCopyDone] = useState(false);
  const [heroKakaoHint, setHeroKakaoHint] = useState(false);
  const [heroKakaoPreparing, setHeroKakaoPreparing] = useState(false);
  const [heroKakaoError, setHeroKakaoError] = useState<string | null>(null);
  const [journeyStep, setJourneyStep] = useState<"start" | "promotion" | "education" | "instructor">("start");
  const [expansionTrack, setExpansionTrack] = useState<"blog" | "video" | "automation" | null>(null);
  const [userSkillLevel, setUserSkillLevel] = useState<"low" | "high">("low");
  const [educationMode, setEducationMode] = useState<"online" | "offline">("online");
  const [sampleLadderActive, setSampleLadderActive] = useState(() => wantsSample);
  const [growthFlash, setGrowthFlash] = useState<string | null>(null);
  const [paidBusy, setPaidBusy] = useState(false);

  const newCardIdRef = useRef<string | null>(null);
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

  const [guestTempId, setGuestTempId] = useState<string | null>(null);

  const completionShareUrl = useMemo(() => {
    const o = editorOriginFallback(shareOrigin);
    return buildCardShareUrl(o, draft.slug.trim());
  }, [draft.slug, shareOrigin]);

  useEffect(() => {
    setShareOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (wantsSample) setSampleLadderActive(true);
  }, [wantsSample]);

  useEffect(() => {
    if (!growthFlash) return;
    const t = window.setTimeout(() => setGrowthFlash(null), 6500);
    return () => window.clearTimeout(t);
  }, [growthFlash]);

  useEffect(() => {
    if (!savedHighlight || !draft.is_public || !completionShareUrl) return;
    const el = document.getElementById("card-save-complete");
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [savedHighlight, draft.is_public, completionShareUrl]);

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
          getSampleCardDraft({
            email: emailHint || "hello@linko.app",
          }),
        );
        setLinkRows(getSampleLinkRows());
        setGuestTempId(resetGuestTempId());
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
      const pending = consumePendingCardDraft();
      if (pending) {
        pendingTempIdRef.current = pending.tempId ?? null;
        replaceDraft(mergeDraftDefaults(pending.draft));
        setLinkRows(
          pending.linkRows.length > 0
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
      wantsSample &&
      !existing
    ) {
      const state = useCardEditorDraftStore.getState();
      if (state.hydratedKey === routeKey) return;
      replaceDraft(
        getSampleCardDraft({
          email: user.email?.trim() || "hello@linko.app",
        }),
      );
      setLinkRows(getSampleLinkRows());
      setHydratedKey(routeKey);
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
          });
        }
        savePendingCardDraft({
          draft: dly,
          linkRows: rowPayload,
          tempId: tid ?? undefined,
        });
        if (autosaveStatusTimerRef.current) clearTimeout(autosaveStatusTimerRef.current);
        setAutosaveStatus("saved");
        autosaveStatusTimerRef.current = setTimeout(() => setAutosaveStatus("idle"), 2200);
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

  const heroShareText = useMemo(
    () => (heroShareUrl ? buildViralShareText(heroShareUrl) : ""),
    [heroShareUrl],
  );

  const copyHeroShare = useCallback(async () => {
    if (!heroShareUrl) return;
    try {
      await navigator.clipboard.writeText(heroShareUrl);
      setHeroCopyDone(true);
      window.setTimeout(() => setHeroCopyDone(false), 2200);
    } catch {
      window.prompt("링크를 복사해 주세요", heroShareUrl);
    }
  }, [heroShareUrl]);

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
    });
    return syncTempPreviewRemote({
      tempId: guestTempId,
      draft,
      linkRows: rowPayload,
      shareUrl: buildTempPreviewUrl(window.location.origin, guestTempId, draft.card_type) ?? undefined,
      state: "guest",
    });
  }, [draft, guestTempId, isGuestRoute, linkRows, user]);

  const kakaoHeroShare = useCallback(async () => {
    if (!heroShareUrl) return;
    if (heroKakaoPreparing) return;
    setHeroKakaoPreparing(true);
    setHeroKakaoError(null);
    const origin = editorOriginFallback(shareOrigin);
    const state: "guest" | "member" = isGuestRoute && !user ? "guest" : "member";
    const shareUrl =
      state === "guest" && guestTempId
        ? buildTempPreviewUrl(origin, guestTempId, draft.card_type) ?? heroShareUrl
        : heroShareUrl;
    console.log("공유 링크:", shareUrl);
    console.log("state:", state);
    console.log("tempId:", guestTempId ?? "");
    try {
      if (isGuestRoute && !user && guestTempId) {
        const ok = await prepareGuestPreviewForKakao();
        if (!ok) {
          setHeroKakaoError(
            "공유 링크 준비에 실패했습니다. 다시 시도해 주세요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
          );
          return;
        }
      }
      const tempFeed =
        isGuestRoute && !user && guestTempId
          ? previewKakaoFeedFromDraft(draft, { tempId: guestTempId, origin })
          : null;
      const title =
        tempFeed?.title ?? `${draft.person_name || draft.brand_name || "내"} 디지털 명함`;
      const r = await shareCardLinkNativeOrder({
        shareUrl,
        title,
        shortMessage: tempFeed?.description ?? "내 디지털 명함 페이지 링크예요.",
        kakaoDescription: tempFeed?.description,
        kakaoImageUrl: tempFeed?.imageUrl,
      });
      if (r === "clipboard") {
        setHeroKakaoHint(true);
        window.setTimeout(() => setHeroKakaoHint(false), 2800);
      }
    } finally {
      setHeroKakaoPreparing(false);
    }
  }, [
    draft,
    draft.brand_name,
    draft.person_name,
    guestTempId,
    heroKakaoPreparing,
    heroShareUrl,
    isGuestRoute,
    prepareGuestPreviewForKakao,
    shareOrigin,
    user,
  ]);

  const applySampleDraft = useCallback(() => {
    const emailFallback = getLandingEmail()?.trim() || user?.email?.trim() || "hello@linko.app";
    replaceDraft(getSampleCardDraft({ email: emailFallback }));
    setLinkRows(getSampleLinkRows());
    setFieldErrors({});
    if (isGuestRoute && !user) {
      setGuestTempId(resetGuestTempId());
    } else {
      clearEditorLiveCardId();
    }
    clearInstantCardId();
    newCardIdRef.current = null;
    setSampleLadderActive(true);
  }, [replaceDraft, user?.email, isGuestRoute, user]);

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
    setSampleLadderActive(false);
  }, [replaceDraft, user?.email, user?.name, isGuestRoute, user]);

  const handleTrySample = useCallback(() => {
    applySampleDraft();
    scrollToId("card-preview-hero");
  }, [applySampleDraft]);

  const runPaidActivation = useCallback(() => {
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
      upsertBusinessCard({
        ...card,
        expire_at: existing?.expire_at ?? card.expire_at,
        status: existing?.status ?? card.status,
      });
      setCardLinks(cardId, draftLinkRowsToCardLinks(nextDraft, linkRows, cardId));
      addPayment({
        id: crypto.randomUUID(),
        user_id: uid,
        amount: price,
        payment_type: "linko_card_pro",
        status: "completed",
        created_at: new Date().toISOString(),
      });
      setGrowthFlash("결제(데모) 완료 · 명함 저장 · 공개가 켜졌습니다.");
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
      added ? "홍보 풀에 등록되었습니다. 홍보자 화면에 노출돼요." : "이미 홍보 풀에 등록된 명함이에요.",
    );
  }, [addToPromotionPool, existing?.id, isGuestRoute, user]);

  const startExpansionJourney = useCallback(
    (track: "blog" | "video" | "automation") => {
      setExpansionTrack(track);
      setJourneyStep("promotion");
      setGrowthFlash(
        track === "blog"
          ? "블로그 확장 흐름을 열었어요. 필요한 수준에 맞춰 교육 또는 전문가 위임을 선택해 보세요."
          : track === "video"
            ? "영상 확장 흐름을 열었어요. 혼자 진행이 어렵다면 교육/전문가 위임으로 이어집니다."
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
      const landing = getLandingEmail()?.trim();
      const d = useCardEditorDraftStore.getState().draft;
      if (landing && !d.email.trim()) {
        replaceDraft({ ...d, email: landing });
      }
      const tid = guestTempId ?? getOrCreateGuestTempId();
      setGuestTempId(tid);
      savePendingCardDraft({
        draft: useCardEditorDraftStore.getState().draft,
        linkRows,
        tempId: tid,
      });
      setSubmitting(true);
      try {
        navigate("/signup", {
          state: {
            signupNotice:
              "지금 만든 명함은 가입 후 내 계정에 저장할 수 있어요. 가입을 완료하면 이어서 저장됩니다.",
          },
        });
      } finally {
        setSubmitting(false);
      }
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
      await upsertCardRemote(nextCard);

      try {
        const synced = await syncQrImageAfterSave(nextCard);
        upsertBusinessCard(synced);
        await upsertCardRemote(synced);
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
      navigate(`/cards/${cardId}/edit?saved=1`, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (user && isGuestRoute) {
    return <Navigate to={{ pathname: "/cards/new", search: location.search }} replace />;
  }

  return (
    <div className={cn(layout.pageEditor, "py-8 sm:py-12")}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">
            {isGuestRoute
              ? "지금 만들어서 바로 보내는 도구"
              : isNew
                ? "새 디지털 명함"
                : "명함 수정"}
          </p>
          {isGuestRoute ? (
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
              입력만으로 자동 저장되고, 링크 하나로 고객·SNS까지 이어져요. 가입은 나중에 해도 됩니다.
            </p>
          ) : null}
          <p
            className="mt-2 flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-slate-600 sm:text-sm"
            aria-live="polite"
          >
            {autosaveStatus === "saving" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-700" aria-hidden />
                <span>자동 저장 중...</span>
              </>
            ) : null}
            {autosaveStatus === "saved" ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                <span className="font-medium text-emerald-800">
                  {isGuestRoute && !user ? "미리보기 동기화됨" : "저장 완료"}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <Link
          to={isGuestRoute ? "/" : "/cards"}
          className="inline-flex min-h-10 shrink-0 items-center text-sm font-medium text-brand-700 sm:text-base"
        >
          {isGuestRoute ? "홈으로" : "목록으로"}
        </Link>
      </div>

      {savedHighlight && user && !isGuestRoute && id ? (
        draft.is_public && completionShareUrl ? (
          <div className="space-y-6">
            <CardEditorSaveCompletionPanel
              shareUrl={completionShareUrl}
              cardTitle={`${draft.person_name || draft.brand_name || "내"} 디지털 명함`}
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

      <section
        id="card-preview-hero"
        className="mx-auto w-full max-w-[min(100%,28rem)] scroll-mt-6 sm:max-w-[32rem]"
      >
        <div className="overflow-hidden rounded-[1.65rem] border border-slate-200/90 bg-slate-100 shadow-[0_28px_64px_-14px_rgba(15,23,42,0.38)] ring-1 ring-slate-900/[0.06]">
          <p className="border-b border-slate-200/90 bg-white px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
            {isGuestRoute && !user ? "실시간 미리보기 · 임시 링크로 확인" : "실시간 명함 · 자동 저장 · 바로 공유"}
          </p>
          <div className="max-h-[min(76vh,720px)] overflow-y-auto overscroll-contain bg-slate-100">
            <CardPreview
              linkRows={linkRows}
              existingCardId={existing?.id}
              createdAt={existing?.created_at}
              guestTempHint={Boolean(isGuestRoute && !user)}
            />
          </div>
        </div>

        <h1 className="mt-8 max-w-xl text-balance text-center text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:mx-auto sm:mt-10 sm:text-3xl md:text-[1.75rem]">
          {isLiveGenerator ? "명함 하나로 고객이 먼저 찾아옵니다" : "지금 보이는 대로 저장됩니다"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-center text-base leading-relaxed text-slate-600 sm:text-lg">
          {isLiveGenerator
            ? sampleLadderActive
              ? "입력할 때마다 자동 저장되고, 같은 링크로 고객에게 바로 보낼 수 있어요. 아래에서 실사용·홍보 풀·교육까지 명함 중심으로 이어집니다."
              : "입력할 때마다 자동 저장되고, 같은 링크로 고객에게 바로 보낼 수 있어요. 공유로 이어지는 구조예요. 샘플 체험 후 단계별로 확장해 보세요."
            : "아래에서 내용을 바꾸면 이 미리보기에 바로 반영돼요."}
        </p>

        {heroShareUrl ? (
          <div className="mx-auto mt-8 w-full max-w-lg rounded-2xl border border-brand-200/90 bg-gradient-to-b from-brand-50/55 to-white p-4 shadow-sm sm:p-5">
            <p className="text-center text-base font-bold text-slate-900">
              {isGuestRoute && !user ? "명함 미리보기 완료" : "👉 당신의 명함 링크"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-center text-xs leading-relaxed text-slate-600 sm:text-sm">
              {isGuestRoute && !user ? (
                <>
                  이 링크는 <span className="font-semibold text-slate-800">임시 미리보기</span>입니다. 먼저 열어 보고
                  복사·카카오톡으로 보낼 수 있어요.
                </>
              ) : (
                <>
                  아래는 서비스 홈이 아니라 <span className="font-semibold text-slate-800">당신만의 /c/주소</span>예요.
                </>
              )}
            </p>
            <div
              role="link"
              tabIndex={0}
              className="mt-3 w-full cursor-pointer break-all rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-left text-sm font-bold text-brand-900 shadow-inner hover:bg-slate-50 sm:text-base"
              onClick={() => window.open(heroShareUrl, "_blank", "noopener,noreferrer")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  window.open(heroShareUrl, "_blank", "noopener,noreferrer");
              }}
            >
              {heroShareUrl}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full flex-1 gap-2 sm:flex-1"
                onClick={() => void copyHeroShare()}
              >
                <Copy className="h-4 w-4 shrink-0" aria-hidden />
                {heroCopyDone ? "복사됨!" : "링크 복사하기"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full flex-1 gap-2"
                onClick={() => void kakaoHeroShare()}
                disabled={heroKakaoPreparing}
              >
                {heroKakaoPreparing ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {heroKakaoPreparing ? "준비 중..." : "카카오톡으로 보내기"}
              </Button>
            </div>
            {isGuestRoute && !user ? null : (
              <Button
                type="button"
                variant="secondary"
                className="mt-2 min-h-11 w-full gap-2 border-2 border-brand-200/80 bg-white hover:bg-brand-50/80"
                onClick={() => void kakaoHeroShare()}
                disabled={heroKakaoPreparing}
              >
                {heroKakaoPreparing ? "준비 중..." : "내 카카오톡으로 테스트 보내기"}
              </Button>
            )}
            {heroKakaoPreparing ? (
              <div className="mt-3 rounded-xl border border-brand-200/80 bg-brand-50/70 px-3 py-3 text-sm text-brand-900">
                <p className="font-semibold">공유 링크를 준비하고 있어요</p>
                <p className="mt-1">잠시만 기다려 주세요</p>
                <p className="mt-1">명함을 정리한 뒤 카카오톡으로 열어드릴게요</p>
              </div>
            ) : null}
            {heroKakaoError ? (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700 sm:text-sm">
                {heroKakaoError}
              </p>
            ) : null}
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-left font-sans text-xs leading-relaxed text-slate-700">
              {heroShareText}
            </pre>
            {heroKakaoHint ? (
              <p className="mt-2 text-center text-xs font-medium text-brand-800 sm:text-sm">
                명함 링크를 복사했어요. 카카오톡에 붙여넣어 내 채팅으로 보내 보세요.
              </p>
            ) : null}
            <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
              {isGuestRoute && !user
                ? "마음에 들면 아래에서 가입 후 내 명함(/c/주소)으로 저장하세요."
                : "이 링크를 고객에게 보내면 명함 페이지가 바로 열립니다."}
            </p>
            {isGuestRoute && !user ? (
              <div className="mt-4 space-y-2 border-t border-brand-100 pt-4">
                <p className="text-center text-xs text-slate-500">👉 지금 만든 명함 링크</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-12 w-full gap-2 border-2 border-brand-300 font-bold text-brand-950"
                  onClick={() => scrollToId("final-save")}
                >
                  이 명함 저장하기
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-center text-sm leading-relaxed text-slate-600">
            {!draft.is_public
              ? "명함을 공개로 설정하면 실제 링크로 열리고, 바로 테스트·공유할 수 있어요."
              : "필수 정보를 모두 올바르게 채우면 위에서 같은 링크로 공유할 수 있어요."}
          </div>
        )}

        {heroShareUrl ? (
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
                        <Button type="button" variant="outline" onClick={() => navigate("/promotion/partner")}>
                          전문가에게 맡기기
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

        {isLiveGenerator ? (
          <EditorFlowHint phase="hero" onTrySample={handleTrySample} showTrySample />
        ) : null}

        {isLiveGenerator && sampleLadderActive && !(isGuestRoute && !user) ? (
          <CardEditorGrowthLadder
            className="mt-8 sm:mt-10"
            feedback={growthFlash}
            paidBusy={paidBusy}
            onPaidActivate={runPaidActivation}
            onPromotionRequest={runPromotionRequest}
          />
        ) : null}
      </section>

      <form id="editor-main-form" onSubmit={onSave} className="mt-12 space-y-8 sm:mt-16">
        <div id="studio-fields" className="scroll-mt-24 space-y-8">
          <CardForm
            errors={fieldErrors}
            variant={isLiveGenerator ? "studio" : "default"}
            guestTempPreviewUrl={
              isGuestRoute && !user && guestTempId && heroShareUrl ? heroShareUrl : null
            }
            guestTempId={isGuestRoute && !user ? guestTempId : null}
            onPrepareGuestKakaoShare={prepareGuestPreviewForKakao}
            midSlot={
              isLiveGenerator ? (
                <EditorFlowHint phase="mid" onTrySample={handleTrySample} showTrySample />
              ) : null
            }
          />
        </div>

        {exportCardForPrint ? (
          <div className="mt-10 scroll-mt-24">
            <CardQrAndExportPanel card={exportCardForPrint} />
          </div>
        ) : null}

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

        {isLiveGenerator ? (
          <>
            <EditorFlowHint phase="bottom" onTrySample={handleTrySample} showTrySample />
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 sm:px-6 sm:py-6">
              <p className="text-center text-sm font-semibold text-slate-900">새로 시작하고 싶다면</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={applySampleDraft}>
                  샘플 다시 불러오기
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={applyEmptyDraft}>
                  빈 상태로 시작하기
                </Button>
              </div>
              <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-slate-600">
                {wantsSample
                  ? "예시 문구가 이미 채워져 있어요. 원하는 톤으로만 고치면 됩니다. 모든 값은 저장·공개 시 그대로 반영됩니다."
                  : "필드를 채우면 위 미리보기에 실시간으로 반영됩니다. 완성 예시가 필요하면 샘플을 불러오거나 홈에서 ‘샘플로 바로 시작하기’로 들어올 수 있어요."}
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
            {isGuestRoute ? "이 명함 저장하기" : "저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}
