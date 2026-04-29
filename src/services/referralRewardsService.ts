import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export type ReferralRewardRow = {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  payment_id: string;
  payment_amount: number;
  reward_rate: number;
  reward_amount: number;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  withdrawal_request_id: string | null;
};

export type WithdrawalRequestRow = {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  /** referral | partner — 마이그레이션 전 행은 없을 수 있음 */
  source_kind?: string | null;
};

export type ReferralRewardBalances = {
  totalAccrued: number;
  pending: number;
  /** 정산 가능(confirmed이며 출금 신청에 묶이지 않은 금액) */
  confirmedAvailable: number;
  confirmedLocked: number;
  paid: number;
  pendingClawback: number;
};

/** 결제 후 14일이 지난 pending 보상을 출금 가능(confirmed)으로 전환 (추천인 본인 세션) */
export async function finalizeEligibleReferrerRewards(): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("finalize_eligible_referrer_rewards");
  if (error) {
    console.warn("[referralRewardsService] finalize_eligible_referrer_rewards", error.message);
    return null;
  }
  return typeof data === "number" ? data : null;
}

/** 결제 성공 시 서버에 기록 + 추천 보상(10%) 생성 */
export async function recordPaymentAndReferralReward(opts: {
  planType: string;
  amount: number;
  paymentProvider?: string | null;
  providerPaymentId?: string | null;
}): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("record_payment_and_referral_reward", {
    p_plan_type: opts.planType,
    p_amount: opts.amount,
    p_payment_provider: opts.paymentProvider ?? null,
    p_provider_payment_id: opts.providerPaymentId ?? null,
  });
  if (error) {
    console.warn("[referralRewardsService] record_payment_and_referral_reward", error.message);
    return null;
  }
  return typeof data === "string" ? data : null;
}

export async function fetchReferralRewardsForReferrer(referrerUserId: string): Promise<ReferralRewardRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  await finalizeEligibleReferrerRewards();
  const { data, error } = await supabase
    .from("referral_rewards")
    .select("*")
    .eq("referrer_user_id", referrerUserId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[referralRewardsService] fetchReferralRewardsForReferrer", error.message);
    return [];
  }
  return (data as ReferralRewardRow[]) ?? [];
}

export async function fetchPendingClawbacksSum(referrerUserId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { data, error } = await supabase
    .from("referral_clawbacks")
    .select("amount")
    .eq("referrer_user_id", referrerUserId)
    .eq("status", "pending");
  if (error) {
    console.warn("[referralRewardsService] fetchPendingClawbacksSum", error.message);
    return 0;
  }
  const rows = data as { amount: number }[];
  return rows.reduce((s, r) => s + (r.amount ?? 0), 0);
}

export function aggregateRewardBalances(rows: ReferralRewardRow[], pendingClawback: number): ReferralRewardBalances {
  let pending = 0;
  let confirmedAvailable = 0;
  let confirmedLocked = 0;
  let paid = 0;
  for (const r of rows) {
    if (r.status === "pending") pending += r.reward_amount;
    else if (r.status === "confirmed") {
      if (r.withdrawal_request_id) confirmedLocked += r.reward_amount;
      else confirmedAvailable += r.reward_amount;
    } else if (r.status === "paid") paid += r.reward_amount;
  }
  const totalAccrued = pending + confirmedAvailable + confirmedLocked + paid;
  return {
    totalAccrued,
    pending,
    confirmedAvailable,
    confirmedLocked,
    paid,
    pendingClawback,
  };
}

/** 정산 가능 = confirmed 중 출금 미연결 */
export function confirmedAvailableForWithdrawal(rows: ReferralRewardRow[]): ReferralRewardRow[] {
  return rows.filter((r) => r.status === "confirmed" && !r.withdrawal_request_id);
}

export async function createWithdrawalRequestRemote(opts: {
  rewardIds: string[];
  bankName: string;
  bankAccount: string;
  accountHolder: string;
}): Promise<{ ok: boolean; id?: string; message?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, message: "Supabase 미설정" };
  const { data, error } = await supabase.rpc("create_withdrawal_request", {
    p_reward_ids: opts.rewardIds,
    p_bank_name: opts.bankName,
    p_bank_account: opts.bankAccount,
    p_account_holder: opts.accountHolder,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, id: typeof data === "string" ? data : undefined };
}

export async function refundPaymentWithReferral(paymentId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.rpc("refund_payment_with_referral", { p_payment_id: paymentId });
  if (error) {
    console.warn("[referralRewardsService] refund_payment_with_referral", error.message);
    return false;
  }
  return true;
}

