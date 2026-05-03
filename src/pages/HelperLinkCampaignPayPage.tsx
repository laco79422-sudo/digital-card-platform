import { linkButtonClassName } from "@/components/ui/buttonStyles";
import {
  HELPER_LINK_PAYMENT_CTA,
  HELPER_LINK_PAYMENT_LEAD,
  HELPER_LINK_PRICE_KRW,
} from "@/lib/helperLinkPricing";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { fetchMyCardsForUser } from "@/services/cardsService";
import { insertPaidHelperCampaignDraft } from "@/services/helperCampaignPartnerService";
import { useAuthStore } from "@/stores/authStore";
import type { BusinessCard } from "@/types/domain";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/** 결제(데모) 후 캠페인 draft 생성 → 작성 화면으로 이동 */
export function HelperLinkCampaignPayPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [cardId, setCardId] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    void fetchMyCardsForUser({ id: user.id, email: user.email ?? null }).then((r) => {
      const rows = r.status === "ok" ? r.cards : [];
      setCards(rows);
      if (rows.length === 1) setCardId(rows[0].id);
      else setCardId((cur) => (cur && rows.some((c) => c.id === cur) ? cur : ""));
    });
  }, [user]);

  const runDemoPayment = async () => {
    if (!user?.id) return;
    if (!cards.length) {
      window.alert("헬퍼링크를 만들려면 먼저 명함이 필요합니다.");
      return;
    }
    if (!cardId.trim()) {
      window.alert("홍보에 사용할 명함을 선택해 주세요.");
      return;
    }
    const agreed = window.confirm(
      HELPER_LINK_PAYMENT_LEAD + "\n\n결제 후 홍보 요청서 작성 화면으로 이동합니다.\n실제 카드결제 연동 전 · 데모로 진행할까요?",
    );
    if (!agreed) return;
    setBusy(true);
    try {
      const row = await insertPaidHelperCampaignDraft({
        ownerId: user.id,
        cardId: cardId.trim(),
        paymentId: crypto.randomUUID(),
      });
      if (!row?.id) {
        window.alert(
          "캠페인 초안을 만들지 못했습니다. Supabase 마이그레이션(helper_campaigns 확장 포함) 적용 여부를 확인해 주세요.",
        );
        return;
      }
      navigate(`/helperlink/create?campaignId=${encodeURIComponent(row.id)}`, { replace: true });
    } finally {
      setBusy(false);
    }
  };

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
    <div className={cn(layout.page, "mx-auto max-w-lg py-10")}>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> 내 공간
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">헬퍼링크 만들기</h1>
      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-800">{HELPER_LINK_PAYMENT_LEAD}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        결제 완료 후 홍보 요청서를 작성하면 파트너 모집이 시작됩니다. 요청서를 저장하기 전까지는 「모집 중」으로 노출되지 않습니다.
      </p>

      {cards.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p className="font-semibold">헬퍼링크를 만들려면 먼저 명함이 필요합니다.</p>
          <Link
            to="/cards/new"
            className={cn("mt-4 inline-flex", linkButtonClassName({ variant: "primary", size: "lg" }))}
          >
            내 명함 만들기
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {cards.length === 1 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950">
              저장된 명함이 1개라 자동 선택되었습니다.
            </div>
          ) : (
            <>
              <label className="text-sm font-semibold text-slate-800">홍보할 명함 선택</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
              >
                <option value="">선택해 주세요</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {(c.brand_name || c.person_name || c.slug || c.id).trim()}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={busy || cards.length === 0 || (cards.length > 1 && !cardId.trim())}
        className={cn(
          "mt-8 w-full rounded-xl px-4 py-3 text-base font-bold text-white shadow-sm",
          busy || cards.length === 0 || (cards.length > 1 && !cardId.trim())
            ? "cursor-not-allowed bg-slate-400"
            : "bg-cta-500 hover:bg-cta-600",
        )}
        onClick={() => void runDemoPayment()}
      >
        {busy ? "처리 중…" : HELPER_LINK_PAYMENT_CTA}
      </button>
      <p className="mt-2 text-xs text-slate-500">
        결제 금액 {HELPER_LINK_PRICE_KRW.toLocaleString()}원 · 실제 PG 연동 전 데모 흐름입니다.
      </p>
      <Link
        to="/helper-partner/campaigns"
        className="mt-8 block text-center text-sm font-semibold text-brand-800 underline underline-offset-2"
      >
        헬퍼링크 파트너 모집 목록 보기
      </Link>
    </div>
  );
}
