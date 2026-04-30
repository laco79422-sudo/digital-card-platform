import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { fetchMyCardsForUser } from "@/services/cardsService";
import { fetchMyDesignRequests } from "@/services/designRequestsService";
import {
  aggregatePartnerCommissionBalances,
  aggregateRewardBalances,
  fetchPartnerCommissionsForUser,
  fetchPendingClawbacksSum,
  fetchReferralRewardsForReferrer,
  fetchWithdrawalRequestsForUser,
  finalizeEligiblePartnerCommissionsRemote,
  finalizeEligibleReferrerRewards,
} from "@/services/referralRewardsService";
import { fetchReservationsForCardIds } from "@/services/reservationsService";

export type AccountDeletionEligibility = {
  /** 출금 신청·의뢰·예약 등으로 탈퇴 버튼 비활성 */
  canProceedBasics: boolean;
  basicBlockReasons: string[];
  /** 출금 가능 추천 보상(원) — 0이 아니면 출금 또는 포기 필요 */
  referralConfirmedAvailableKrw: number;
  referralPendingKrw: number;
  /** 파트너 수익 */
  partnerConfirmedAvailableKrw: number;
  partnerPendingKrw: number;
  pendingWithdrawalsCount: number;
};

export async function checkAccountDeletionEligibility(user: {
  id: string;
  email?: string | null;
}): Promise<AccountDeletionEligibility> {
  const basicBlockReasons: string[] = [];

  await finalizeEligibleReferrerRewards();
  await finalizeEligiblePartnerCommissionsRemote();

  const rewards = await fetchReferralRewardsForReferrer(user.id);
  const claw = await fetchPendingClawbacksSum(user.id);
  const balances = aggregateRewardBalances(rewards, claw);

  const partnerRows = await fetchPartnerCommissionsForUser(user.id);
  const partnerB = aggregatePartnerCommissionBalances(partnerRows);

  const withdrawals = await fetchWithdrawalRequestsForUser(user.id);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

  const cardsResult = await fetchMyCardsForUser({ id: user.id, email: user.email ?? undefined });
  const cards = cardsResult.cards ?? [];
  const cardIds = cards.map((c) => c.id);

  const reservations = cardIds.length > 0 ? await fetchReservationsForCardIds(cardIds) : [];
  const blockingReservations = reservations.filter((r) => {
    if (r.status === "cancelled") return false;
    if (r.status === "pending") return true;
    const ps = (r.payment_status ?? "").toLowerCase();
    return ps === "unpaid" || ps === "pending";
  });

  const designs = await fetchMyDesignRequests({ id: user.id, email: user.email ?? undefined });
  const blockingDesignsStrict = designs?.filter((d) => d.status !== "completed") ?? [];

  const paymentRequiredCards = cards.filter((c) => c.status === "payment_required");

  if (pendingWithdrawals.length > 0) {
    basicBlockReasons.push("처리 중인 출금 신청이 있습니다. 처리 완료 후 탈퇴할 수 있습니다.");
  }
  if (blockingDesignsStrict.length > 0) {
    basicBlockReasons.push("진행 중인 제작 의뢰가 있습니다. 완료 후 탈퇴해 주세요.");
  }
  if (blockingReservations.length > 0) {
    basicBlockReasons.push("진행 중인 예약·결제 건이 있습니다. 처리 후 탈퇴해 주세요.");
  }
  if (paymentRequiredCards.length > 0) {
    basicBlockReasons.push("결제가 필요한 명함이 있습니다. 정리 후 탈퇴해 주세요.");
  }

  const canProceedBasics = basicBlockReasons.length === 0;

  return {
    canProceedBasics,
    basicBlockReasons,
    referralConfirmedAvailableKrw: balances.confirmedAvailable,
    referralPendingKrw: balances.pending,
    partnerConfirmedAvailableKrw: partnerB.confirmedAvailable,
    partnerPendingKrw: partnerB.pending,
    pendingWithdrawalsCount: pendingWithdrawals.length,
  };
}

export type SoftDeleteAccountOpts = {
  reason?: string | null;
  /** 출금 가능(confirmed·미출금) 추천·파트너 수익 포기 */
  forfeitConfirmedRewards: boolean;
};

export async function deleteAccountSoft(
  _userId: string,
  opts: SoftDeleteAccountOpts,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, message: "연결 설정을 확인할 수 없습니다." };
  const { error } = await supabase.rpc("soft_delete_account", {
    p_reason: opts.reason?.trim() || null,
    p_forfeit_confirmed_rewards: opts.forfeitConfirmedRewards,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export type DeletedProfileAdminRow = {
  id: string;
  referral_code: string | null;
  deleted_at: string | null;
  deletion_reason: string | null;
  forfeitedReferralKrw: number;
};

export async function fetchDeletedProfilesAdmin(): Promise<DeletedProfileAdminRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, referral_code, deleted_at, deletion_reason, is_deleted")
    .eq("is_deleted", true)
    .order("deleted_at", { ascending: false })
    .limit(100);
  if (error) {
    console.warn("[accountService] fetchDeletedProfilesAdmin", error.message);
    return [];
  }
  const rows = (data ?? []) as Array<{
    id: string;
    referral_code?: string;
    deleted_at?: string | null;
    deletion_reason?: string | null;
  }>;

  const out: DeletedProfileAdminRow[] = [];
  for (const r of rows) {
    let forfeitedSum = 0;
    const { data: rr } = await supabase
      .from("referral_rewards")
      .select("reward_amount")
      .eq("referrer_user_id", r.id)
      .eq("status", "forfeited");
    if (Array.isArray(rr)) {
      forfeitedSum = rr.reduce((s, x: { reward_amount?: number }) => s + (x.reward_amount ?? 0), 0);
    }
    out.push({
      id: r.id,
      referral_code: r.referral_code ?? null,
      deleted_at: r.deleted_at ?? null,
      deletion_reason: r.deletion_reason ?? null,
      forfeitedReferralKrw: forfeitedSum,
    });
  }
  return out;
}
