import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export type ReservationInsert = {
  card_id: string;
  customer_name: string;
  phone: string;
  service_name: string;
  reservation_date: string;
  time_slot: string;
  amount_krw: number;
  partner_user_id?: string | null;
  request_message?: string | null;
};

export type ReservationRow = {
  id: string;
  card_id: string;
  customer_name: string;
  phone: string;
  service_name: string;
  reservation_date: string;
  time_slot: string;
  amount_krw: number;
  status: string;
  booking_token: string;
  payment_status?: string | null;
  payment_id?: string | null;
  request_message?: string | null;
  created_at: string;
};

/** 예약 저장 — anon 가능 (RLS: 공개 명함만) */
export async function insertReservationRemote(row: ReservationInsert): Promise<ReservationRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const insertPayload: Record<string, unknown> = {
    card_id: row.card_id,
    customer_name: row.customer_name,
    phone: row.phone,
    service_name: row.service_name,
    reservation_date: row.reservation_date,
    time_slot: row.time_slot,
    amount_krw: row.amount_krw,
  };
  if (row.partner_user_id) insertPayload.partner_user_id = row.partner_user_id;
  if (row.request_message != null && row.request_message !== "") {
    insertPayload.request_message = row.request_message;
  }

  const { data, error } = await supabase
    .from("reservations")
    .insert(insertPayload)
    .select(
      "id,card_id,customer_name,phone,service_name,reservation_date,time_slot,amount_krw,status,booking_token,payment_status,payment_id,request_message,created_at",
    )
    .single();
  if (error) {
    console.warn("[reservationsService] insert", error.message);
    return null;
  }
  return data as ReservationRow;
}

export type ReservationPayPayload = {
  id: string;
  card_id: string;
  customer_name: string;
  phone: string;
  service_name: string;
  reservation_date: string;
  time_slot: string;
  amount_krw: number;
  status: string;
  created_at: string;
};

export async function fetchReservationForPaymentRemote(
  reservationId: string,
  token: string,
): Promise<ReservationPayPayload | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("get_reservation_for_payment", {
    p_id: reservationId,
    p_token: token,
  });
  if (error) {
    console.warn("[reservationsService] get_reservation_for_payment", error.message);
    return null;
  }
  if (!data) return null;
  const rows = Array.isArray(data) ? data : [data];
  return (rows[0] as ReservationPayPayload | undefined) ?? null;
}

export async function updateReservationPendingAmountRemote(
  reservationId: string,
  token: string,
  amountKrw: number,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data, error } = await supabase.rpc("update_reservation_pending_amount", {
    p_id: reservationId,
    p_token: token,
    p_amount_krw: amountKrw,
  });
  if (error) {
    console.warn("[reservationsService] update_reservation_pending_amount", error.message);
    return false;
  }
  return data === true;
}

export async function confirmReservationDemoPaymentRemote(
  reservationId: string,
  token: string,
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("confirm_reservation_demo_payment", {
    p_reservation_id: reservationId,
    p_token: token,
  });
  if (error) {
    console.warn("[reservationsService] confirm_reservation_demo_payment", error.message);
    return null;
  }
  if (data == null) return null;
  return String(data);
}

/** 명함 소유자용 예약 목록 (RLS: 본인 카드만) */
export async function fetchReservationsForCardIds(cardIds: string[]): Promise<ReservationRow[]> {
  if (!isSupabaseConfigured || !supabase || cardIds.length === 0) return [];
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .in("card_id", cardIds)
    .order("reservation_date", { ascending: true })
    .order("time_slot", { ascending: true });
  if (error) {
    console.warn("[reservationsService] fetchReservationsForCardIds", error.message);
    return [];
  }
  return (data as ReservationRow[]) ?? [];
}