export async function fetchWithdrawalRequestsForUser(userId: string): Promise<WithdrawalRequestRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[referralRewardsService] fetchWithdrawalRequestsForUser", error.message);
    return [];
  }
  return (data as WithdrawalRequestRow[]) ?? [];
}

export async function fetchAllWithdrawalRequestsAdmin(): Promise<WithdrawalRequestRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false });
  if (error) {
    console.warn("[referralRewardsService] fetchAllWithdrawalRequestsAdmin", error.message);
    return [];
  }
  return (data as WithdrawalRequestRow[]) ?? [];
}

export async function adminSetWithdrawalStatus(
  requestId: string,
  status: "pending" | "approved" | "paid" | "rejected",
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.rpc("admin_set_withdrawal_request_status", {
    p_request_id: requestId,
    p_new_status: status,
  });
  if (error) {
    console.warn("[referralRewardsService] admin_set_withdrawal_request_status", error.message);
    return false;
  }
  return true;
}

export async function adminConfirmReferralReward(rewardId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.rpc("admin_confirm_referral_reward", { p_reward_id: rewardId });
  if (error) {
    console.warn("[referralRewardsService] admin_confirm_referral_reward", error.message);
    return false;
  }
  return true;
}

export async function adminConfirmAllPendingRewards(): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("admin_confirm_all_pending_rewards");
  if (error) {
    console.warn("[referralRewardsService] admin_confirm_all_pending_rewards", error.message);
    return null;
  }
  return typeof data === "number" ? data : null;
}

export async function fetchPendingReferralRewardsAdmin(): Promise<ReferralRewardRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("referral_rewards")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[referralRewardsService] fetchPendingReferralRewardsAdmin", error.message);
    return [];
  }
  return (data as ReferralRewardRow[]) ?? [];
}

/** 파트너 홍보 수익 — 예약 결제 기준 10% */
export type PartnerCommissionRow = {
  id: string;
  partner_user_id: string;
  payment_id: string;
  reservation_id: string | null;
  card_id: string;
  gross_amount: number;
  partner_amount: number;
  settlement_status: string;
  withdrawal_request_id: string | null;
  created_at: string;
};

export async function finalizeEligiblePartnerCommissionsRemote(): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("finalize_eligible_partner_commissions");
  if (error) {
    console.warn("[referralRewardsService] finalize_eligible_partner_commissions", error.message);
    return null;
  }
  return typeof data === "number" ? data : null;
}

export async function fetchPartnerCommissionsForUser(partnerUserId: string): Promise<PartnerCommissionRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  await finalizeEligiblePartnerCommissionsRemote();
  const { data, error } = await supabase
    .from("partner_commissions")
    .select("*")
    .eq("partner_user_id", partnerUserId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[referralRewardsService] partner_commissions select", error.message);
    return [];
  }
  return (data as PartnerCommissionRow[]) ?? [];
}

export function aggregatePartnerCommissionBalances(rows: PartnerCommissionRow[]): {
  pending: number;
  confirmedAvailable: number;
  confirmedLocked: number;
  paid: number;
} {
  let pending = 0;
  let confirmedAvailable = 0;
  let confirmedLocked = 0;
  let paid = 0;
  for (const r of rows) {
    if (r.settlement_status === "pending") pending += r.partner_amount;
    else if (r.settlement_status === "confirmed") {
      if (r.withdrawal_request_id) confirmedLocked += r.partner_amount;
      else confirmedAvailable += r.partner_amount;
    } else if (r.settlement_status === "paid") paid += r.partner_amount;
  }
  return { pending, confirmedAvailable, confirmedLocked, paid };
}

export function confirmedPartnerCommissionsForWithdrawal(rows: PartnerCommissionRow[]): PartnerCommissionRow[] {
  return rows.filter((r) => r.settlement_status === "confirmed" && !r.withdrawal_request_id);
}

export async function createPartnerCommissionWithdrawalRemote(opts: {
  commissionIds: string[];
  bankName: string;
  bankAccount: string;
  accountHolder: string;
}): Promise<{ ok: boolean; id?: string; message?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, message: "Supabase 미설정" };
  const { data, error } = await supabase.rpc("create_partner_commission_withdrawal_request", {
    p_commission_ids: opts.commissionIds,
    p_bank_name: opts.bankName,
    p_bank_account: opts.bankAccount,
    p_account_holder: opts.accountHolder,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, id: typeof data === "string" ? data : undefined };
}
