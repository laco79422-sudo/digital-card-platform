import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { DesignRequest, DesignRequestStatus } from "@/types/domain";

const TABLE_DESIGN_REQUESTS = "design_requests";

export type CreateDesignRequestInput = Omit<
  DesignRequest,
  "status" | "payment_status" | "assigned_designer_id" | "draft_image_url" | "final_card_id" | "created_at" | "updated_at"
>;

export function buildDesignRequest(input: CreateDesignRequestInput): DesignRequest {
  const now = new Date().toISOString();
  return {
    ...input,
    status: "pending_payment",
    payment_status: "unpaid",
    assigned_designer_id: null,
    draft_image_url: null,
    final_card_id: null,
    created_at: now,
    updated_at: now,
  };
}

export async function createDesignRequest(request: DesignRequest): Promise<{ request: DesignRequest; remote: boolean }> {
  if (!isSupabaseConfigured || !supabase) return { request, remote: false };

  const { data, error } = await supabase.from(TABLE_DESIGN_REQUESTS).insert(request).select("*").single();
  if (error) {
    console.warn("[designRequestsService] createDesignRequest", error.message);
    return { request, remote: false };
  }
  return { request: data as DesignRequest, remote: true };
}

export async function startDesignPayment(request: DesignRequest): Promise<{ ok: boolean; message: string }> {
  // Toss Payments 연결 시 이 함수에서 결제 위젯/결제창을 시작합니다.
  return {
    ok: true,
    message: `제작 의뢰가 접수되었습니다. 결제 시스템 연결 후 전문가 배정이 시작됩니다. (${request.id})`,
  };
}

export async function handleDesignPaymentSuccess(requestId: string): Promise<boolean> {
  return updateDesignRequestRemote(requestId, { status: "paid", payment_status: "paid" });
}

export async function fetchMyDesignRequests(user: {
  id: string;
  email?: string | null;
}): Promise<DesignRequest[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const email = user.email?.trim();
  let query = supabase.from(TABLE_DESIGN_REQUESTS).select("*").eq("user_id", user.id);
  if (email) query = supabase.from(TABLE_DESIGN_REQUESTS).select("*").or(`user_id.eq.${user.id},email.ilike.${email}`);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.warn("[designRequestsService] fetchMyDesignRequests", error.message);
    return null;
  }
  return data as DesignRequest[];
}

export async function fetchAllDesignRequests(): Promise<DesignRequest[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE_DESIGN_REQUESTS)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[designRequestsService] fetchAllDesignRequests", error.message);
    return null;
  }
  return data as DesignRequest[];
}

export async function fetchAssignedDesignRequests(designerId: string): Promise<DesignRequest[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE_DESIGN_REQUESTS)
    .select("*")
    .eq("assigned_designer_id", designerId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[designRequestsService] fetchAssignedDesignRequests", error.message);
    return null;
  }
  return data as DesignRequest[];
}

export async function updateDesignRequestRemote(
  id: string,
  patch: Partial<DesignRequest> & { status?: DesignRequestStatus },
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase
    .from(TABLE_DESIGN_REQUESTS)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.warn("[designRequestsService] updateDesignRequestRemote", error.message);
    return false;
  }
  return true;
}
