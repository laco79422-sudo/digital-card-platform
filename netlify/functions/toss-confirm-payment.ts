import { createClient } from "@supabase/supabase-js";

type ConfirmBody = {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
  reservationId?: string;
  bookingToken?: string;
};

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

type NetlifyHandlerEvent = {
  httpMethod: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
};

type NetlifyHandlerResult = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

export async function handler(event: NetlifyHandlerEvent): Promise<NetlifyHandlerResult> {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const secret = process.env.TOSS_SECRET_KEY?.trim();
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secret || !supabaseUrl || !serviceKey) {
    return json({ ok: false, error: "Server misconfigured (env)" }, 500);
  }

  let body: ConfirmBody;
  try {
    body = JSON.parse(event.body ?? "{}") as ConfirmBody;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const paymentKey = body.paymentKey?.trim();
  const orderId = body.orderId?.trim();
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  const reservationId = body.reservationId?.trim();
  const bookingToken = body.bookingToken?.trim();

  if (!paymentKey || !orderId || !Number.isFinite(amount) || amount < 0 || !reservationId || !bookingToken) {
    return json({ ok: false, error: "Missing fields" }, 400);
  }

  const tossHeaders = {
    Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
    "Content-Type": "application/json",
  };

  const tossRes = await fetch(TOSS_CONFIRM_URL, {
    method: "POST",
    headers: tossHeaders,
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  if (!tossRes.ok) {
    const errText = await tossRes.text();
    return json({ ok: false, error: `Toss confirm failed: ${errText}` }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const bookingUuid = normalizeUuid(bookingToken);
  if (!bookingUuid) {
    return json({ ok: false, error: "Invalid booking token" }, 400);
  }

  const { data: paymentId, error: rpcError } = await supabase.rpc("service_finalize_reservation_toss_payment", {
    p_reservation_id: reservationId,
    p_booking_token: bookingUuid,
    p_amount: Math.floor(amount),
    p_order_id: orderId,
    p_payment_key: paymentKey,
  });

  if (rpcError) {
    return json({ ok: false, error: rpcError.message }, 400);
  }

  return json({ ok: true, paymentId }, 200);
}

function normalizeUuid(token: string): string | null {
  const t = token.trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)) {
    return t;
  }
  return null;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(payload: unknown, status: number): NetlifyHandlerResult {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
    body: JSON.stringify(payload),
  };
}
