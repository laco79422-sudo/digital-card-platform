import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { layout } from "@/lib/ui-classes";
import { resolveCardHeroDisplayUrl } from "@/lib/businessCardHeroImage";
import { cn } from "@/lib/utils";
import { createPromotionApplicationRemote, fetchPromotionEnabledCards } from "@/services/promotionService";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { BusinessCard, PromotionApplication } from "@/types/domain";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";

function cardDisplayName(card: BusinessCard): string {
  return card.person_name.trim() || card.brand_name.trim() || "이름 없는 명함";
}

export function PromotePage() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const promotionApplications = useAppDataStore((s) => s.promotionApplications);
  const upsertPromotionApplication = useAppDataStore((s) => s.upsertPromotionApplication);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchPromotionEnabledCards().then((cards) => {
      if (cards) cards.forEach((card) => upsertBusinessCard(card));
    });
  }, [upsertBusinessCard]);

  const promotableCards = useMemo(
    () => businessCards.filter((card) => card.is_public && card.promotion_enabled),
    [businessCards],
  );

  if (authLoading) {
    return (
      <div className={cn(layout.page, "flex min-h-[40vh] items-center justify-center py-12")}>
        <p className="text-sm text-slate-500">인증 정보를 확인하는 중...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/promote" }} />;
  }

  const applyPromotion = async (card: BusinessCard) => {
    const ownerUserId = card.owner_id ?? card.user_id;
    if (ownerUserId === user.id) {
      setMessage("내 명함에는 홍보 신청을 할 수 없습니다.");
      return;
    }
    const existing = promotionApplications.find(
      (application) => application.card_id === card.id && application.applicant_user_id === user.id,
    );
    if (existing) {
      setMessage("이미 홍보 신청한 명함입니다. 내 공간에서 승인 상태를 확인해 주세요.");
      return;
    }

    const application: PromotionApplication = {
      id: crypto.randomUUID(),
      card_id: card.id,
      applicant_user_id: user.id,
      owner_user_id: ownerUserId,
      status: "pending",
      promoter_code: null,
      promotion_url: null,
      created_at: new Date().toISOString(),
      approved_at: null,
      applicant_name: user.name,
      applicant_email: user.email,
      card_name: cardDisplayName(card),
      card_slug: card.slug,
    };
    const remote = await createPromotionApplicationRemote(application);
    upsertPromotionApplication({ ...application, ...(remote ?? {}) });
    setMessage("홍보 신청이 접수되었습니다. 이용자 승인 후 전용 홍보 링크를 받을 수 있어요.");
  };

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            홍보 가능한 명함
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
            홍보할 명함을 선택하고 신청하면, 승인 후 내 전용 홍보 링크를 받을 수 있어요.
          </p>
        </div>
        <Link to="/dashboard" className="text-sm font-bold text-brand-700">
          내 공간으로
        </Link>
      </div>

      {message ? (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-4 text-sm font-semibold text-brand-900">
          {message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {promotableCards.map((card) => {
          const applicationsCount = promotionApplications.filter((application) => application.card_id === card.id).length;
          const existing = promotionApplications.find(
            (application) => application.card_id === card.id && application.applicant_user_id === user.id,
          );
          return (
            <Card key={card.id}>
              <CardHeader>
                <div className="flex gap-4">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                    <img
                      src={resolveCardHeroDisplayUrl(card)}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{cardDisplayName(card)}</h2>
                    <p className="mt-1 text-sm text-slate-600">{card.job_title || card.brand_name || "직함 미입력"}</p>
                    <p className="mt-2 text-xs font-semibold text-brand-700">총 홍보 신청 수 {applicationsCount}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{card.intro || "소개 문구가 없습니다."}</p>
                <Button
                  type="button"
                  className="mt-4 w-full"
                  onClick={() => void applyPromotion(card)}
                  disabled={Boolean(existing)}
                >
                  {existing ? "홍보 신청 완료" : "홍보 신청"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {promotableCards.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <p className="text-lg font-bold text-slate-900">아직 홍보 가능한 명함이 없습니다.</p>
          <p className="mt-2 text-sm text-slate-500">명함 이용자가 홍보 링크를 추가하면 이곳에 표시됩니다.</p>
        </div>
      ) : null}
    </div>
  );
}
