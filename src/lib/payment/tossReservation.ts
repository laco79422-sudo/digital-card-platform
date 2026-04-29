import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";

export type TossReservationPaymentParams = {
  clientKey: string;
  reservationId: string;
  bookingToken: string;
  amountKrw: number;
  orderName: string;
  successUrl: string;
  failUrl: string;
};

export async function requestTossReservationPayment(params: TossReservationPaymentParams): Promise<void> {
  const tossPayments = await loadTossPayments(params.clientKey.trim());
  const payment = tossPayments.payment({ customerKey: ANONYMOUS });

  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: params.amountKrw },
    orderId: `linko-resv-${params.reservationId}`,
    orderName: params.orderName.slice(0, 100),
    successUrl: params.successUrl,
    failUrl: params.failUrl,
  });
}

export function readTossClientKey(): string | null {
  const k = import.meta.env.VITE_TOSS_CLIENT_KEY?.trim();
  return k || null;
}
