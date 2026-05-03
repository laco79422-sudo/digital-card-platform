import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Input } from "@/components/ui/Input";
import { HELPER_PROMO_CHANNELS, HELPER_PROMO_GOALS } from "@/lib/helperCampaignPartnerUrls";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { fetchMyCardsForUser } from "@/services/cardsService";
import { HELPER_LINK_CAMPAIGN_PRICE_KRW, insertHelperCampaignAfterPayment } from "@/services/helperCampaignPartnerService";
import { useAuthStore } from "@/stores/authStore";
import type { BusinessCard } from "@/types/domain";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function HelperLinkCampaignStartPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [payOk, setPayOk] = useState(false);

  const [cardId, setCardId] = useState("");
  const [title, setTitle] = useState("헬퍼링크 파트너 캠페인");
  const [pickedChannels, setPickedChannels] = useState<string[]>(["kakao"]);
  const [targetCustomer, setTargetCustomer] = useState("");
  const [region, setRegion] = useState("");
  const [goal, setGoal] = useState("views");
  const [requiredMessage, setRequiredMessage] = useState("");
  const [forbiddenMessage, setForbiddenMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ownerNote, setOwnerNote] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    void fetchMyCardsForUser({ id: user.id, email: user.email ?? null }).then((r) => {
      const rows = r.status === "ok" ? r.cards : [];
      setCards(rows);
      if (rows[0]?.id) setCardId(rows[0].id);
    });
  }, [user]);

  const toggleChannel = (id: string) => {
    setPickedChannels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const startPaymentDemo = () => {
    const ok = window.confirm(
      `헬퍼링크 파트너 캠페인 시작\n예상 금액 ${HELPER_LINK_CAMPAIGN_PRICE_KRW.toLocaleString()}원(데모)·실제 결제창 연동 전입니다.` +
        `\n결제 및 홍보 요청 작성을 계속할까요?`,
    );
    setPayOk(ok);
    if (!ok) setPayOk(false);
  };

  const submit = useCallback(async () => {
    if (!user?.id || !payOk || !cardId.trim()) return;
    setBusy(true);
    try {
      const paymentUuid = crypto.randomUUID();
      const row = await insertHelperCampaignAfterPayment({
        ownerId: user.id,
        cardId: cardId.trim(),
        paymentId: paymentUuid,
        title,
        targetChannels: pickedChannels,
        targetCustomer,
        region,
        goal:
          HELPER_PROMO_GOALS.find((g) => g.id === goal)?.label ?? goal,
        requiredMessage,
        forbiddenMessage,
        budget,
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
        ownerNoteForPartner: ownerNote,
      });
      if (!row) {
        window.alert("저장에 실패했습니다. Supabase 프로젝트에 최신 마이그레이션이 적용됐는지 확인해 주세요.");
        return;
      }
      window.alert(`요청서가 저장되었습니다(status: recruiting).\n파트너 메뉴에 노출되는 상세 브라우즈는 순차 제공됩니다.\n헬퍼링크 만들기 카피: 혼자 홍보가 어렵다면 헬퍼링크 파트너와 함께 홍보를 시작해 보세요.`);
      navigate("/dashboard#dashboard-section-helper-partner-performance", { replace: true });
    } finally {
      setBusy(false);
    }
  }, [
    budget,
    cardId,
    endDate,
    forbiddenMessage,
    goal,
    navigate,
    ownerNote,
    payOk,
    pickedChannels,
    region,
    requiredMessage,
    startDate,
    targetCustomer,
    title,
    user,
  ]);

  if (!user?.id) {
    return (
      <div className={cn(layout.page, "py-12")}>
        <p className="text-slate-700">로그인 후 헬퍼링크 만들기를 진행할 수 있습니다.</p>
        <Link to="/login" className={cn("mt-4 inline-flex", linkButtonClassName({ size: "lg" }))}>
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(layout.page, "mx-auto max-w-2xl py-10")}>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> 내 공간
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">헬퍼링크 만들기</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        혼자 홍보가 어렵다면 헬퍼링크 파트너와 함께 홍보를 시작해 보세요. 유료 안내 후 홍보 요청서를 작성하고 모집(recruiting) 상태로 저장됩니다.
      </p>

      <button
        type="button"
        className={cn("mt-6 w-full rounded-xl px-4 py-3 text-base font-bold text-white shadow", payOk ? "bg-emerald-600" : "bg-brand-700 hover:bg-brand-800")}
        onClick={startPaymentDemo}
      >
        {payOk ? "데모 결제 완료(시뮬레이션)" : `${HELPER_LINK_CAMPAIGN_PRICE_KRW.toLocaleString()}원 결제 시작(데모 안내)`}
      </button>
      {!payOk ? (
        <p className="mt-2 text-xs text-slate-500">실제 카드결제 게이트웨이 연동 전까지 시뮬레이션으로 진행합니다.</p>
      ) : null}

      <fieldset disabled={!payOk || busy} className="mt-8 space-y-5">
        <div>
          <label className="text-sm font-semibold text-slate-800">홍보할 명함</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {(c.brand_name || c.person_name || c.slug || c.id).trim()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-800">캠페인 제목</label>
          <Input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">원하는 홍보 채널</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {HELPER_PROMO_CHANNELS.map((ch) => (
              <label key={ch.id} className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={pickedChannels.includes(ch.id)}
                  onChange={() => toggleChannel(ch.id)}
                />
                {ch.label}
              </label>
            ))}
          </div>
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
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
            {HELPER_PROMO_GOALS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-800">꼭 전달해야 할 문구</label>
          <textarea className="mt-2 w-full min-h-[72px] rounded-xl border px-3 py-2 text-sm" value={requiredMessage} onChange={(e) => setRequiredMessage(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-800">금지할 표현</label>
          <textarea className="mt-2 w-full min-h-[56px] rounded-xl border px-3 py-2 text-sm" value={forbiddenMessage} onChange={(e) => setForbiddenMessage(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-800">예산</label>
          <Input className="mt-2" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="예: 부가 비용까지 50만 원" />
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
          <label className="text-sm font-semibold text-slate-800">파트너에게 요청할 설명</label>
          <textarea className="mt-2 w-full min-h-[88px] rounded-xl border px-3 py-2 text-sm" value={ownerNote} onChange={(e) => setOwnerNote(e.target.value)} />
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!payOk || busy}
        className={cn(
          "mt-8 w-full rounded-xl px-4 py-3 text-base font-bold text-white shadow",
          !payOk ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:bg-black",
        )}
        onClick={() => void submit()}
      >
        저장하고 모집 시작 (helper_campaign.status = recruiting)
      </button>
    </div>
  );
}
