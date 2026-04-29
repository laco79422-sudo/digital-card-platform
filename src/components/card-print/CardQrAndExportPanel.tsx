import { buildQrDestinationUrl } from "@/lib/cardQrDestination";
import { CARD_DESIGN_LABEL, normalizeCardDesignType } from "@/lib/cardDesignLabels";
import { cn } from "@/lib/utils";
import type { BusinessCard, CardDesignType } from "@/types/domain";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TEMPLATE_FACE: Record<CardDesignType, string> = {
  simple: "border border-slate-200 bg-white text-slate-900 shadow-sm",
  business: "border border-slate-800 bg-gradient-to-b from-slate-800 to-slate-950 text-white shadow-md",
  emotional:
    "border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-rose-50 text-violet-950 shadow-sm",
};

function PrintableFace({
  design,
  personLine,
  jobLine,
  introLine,
  qrSrc,
}: {
  design: CardDesignType;
  personLine: string;
  jobLine: string;
  introLine: string;
  qrSrc: string | null;
}) {
  const jobMuted = design === "business" ? "text-slate-300" : "text-slate-600";
  const introMuted = design === "business" ? "text-slate-200" : "text-slate-600";
  return (
    <div
      className={cn(
        "card-print-sheet flex h-full w-full flex-col overflow-hidden rounded-xl",
        TEMPLATE_FACE[design],
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-4">
        <p className="text-[17px] font-bold leading-tight tracking-tight">{personLine}</p>
        {jobLine ? <p className={cn("mt-1 text-[12px] font-semibold", jobMuted)}>{jobLine}</p> : null}
        {introLine ? (
          <p className={cn("mt-2 line-clamp-5 text-[11px] leading-snug", introMuted)}>{introLine}</p>
        ) : null}
      </div>
      <div
        className={cn(
          "flex shrink-0 justify-center pb-3 pt-2",
          design === "business" ? "border-t border-white/10 bg-black/20" : "border-t border-black/5 bg-white/40",
        )}
      >
        {qrSrc ? (
          <img
            src={qrSrc}
            alt=""
            width={96}
            height={96}
            className="h-[96px] w-[96px] shrink-0 rounded-md bg-white p-1"
          />
        ) : (
          <div className="h-[96px] w-[96px] animate-pulse rounded-md bg-slate-200/80" />
        )}
      </div>
    </div>
  );
}

/** 명함 상세·내 공간: QR 표시, PNG/PDF 저장, 인쇄용 레이아웃 */
export function CardQrAndExportPanel({ card }: { card: BusinessCard }) {
  const slug = card.slug?.trim() ?? "";
  const design = normalizeCardDesignType(card.design_type);
  const printRef = useRef<HTMLDivElement>(null);
  const [displayQr, setDisplayQr] = useState<string | null>(card.qr_image_url?.trim() || null);
  const [largeOpen, setLargeOpen] = useState(false);
  const [pdfCopies, setPdfCopies] = useState<1 | 10>(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stored = card.qr_image_url?.trim();
    if (stored) {
      setDisplayQr(stored);
      return;
    }
    if (!slug) return;
    void (async () => {
      const dataUrl = await QRCode.toDataURL(buildQrDestinationUrl(slug), {
        margin: 1,
        width: 280,
        errorCorrectionLevel: "M",
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      if (!cancelled) setDisplayQr(dataUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [card.qr_image_url, slug]);

  const personLine = useMemo(
    () => card.person_name.trim() || card.brand_name.trim() || "이름",
    [card.person_name, card.brand_name],
  );
  const jobLine = card.job_title.trim();
  const introLine = card.intro.trim();

  const capturePrintFace = useCallback(async (): Promise<string | null> => {
    const el = printRef.current;
    if (!el) return null;
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    return canvas.toDataURL("image/png");
  }, []);

  const downloadCardPng = useCallback(async () => {
    if (!slug || busy) return;
    setBusy(true);
    try {
      const dataUrl = await capturePrintFace();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `linko-card-${slug}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }, [slug, busy, capturePrintFace]);

  const downloadPdf = useCallback(async () => {
    if (!slug || busy) return;
    setBusy(true);
    try {
      const dataUrl = await capturePrintFace();
      if (!dataUrl) return;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const w = 90;
      const h = 50;
      const marginX = (210 - w) / 2;
      let y = 12;
      const copies = pdfCopies;
      for (let i = 0; i < copies; i++) {
        if (i > 0 && y + h > 287) {
          pdf.addPage();
          y = 12;
        }
        pdf.addImage(dataUrl, "PNG", marginX, y, w, h);
        y += h + 6;
      }
      pdf.save(`linko-card-${slug}.pdf`);
    } finally {
      setBusy(false);
    }
  }, [slug, busy, capturePrintFace, pdfCopies]);

  const downloadQrOnly = useCallback(() => {
    if (!displayQr || !slug) return;
    const a = document.createElement("a");
    a.href = displayQr;
    a.download = `linko-qr-${slug}.png`;
    a.click();
  }, [displayQr, slug]);

  if (!slug) return null;

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6">
        <h3 className="text-base font-bold text-slate-900">QR · 인쇄용 명함</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          템플릿: <span className="font-semibold text-slate-800">{CARD_DESIGN_LABEL[design]}</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          이 QR코드를 명함, 스티커, 테이블 등에 인쇄하면 고객이 스캔만으로 바로 연결됩니다.
        </p>

        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            {displayQr ? (
              <img src={displayQr} alt="" className="h-36 w-36 object-contain" width={144} height={144} />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center text-xs text-slate-500">생성 중…</div>
            )}
          </div>
          <div className="flex w-full max-w-sm flex-col gap-2">
            <button
              type="button"
              disabled={!displayQr || busy}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              onClick={() => downloadQrOnly()}
            >
              QR 다운로드
            </button>
            <button
              type="button"
              disabled={!displayQr}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setLargeOpen(true)}
            >
              QR 크게 보기
            </button>
            <button
              type="button"
              disabled={busy}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white hover:bg-cta-600 disabled:opacity-50"
              onClick={() => void downloadCardPng()}
            >
              명함 이미지 다운로드
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold text-slate-600" htmlFor={`pdf-copies-${card.id}`}>
                PDF 매수
              </label>
              <select
                id={`pdf-copies-${card.id}`}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900"
                value={pdfCopies}
                onChange={(e) => setPdfCopies(Number(e.target.value) === 10 ? 10 : 1)}
              >
                <option value={1}>1장</option>
                <option value={10}>10장</option>
              </select>
              <button
                type="button"
                disabled={busy}
                className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => void downloadPdf()}
              >
                명함 PDF 저장
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-600">
          NFC 카드에도 내 명함 링크와 동일한 주소를 저장하면 폰을 대기만 해도 연결됩니다.
        </p>
      </section>

      <div className="pointer-events-none fixed top-0 -left-[9000px] z-0 opacity-100">
        <div ref={printRef} className="overflow-hidden rounded-xl" style={{ width: 340, height: 189 }}>
          <PrintableFace
            design={design}
            personLine={personLine}
            jobLine={jobLine}
            introLine={introLine}
            qrSrc={displayQr}
          />
        </div>
      </div>

      {largeOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-center text-sm font-semibold text-slate-900">QR 코드</p>
            <div className="mt-4 flex justify-center">
              {displayQr ? <img src={displayQr} alt="" className="h-64 w-64 object-contain" /> : null}
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-800"
              onClick={() => setLargeOpen(false)}
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
