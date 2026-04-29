import { Button } from "@/components/ui/Button";
import { downloadRemoteFile } from "@/lib/downloadRemoteFile";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { cn } from "@/lib/utils";
import { Check, Copy, Download, ImageIcon, Share2, X } from "lucide-react";
import { useCallback, useId, useState } from "react";

type Props = {
  shareUrl: string;
  promoShareText: string;
  cardTitle: string;
  qrImageUrl?: string | null;
  heroImageUrl?: string | null;
  slug?: string;
  onDismiss: () => void;
};

export function CardEditorSaveCompletionPanel({
  shareUrl,
  promoShareText,
  cardTitle,
  qrImageUrl,
  heroImageUrl,
  slug,
  onDismiss,
}: Props) {
  const baseId = useId();
  const [copyLinkDone, setCopyLinkDone] = useState(false);
  const [copyPromoDone, setCopyPromoDone] = useState(false);
  const [kakaoHint, setKakaoHint] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);

  const safeSlug = (slug ?? "명함").trim() || "card";

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyLinkDone(true);
      window.setTimeout(() => setCopyLinkDone(false), 2200);
    } catch {
      window.prompt("명함 링크를 복사해 주세요", shareUrl);
    }
  }, [shareUrl]);

  const copyPromo = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(promoShareText);
      setCopyPromoDone(true);
      window.setTimeout(() => setCopyPromoDone(false), 2200);
    } catch {
      window.prompt("홍보 문구를 복사해 주세요", promoShareText);
    }
  }, [promoShareText]);

  const shareNow = useCallback(async () => {
    const r = await shareCardLinkNativeOrder({
      shareUrl,
      title: cardTitle,
      shortMessage: promoShareText.slice(0, 300),
    });
    if (r === "clipboard") {
      setKakaoHint(true);
      window.setTimeout(() => setKakaoHint(false), 3200);
    }
  }, [cardTitle, promoShareText, shareUrl]);

  const saveCardImage = useCallback(async () => {
    setImageSaving(true);
    try {
      if (qrImageUrl?.trim()) {
        await downloadRemoteFile(qrImageUrl.trim(), `linko-card-qr-${safeSlug}.png`);
        return;
      }
      const hero = heroImageUrl?.trim();
      if (hero && /^https?:\/\//i.test(hero)) {
        const ext = /\.(jpe?g|png|webp|gif)$/i.exec(hero)?.[1]?.toLowerCase() ?? "jpg";
        await downloadRemoteFile(hero, `linko-card-image-${safeSlug}.${ext}`);
      }
    } finally {
      setImageSaving(false);
    }
  }, [heroImageUrl, qrImageUrl, safeSlug]);

  const hasDownloadableImage = Boolean(qrImageUrl?.trim()) || Boolean(heroImageUrl?.trim()?.match(/^https?:\/\//i));

  return (
    <div
      id="card-save-complete"
      className="scroll-mt-28 rounded-2xl border-2 border-emerald-400/70 bg-gradient-to-b from-emerald-50/95 via-white to-slate-50/90 p-5 shadow-[0_24px_50px_-24px_rgba(5,150,105,0.45)] sm:p-7"
      role="region"
      aria-labelledby={`${baseId}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <Check className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p id={`${baseId}-title`} className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
              명함이 완성되었습니다
            </p>
            <p className="mt-1 text-base font-semibold text-emerald-900 sm:text-lg">지금 공유하면 고객이 들어옵니다</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" aria-hidden />
          닫기
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Button type="button" variant="outline" className="min-h-12 w-full gap-2 sm:min-h-[52px]" onClick={() => void copyLink()}>
          <Copy className="h-4 w-4 shrink-0" aria-hidden />
          {copyLinkDone ? "복사됨!" : "내 명함 링크 복사"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 w-full gap-2 border-brand-200 bg-white sm:min-h-[52px]"
          disabled={!hasDownloadableImage || imageSaving}
          loading={imageSaving}
          title={!hasDownloadableImage ? "QR 또는 대표 이미지가 준비되면 저장할 수 있어요." : undefined}
          onClick={() => void saveCardImage()}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          명함 이미지 저장
        </Button>
      </div>

      {!hasDownloadableImage ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          QR 생성 또는 대표 이미지 업로드 후 다시 시도해 주세요.
        </p>
      ) : null}

      <div className="mt-8 border-t border-slate-200/90 pt-6">
        <p className="text-sm font-bold text-slate-900">자동 홍보 문구</p>
        <p className="mt-1 text-xs text-slate-500">업종에 맞춰 생성했습니다. 복사해 카카오·당근·문자에 붙여 넣으세요.</p>
        <div className="mt-3 whitespace-pre-wrap break-words rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-[15px] font-medium leading-relaxed text-slate-900 shadow-inner">
          {promoShareText}
        </div>
        <Button type="button" variant="outline" className="mt-3 min-h-11 w-full gap-2 sm:w-auto" onClick={() => void copyPromo()}>
          <Copy className="h-4 w-4 shrink-0" aria-hidden />
          {copyPromoDone ? "홍보 문구 복사됨!" : "홍보 문구 복사하기"}
        </Button>
      </div>

      <div id="share-flow-guide" className="mt-8 rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-4 text-left sm:px-5">
        <p className="text-sm font-bold text-emerald-950">공유 가이드</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-medium leading-relaxed text-slate-800">
          <li>
            <span className="font-bold text-slate-900">카카오톡에 공유</span> — 방·단톡에 링크 또는 아래 홍보 문구 붙여넣기
          </li>
          <li>
            <span className="font-bold text-slate-900">당근에 게시</span> — 동네 홍보 글에 명함 링크 넣기
          </li>
          <li>
            <span className="font-bold text-slate-900">고객에게 전송</span> — 문자·메신저로 링크만 보내도 명함으로 연결
          </li>
        </ol>
      </div>

      <Button
        type="button"
        onClick={() => void shareNow()}
        className={cn(
          "mt-6 min-h-[56px] w-full gap-2 border-0 text-base font-extrabold shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-400 focus-visible:ring-offset-2",
          "bg-gradient-to-r from-cta-500 to-cta-600 text-white shadow-cta-900/25 hover:from-cta-400 hover:to-cta-500",
        )}
      >
        <Share2 className="h-5 w-5 shrink-0" aria-hidden />
        지금 바로 공유하기
      </Button>

      <p className="mt-5 flex flex-wrap items-center gap-2 text-center text-sm font-medium text-emerald-900/90 sm:text-left">
        <Share2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
        지금 공유하면 바로 고객이 들어올 수 있습니다
      </p>

      {kakaoHint ? (
        <p className="mt-4 text-center text-sm font-medium text-brand-800">
          클립보드에 복사했어요. 카카오톡 채팅에 붙여넣어 보내 보세요.
        </p>
      ) : null}
    </div>
  );
}
