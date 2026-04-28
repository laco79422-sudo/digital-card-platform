import { getCardHeroImageUrl } from "@/lib/businessCardHeroImage";
import { fetchCardByIdForNfc, insertNfcAcceptLog, isUuid } from "@/services/nfcAcceptService";
import { useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard } from "@/types/domain";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

type GateState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "not_public" }
  | { kind: "ready"; card: BusinessCard }
  | { kind: "declined" };

function previewImage(card: BusinessCard): string {
  return getCardHeroImageUrl(card);
}

function previewOrgLine(card: BusinessCard): string {
  const brand = card.brand_name?.trim() ?? "";
  const intro = card.intro?.trim() ?? "";
  if (brand) return brand;
  if (intro.length > 80) return `${intro.slice(0, 77)}…`;
  return intro;
}

export function NfcAcceptPage() {
  const { cardId = "" } = useParams();
  const navigate = useNavigate();
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const [gate, setGate] = useState<GateState>({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = cardId.trim();
      if (!raw || !isUuid(raw)) {
        setGate({ kind: "not_found" });
        return;
      }
      const card = await fetchCardByIdForNfc(raw);
      if (cancelled) return;
      if (!card) {
        setGate({ kind: "not_found" });
        return;
      }
      if (!card.is_public) {
        setGate({ kind: "not_public" });
        return;
      }
      setGate({ kind: "ready", card });
    })();
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  const onAccept = useCallback(async () => {
    if (gate.kind !== "ready") return;
    const slug = gate.card.slug?.trim();
    if (!slug) return;
    setBusy(true);
    await insertNfcAcceptLog({
      card_id: gate.card.id,
      status: "accepted",
      source: "nfc",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    upsertBusinessCard(gate.card);
    navigate(`/c/${encodeURIComponent(slug)}?source=nfc`, { replace: true });
  }, [gate, navigate, upsertBusinessCard]);

  const onLater = useCallback(async () => {
    if (gate.kind !== "ready") return;
    setBusy(true);
    await insertNfcAcceptLog({
      card_id: gate.card.id,
      status: "declined",
      source: "nfc",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    setGate({ kind: "declined" });
    setBusy(false);
  }, [gate]);

  if (gate.kind === "loading") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5">
        <p className="text-base font-medium text-slate-600">불러오는 중…</p>
      </div>
    );
  }

  if (gate.kind === "not_found") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5">
        <p className="text-xl font-semibold text-slate-900">명함을 찾을 수 없습니다.</p>
        <Link to="/" className="mt-8 font-semibold text-brand-700">
          홈으로
        </Link>
      </div>
    );
  }

  if (gate.kind === "not_public") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5">
        <p className="text-xl font-semibold text-slate-900">현재 공개되지 않은 명함입니다.</p>
        <Link to="/" className="mt-8 font-semibold text-brand-700">
          홈으로
        </Link>
      </div>
    );
  }

  if (gate.kind === "declined") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5">
        <p className="text-xl font-semibold text-slate-900">명함 받기를 취소했습니다.</p>
        <Link to="/" className="mt-8 font-semibold text-brand-700">
          홈으로
        </Link>
      </div>
    );
  }

  const card = gate.card;
  const img = previewImage(card);
  const orgLine = previewOrgLine(card);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 to-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
          <h1 className="text-center text-xl font-bold tracking-tight text-slate-900">명함을 받아보시겠습니까?</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
            상대방이 공유한 린코 디지털 명함입니다.
            <br />
            수락하면 명함 정보를 확인할 수 있어요.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="h-28 w-28 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200">
              {img ? (
                <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-slate-500">
                  이미지 없음
                </div>
              )}
            </div>
            <div className="w-full text-center">
              <p className="text-lg font-bold text-slate-900">{card.person_name.trim() || "이름 없음"}</p>
              {card.job_title.trim() ? (
                <p className="mt-1 text-sm font-semibold text-slate-700">{card.job_title.trim()}</p>
              ) : null}
              {orgLine ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{orgLine}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            <button
              type="button"
              disabled={busy}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-cta-500 px-4 text-base font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600 disabled:opacity-60"
              onClick={() => void onAccept()}
            >
              명함 받아보기
            </button>
            <button
              type="button"
              disabled={busy}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-base font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
              onClick={() => void onLater()}
            >
              나중에 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
