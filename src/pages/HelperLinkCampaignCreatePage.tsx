import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Input } from "@/components/ui/Input";
import {
  HELPER_PROMO_CHANNELS,
  HELPER_PROMO_GOALS,
} from "@/lib/helperCampaignPartnerUrls";
import { buildHelperCampaignTitlePresets } from "@/lib/helperCampaignTitleSuggestions";
import { HELPER_LINK_PRICE_KRW } from "@/lib/helperLinkPricing";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { handlePromotionLinkPaymentSuccess } from "@/services/promotionService";
import { fetchMyCardsForUser } from "@/services/cardsService";
import {
  fetchHelperCampaignByIdForOwner,
  publishHelperCampaignAsRecruiting,
} from "@/services/helperCampaignPartnerService";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { BusinessCard } from "@/types/domain";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const CUSTOM_TITLE = "__custom__";

export function HelperLinkCampaignCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const campaignId = params.get("campaignId")?.trim() ?? "";
  const user = useAuthStore((s) => s.user);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);

  const [bootError, setBootError] = useState<string | null>(null);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [busy, setBusy] = useState(false);

  const [cardId, setCardId] = useState("");
  const [titleMode, setTitleMode] = useState<string>("");
  const [titleCustom, setTitleCustom] = useState("");

  const [pickedChannels, setPickedChannels] = useState<string[]>([]);
  const [customChannelText, setCustomChannelText] = useState("");

  const [targetCustomer, setTargetCustomer] = useState("");
  const [region, setRegion] = useState("");
  const [goalId, setGoalId] = useState<string>("views");
  const [customGoalText, setCustomGoalText] = useState("");

  const [requiredMessage, setRequiredMessage] = useState("");
  const [forbiddenMessage, setForbiddenMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requestNote, setRequestNote] = useState("");

  const selectedCard = useMemo(() => cards.find((c) => c.id === cardId) ?? null, [cards, cardId]);
  const titlePresets = useMemo(() => (selectedCard ? buildHelperCampaignTitlePresets(selectedCard) : []), [selectedCard]);

  const load = useCallback(async () => {
    if (!user?.id || !campaignId) {
      setBootError(!campaignId ? "캠페인 정보가 없습니다." : null);
      return;
    }
    setBootError(null);
    const draft = await fetchHelperCampaignByIdForOwner(campaignId, user.id);
    if (!draft) {
      setBootError("캠페인을 불러오지 못했거나 권한이 없습니다.");
      return;
    }
    if (draft.status !== "draft") {
      navigate("/dashboard#dashboard-section-helper-mgmt", { replace: true });
      return;
    }
    const res = await fetchMyCardsForUser({ id: user.id, email: user.email ?? null });
    const rows = res.status === "ok" ? res.cards : [];
    setCards(rows);
    const cid = draft.card_id.trim();
    if (rows.some((c) => c.id === cid)) {
      setCardId(cid);
    } else if (rows.length === 1) {
      setCardId(rows[0].id);
    }

    const chans = draft.target_channels;
    const arr = Array.isArray(chans) ? chans.filter((x): x is string => typeof x === "string") : [];
    if (arr.length) setPickedChannels(arr);

    setTargetCustomer(draft.target_customer ?? "");
    setRegion(draft.region ?? "");
    setRequiredMessage(draft.required_message ?? "");
    setForbiddenMessage(draft.forbidden_message ?? "");
    if (draft.start_date) setStartDate(draft.start_date.slice(0, 10));
    if (draft.end_date) setEndDate(draft.end_date.slice(0, 10));
    setRequestNote(draft.request_note ?? draft.owner_note_for_partner ?? "");
    setCustomChannelText(draft.custom_channel_text ?? "");
    setCustomGoalText(draft.custom_goal_text ?? "");
    const g = HELPER_PROMO_GOALS.find((x) => x.label === draft.goal);
    if (g) setGoalId(g.id);
    else if ((draft.goal ?? "").trim()) {
      setGoalId("other");
      setCustomGoalText(draft.goal ?? "");
    }
    if ((draft.title ?? "").trim()) {
      setTitleMode(CUSTOM_TITLE);
      setTitleCustom(draft.title);
    }
  }, [campaignId, navigate, user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (cards.length === 1 && !cardId) setCardId(cards[0].id);
  }, [cards, cardId]);

  useEffect(() => {
    if (!selectedCard || titleMode === CUSTOM_TITLE) return;
    if (titlePresets[0] && !titleMode) setTitleMode(titlePresets[0]);
  }, [selectedCard, titleMode, titlePresets]);

  const toggleChannel = (id: string) => {
    setPickedChannels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const resolvedTitle = useMemo(() => {
    if (titleMode === CUSTOM_TITLE) return titleCustom.trim();
    return titleMode.trim();
  }, [titleCustom, titleMode]);

  const resolvedGoalLabel = useMemo(() => {
    if (goalId === "other") return customGoalText.trim() || HELPER_PROMO_GOALS.find((g) => g.id === "other")!.label;
    return HELPER_PROMO_GOALS.find((g) => g.id === goalId)?.label ?? goalId;
  }, [goalId, customGoalText]);

  const submit = async () => {
    if (!user?.id || !campaignId || !selectedCard) return;
    const errs: string[] = [];
    if (!cardId.trim()) errs.push("홍보할 명함을 선택해 주세요.");
    if (!resolvedTitle) errs.push("캠페인 제목을 선택하거나 입력해 주세요.");
    if (!pickedChannels.length) errs.push("원하는 홍보 채널을 한 가지 이상 선택해 주세요.");
    if (pickedChannels.includes("other") && !customChannelText.trim()) errs.push('채널에서 「기타」를 선택한 경우 내용을 입력해 주세요.');
    if (!targetCustomer.trim()) errs.push("원하는 고객 유형을 입력해 주세요.");
    if (!region.trim()) errs.push("홍보 지역을 입력해 주세요.");
    if (goalId === "other" && !customGoalText.trim()) errs.push("홍보 목적 「기타」일 때 목적을 입력해 주세요.");
    if (!requiredMessage.trim()) errs.push("꼭 전달해야 할 문구를 입력해 주세요.");
    if (!forbiddenMessage.trim()) errs.push("피해야 할 표현을 입력해 주세요.");
    if (!startDate.trim() || !endDate.trim()) errs.push("진행 시작일과 종료일을 모두 선택해 주세요.");
    if (errs.length) {
      window.alert(errs.join("\n"));
      return;
    }

    setBusy(true);
    try {
      const row = await publishHelperCampaignAsRecruiting({
        campaignId,
        ownerUserId: user.id,
        cardId,
        title: resolvedTitle,
        targetChannels: pickedChannels,
        customChannelText: pickedChannels.includes("other") ? customChannelText : "",
        targetCustomer,
        region,
        goalDisplay: resolvedGoalLabel,
        customGoalText: goalId === "other" ? customGoalText : "",
        requiredMessage,
        forbiddenMessage,
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
        requestNote,
      });
      if (!row) {
        window.alert(
          "저장하지 못했습니다. 초안 상태(draft)인지 확인하거나 네트워크·마이그레이션을 점검해 주세요.",
        );
        return;
      }

      await handlePromotionLinkPaymentSuccess(selectedCard.id);
      upsertBusinessCard({
        ...selectedCard,
        promotion_enabled: true,
        promotion_payment_status: "paid",
        promotion_price: HELPER_LINK_PRICE_KRW,
      });

      window.alert("헬퍼링크 파트너 모집이 시작되었습니다. 파트너 메뉴에 요청이 노출됩니다.");
      navigate("/dashboard#dashboard-section-helper-mgmt", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  if (!user?.id) {
    return (
      <div className={cn(layout.page, "py-12")}>
        <p className="text-slate-700">로그인 후 이어 작성할 수 있습니다.</p>
        <Link to="/login" className={cn("mt-4 inline-flex", linkButtonClassName({ size: "lg" }))}>
          로그인
        </Link>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className={cn(layout.page, "mx-auto max-w-lg py-10")}>
        <p className="text-red-700">{bootError}</p>
        <Link to="/helperlink/pay" className={cn("mt-4 inline-flex", linkButtonClassName({ size: "lg" }))}>
          헬퍼링크 결제 화면으로
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(layout.page, "mx-auto max-w-2xl pb-14 pt-10")}>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> 내 공간
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">헬퍼링크 홍보 요청서</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        결제가 완료되었습니다. 아래 정보를 채운 뒤 저장하면 「파트너 모집 중」 상태로 공개됩니다 (저장 전까지는 노출되지 않습니다).
      </p>

      <fieldset disabled={busy} className="mt-8 space-y-6">
        {!cards.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
            헬퍼링크를 만들려면 먼저 명함이 필요합니다.
            <Link to="/cards/new" className="mt-2 block font-bold underline">
              내 명함 만들기
            </Link>
          </div>
        ) : cards.length === 1 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950">
            저장된 명함이 1개라 자동 선택되었습니다.
          </div>
        ) : null}

        {cards.length > 1 ? (
          <div>
            <label className="text-sm font-semibold text-slate-800">홍보할 명함</label>
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              value={cardId}
              onChange={(e) => {
                setCardId(e.target.value);
                setTitleMode("");
              }}
            >
              <option value="">선택해 주세요</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.brand_name || c.person_name || c.slug || c.id).trim()}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {selectedCard ? (
          <div>
            <p className="text-sm font-semibold text-slate-800">캠페인 제목</p>
            <div className="mt-3 space-y-2">
              {titlePresets.map((t) => (
                <label key={t} className="flex cursor-pointer items-start gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="htitle"
                    className="mt-1"
                    checked={titleMode === t}
                    onChange={() => {
                      setTitleMode(t);
                    }}
                  />
                  <span>{t}</span>
                </label>
              ))}
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="htitle"
                  className="mt-1"
                  checked={titleMode === CUSTOM_TITLE}
                  onChange={() => setTitleMode(CUSTOM_TITLE)}
                />
                <span>직접 입력</span>
              </label>
            </div>
            {titleMode === CUSTOM_TITLE ? (
              <Input
                className="mt-2"
                placeholder="캠페인 제목을 입력해 주세요"
                value={titleCustom}
                onChange={(e) => setTitleCustom(e.target.value)}
              />
            ) : null}
          </div>
        ) : null}

        {!selectedCard && cards.length > 0 ? (
          <p className="text-sm text-amber-800">먼저 홍보할 명함을 선택해 주세요.</p>
        ) : null}

        <div>
          <p className="text-sm font-semibold text-slate-800">원하는 홍보 채널 (복수 선택)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {HELPER_PROMO_CHANNELS.map((ch) => (
              <label key={ch.id} className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs">
                <input type="checkbox" checked={pickedChannels.includes(ch.id)} onChange={() => toggleChannel(ch.id)} />
                {ch.label}
              </label>
            ))}
          </div>
          {pickedChannels.includes("other") ? (
            <textarea
              className="mt-2 w-full min-h-[72px] rounded-xl border px-3 py-2 text-sm"
              placeholder="홍보하고 싶은 채널이나 장소를 입력해주세요.\n예: 아파트 단톡방, 지역 맘카페, 동호회 단톡방"
              value={customChannelText}
              onChange={(e) => setCustomChannelText(e.target.value)}
            />
          ) : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800">원하는 고객 유형</label>
          <Input className="mt-2" value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-800">홍보 지역</label>
          <Input className="mt-2" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800">홍보 목적</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
          >
            {HELPER_PROMO_GOALS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
          {goalId === "other" ? (
            <textarea
              className="mt-2 w-full min-h-[56px] rounded-xl border px-3 py-2 text-sm"
              placeholder="원하는 목적을 구체적으로 적어 주세요"
              value={customGoalText}
              onChange={(e) => setCustomGoalText(e.target.value)}
            />
          ) : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800">꼭 전달해야 할 문구</label>
          <textarea className="mt-2 w-full min-h-[72px] rounded-xl border px-3 py-2 text-sm" value={requiredMessage} onChange={(e) => setRequiredMessage(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-800">피해야 할 표현</label>
          <textarea className="mt-2 w-full min-h-[56px] rounded-xl border px-3 py-2 text-sm" value={forbiddenMessage} onChange={(e) => setForbiddenMessage(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-800">진행 시작일</label>
            <Input type="date" className="mt-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">진행 종료일</label>
            <Input type="date" className="mt-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-800">기타 요청사항</label>
          <textarea className="mt-2 w-full min-h-[72px] rounded-xl border px-3 py-2 text-sm" value={requestNote} onChange={(e) => setRequestNote(e.target.value)} />
        </div>
      </fieldset>

      <button
        type="button"
        disabled={busy || !campaignId || !selectedCard || !resolvedTitle || !pickedChannels.length}
        className={cn(
          "mt-10 w-full rounded-xl px-4 py-3 text-base font-bold text-white shadow-sm",
          busy || !selectedCard ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:bg-black",
        )}
        onClick={() => void submit()}
      >
        {busy ? "저장 중…" : "헬퍼링크 파트너 모집 시작하기"}
      </button>
    </div>
  );
}
