import { CardForm } from "@/components/card-editor/CardForm";
import { CardEditorGrowthLadder } from "@/components/card-editor/CardEditorGrowthLadder";
import { CardPreview } from "@/components/card-editor/CardPreview";
import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { parseCardEditorDraft, zodIssuesToFieldErrors } from "@/lib/cardEditorSchema";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
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
import { clearEditorLiveCardId, getEditorLiveCardId, setEditorLiveCardId } from "@/lib/editorLiveCardStorage";
import { INSTANT_GUEST_USER_ID } from "@/lib/instantCardCreate";
import { clearInstantCardId, setInstantCardId } from "@/lib/instantCardStorage";
import {
  clearLandingEmail,
  consumePendingCardDraft,
  getLandingEmail,
  peekPendingCardDraft,
  savePendingCardDraft,
} from "@/lib/pendingCardStorage";
import { buildViralShareText } from "@/lib/viralShareText";
import { ArrowRight, Check, Copy, Loader2, Share2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function EditorCtaBand({
  phase,
  onTrySample,
  showTrySample,
}: {
  phase: "hero" | "mid" | "bottom";
  onTrySample: () => void;
  showTrySample: boolean;
}) {
  const goStudio = () => scrollToId("studio-fields");
  const goSave = () => scrollToId("final-save");

  const gradientBtn =
    "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-bold text-white shadow-lg sm:w-auto sm:min-w-[10rem] bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400/50";

  if (phase === "hero") {
    return (
      <div className="mt-8 flex w-full max-w-lg flex-col gap-3 sm:mx-auto sm:max-w-xl sm:flex-row sm:justify-center">
        <button type="button" className={gradientBtn} onClick={goStudio}>
          지금 내 명함 만들기
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
        </button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-[52px] w-full gap-2 sm:w-auto sm:min-w-[10rem]"
          onClick={() => {
            onTrySample();
            scrollToId("card-preview-hero");
          }}
        >
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          3초 체험하기
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-200/90 bg-gradient-to-br from-brand-50/95 to-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
      <p className="text-center text-base font-bold text-brand-950">
        {phase === "mid" ? "마음에 드나요? 다음 단계로" : "지금 저장하고 링크를 받아보세요"}
      </p>
      <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
        입력은 그대로 두고, 가입만 하면 같은 명함이 저장됩니다.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <button type="button" className={gradientBtn} onClick={goSave}>
          무료로 시작하기
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
        </button>
        <Button type="button" variant="outline" className="min-h-[52px] w-full sm:w-auto" onClick={goStudio}>
          지금 명함 만들기
        </Button>
        {showTrySample ? (
          <Button type="button" variant="secondary" className="min-h-[52px] w-full sm:w-auto" onClick={onTrySample}>
            3초 체험하기
          </Button>
        ) : null}
      </div>
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
  const [sampleLadderActive, setSampleLadderActive] = useState(() => wantsSample);
  const [growthFlash, setGrowthFlash] = useState<string | null>(null);
  const [paidBusy, setPaidBusy] = useState(false);

  const newCardIdRef = useRef<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draft = useCardEditorDraftStore((s) => s.draft);

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
        clearEditorLiveCardId();
        clearInstantCardId();
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
          if (pending.liveCardId) {
            setEditorLiveCardId(pending.liveCardId);
            setInstantCardId(pending.liveCardId);
          }
        } else {
          replaceDraft(createEmptyDraft({ email: emailHint ?? "" }));
          setLinkRows(mapLinksToRows([]));
          clearEditorLiveCardId();
          clearInstantCardId();
        }
      }
      setHydratedKey(routeKey);
      return;
    }

    if (!isGuestRoute && location.pathname === "/cards/new" && isNew && user) {
      const pending = consumePendingCardDraft();
      if (pending) {
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
          person_name: user?.name ?? "",
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
        savePendingCardDraft({
          draft: dly,
          linkRows: rowPayload,
          liveCardId: getEditorLiveCardId() ?? undefined,
        });
      }

      if (parsed.success) {
        let cardId: string | undefined = existing?.id;
        if (!cardId && user && !isGuestRoute && isNew) {
          if (!newCardIdRef.current) newCardIdRef.current = crypto.randomUUID();
          cardId = newCardIdRef.current;
        }
        if (!cardId && isGuestRoute && !user) {
          let lid = getEditorLiveCardId();
          if (!lid) {
            lid = crypto.randomUUID();
            setEditorLiveCardId(lid);
            setInstantCardId(lid);
          }
          cardId = lid;
        }
        if (cardId) {
          const uid = user?.id ?? INSTANT_GUEST_USER_ID;
          const card = draftToBusinessCard(dly, {
            id: cardId,
            user_id: uid,
            created_at: existing?.created_at ?? new Date().toISOString(),
          });
          upsertBusinessCard(card);
          setCardLinks(cardId, draftLinkRowsToCardLinks(dly, linkRows, cardId));
          if (isGuestRoute && !user) {
            savePendingCardDraft({
              draft: dly,
              linkRows: rowPayload,
              liveCardId: cardId,
            });
          }
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
  ]);

  const heroShareEligible = useMemo(() => {
    const parsed = parseCardEditorDraft(draft);
    if (!parsed.success || !draft.is_public) return false;
    return draft.slug.trim().length >= 2;
  }, [draft]);

  const heroShareUrl = useMemo(() => {
    if (!heroShareEligible || !shareOrigin) return "";
    return `${shareOrigin}/c/${encodeURIComponent(draft.slug.trim())}`;
  }, [heroShareEligible, shareOrigin, draft.slug]);

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

  const kakaoHeroShare = useCallback(async () => {
    if (!heroShareUrl || !heroShareText) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${draft.person_name || draft.brand_name || "내"} 디지털 명함`,
          text: heroShareText,
          url: heroShareUrl,
        });
        return;
      } catch {
        /* 사용자 취소 */
      }
    }
    try {
      await navigator.clipboard.writeText(heroShareText);
      setHeroKakaoHint(true);
      window.setTimeout(() => setHeroKakaoHint(false), 2600);
    } catch {
      window.prompt("붙여넣어 보낼 내용입니다", heroShareText);
    }
  }, [draft.brand_name, draft.person_name, heroShareText, heroShareUrl]);

  const applySampleDraft = useCallback(() => {
    const emailFallback = getLandingEmail()?.trim() || user?.email?.trim() || "hello@linko.app";
    replaceDraft(getSampleCardDraft({ email: emailFallback }));
    setLinkRows(getSampleLinkRows());
    setFieldErrors({});
    clearEditorLiveCardId();
    clearInstantCardId();
    newCardIdRef.current = null;
    setSampleLadderActive(true);
  }, [replaceDraft, user?.email]);

  const applyEmptyDraft = useCallback(() => {
    replaceDraft(
      createEmptyDraft({
        email: getLandingEmail()?.trim() || user?.email?.trim() || "",
        person_name: user?.name ?? "",
      }),
    );
    setLinkRows(mapLinksToRows([]));
    setFieldErrors({});
    clearEditorLiveCardId();
    clearInstantCardId();
    newCardIdRef.current = null;
    setSampleLadderActive(false);
  }, [replaceDraft, user?.email, user?.name]);

  const handleTrySample = useCallback(() => {
    applySampleDraft();
    scrollToId("card-preview-hero");
  }, [applySampleDraft]);

  const runPaidActivation = useCallback(() => {
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
      if (!cardId && isGuestRoute && !user) {
        let lid = getEditorLiveCardId();
        if (!lid) {
          lid = crypto.randomUUID();
          setEditorLiveCardId(lid);
          setInstantCardId(lid);
        }
        cardId = lid;
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
      upsertBusinessCard(card);
      setCardLinks(cardId, draftLinkRowsToCardLinks(nextDraft, linkRows, cardId));
      addPayment({
        id: crypto.randomUUID(),
        user_id: uid,
        amount: price,
        payment_type: "linko_card_pro",
        status: "completed",
        created_at: new Date().toISOString(),
      });
      if (isGuestRoute && !user) {
        savePendingCardDraft({
          draft: nextDraft,
          linkRows: linkRows.map((r) => ({
            id: r.id,
            label: r.label,
            type: r.type,
            url: r.url,
          })),
          liveCardId: cardId,
        });
      }
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

    let cardId = existing?.id ?? newCardIdRef.current ?? getEditorLiveCardId();
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
  }, [addToPromotionPool, existing?.id]);

  const isLiveGenerator = isGuestRoute || isNew;

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
      const gid = getEditorLiveCardId();
      savePendingCardDraft({
        draft: useCardEditorDraftStore.getState().draft,
        linkRows,
        liveCardId: gid ?? undefined,
      });
      if (gid) setInstantCardId(gid);
      setSubmitting(true);
      try {
        navigate("/signup", {
          state: {
            signupNotice:
              "명함을 저장하려면 계정이 필요합니다. 가입을 완료하면 이어서 저장할 수 있어요.",
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
      if (!existing) newCardIdRef.current = cardId;
      const card = draftToBusinessCard(draft, {
        id: cardId,
        user_id: user.id,
        created_at: existing?.created_at ?? new Date().toISOString(),
      });
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
                url: draft.website_url.trim() || "https://example.com",
                sort_order: 0,
              },
            ];
      setCardLinks(cardId, finalLinks);
      navigate("/cards");
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
                <span className="font-medium text-emerald-800">저장 완료</span>
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

      <section
        id="card-preview-hero"
        className="mx-auto w-full max-w-[min(100%,28rem)] scroll-mt-6 sm:max-w-[32rem]"
      >
        <div className="overflow-hidden rounded-[1.65rem] border border-slate-200/90 bg-slate-100 shadow-[0_28px_64px_-14px_rgba(15,23,42,0.38)] ring-1 ring-slate-900/[0.06]">
          <p className="border-b border-slate-200/90 bg-white px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
            실시간 명함 · 자동 저장 · 바로 공유
          </p>
          <div className="max-h-[min(76vh,720px)] overflow-y-auto overscroll-contain bg-slate-100">
            <CardPreview
              linkRows={linkRows}
              existingCardId={existing?.id}
              createdAt={existing?.created_at}
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
            <p className="text-center text-base font-bold text-slate-900">지금 이 링크를 고객에게 보내보세요</p>
            <p className="mx-auto mt-2 max-w-sm text-center text-xs leading-relaxed text-slate-600 sm:text-sm">
              카카오톡 공유 시 기본 메시지가 함께 전달돼요.
            </p>
            <button
              type="button"
              className="mt-3 w-full break-all rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-brand-900 hover:bg-slate-50"
              onClick={() => window.open(heroShareUrl, "_blank", "noopener,noreferrer")}
            >
              {heroShareUrl}
            </button>
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
              >
                <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                카카오톡 공유
              </Button>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-2 min-h-11 w-full gap-2 border-2 border-brand-200/80 bg-white hover:bg-brand-50/80"
              onClick={() => void kakaoHeroShare()}
            >
              내 카카오톡으로 테스트 보내기
            </Button>
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-left font-sans text-xs leading-relaxed text-slate-700">
              {heroShareText}
            </pre>
            {heroKakaoHint ? (
              <p className="mt-2 text-center text-xs font-medium text-brand-800 sm:text-sm">
                메시지를 복사했어요. 카카오톡에 붙여넣어 내 채팅으로 보내 보세요.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-center text-sm leading-relaxed text-slate-600">
            {!draft.is_public
              ? "명함을 공개로 설정하면 실제 링크로 열리고, 바로 테스트·공유할 수 있어요."
              : "필수 정보를 모두 올바르게 채우면 위에서 같은 링크로 공유할 수 있어요."}
          </div>
        )}

        {isLiveGenerator ? (
          <EditorCtaBand phase="hero" onTrySample={handleTrySample} showTrySample />
        ) : null}

        {isLiveGenerator && sampleLadderActive ? (
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
            midSlot={
              isLiveGenerator ? (
                <EditorCtaBand phase="mid" onTrySample={handleTrySample} showTrySample />
              ) : null
            }
          />
        </div>

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
            <EditorCtaBand phase="bottom" onTrySample={handleTrySample} showTrySample />
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
            {isGuestRoute ? "저장하고 계정 만들기" : "저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}
