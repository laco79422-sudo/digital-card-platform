import { Button } from "@/components/ui/Button";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { Check, Copy, Share2, X } from "lucide-react";
import { useCallback, useState } from "react";

type Props = {
  shareUrl: string;
  cardTitle: string;
  onDismiss: () => void;
};

export function CardEditorSaveCompletionPanel({ shareUrl, cardTitle, onDismiss }: Props) {
  const [copyDone, setCopyDone] = useState(false);
  const [kakaoHint, setKakaoHint] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2200);
    } catch {
      window.prompt("명함 링크를 복사해 주세요", shareUrl);
    }
  }, [shareUrl]);

  const kakaoShare = useCallback(async () => {
    const r = await shareCardLinkNativeOrder({
      shareUrl,
      title: cardTitle,
      shortMessage: "내 디지털 명함 페이지 링크예요.",
    });
    if (r === "clipboard") {
      setKakaoHint(true);
      window.setTimeout(() => setKakaoHint(false), 2800);
    }
  }, [cardTitle, shareUrl]);

  return (
    <div
      id="card-save-complete"
      className="scroll-mt-28 rounded-2xl border-2 border-emerald-400/70 bg-gradient-to-b from-emerald-50/95 via-white to-slate-50/90 p-5 shadow-[0_24px_50px_-24px_rgba(5,150,105,0.45)] sm:p-7"
      role="region"
      aria-label="명함 저장 완료"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <Check className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">명함 생성 완료</p>
            <p className="mt-1 text-sm font-medium text-emerald-900/90">
              지금 바로 고객에게 보내는 단계예요. 아래가 곧 당신의 공개 명함 주소입니다.
            </p>
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

      <p className="mt-6 text-sm font-bold text-slate-800">👉 당신의 명함 링크</p>
      <div className="mt-2 break-all rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-semibold leading-relaxed text-brand-900 shadow-inner sm:text-lg">
        {shareUrl}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        이 링크를 고객에게 보내면, <span className="font-semibold text-slate-800">당신의 명함 페이지</span>가 바로
        열립니다. 홈이 아니라 개인 명함 주소만 전달됩니다.
      </p>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Button type="button" variant="outline" className="min-h-12 w-full flex-1 gap-2" onClick={() => void copyLink()}>
          <Copy className="h-4 w-4 shrink-0" aria-hidden />
          {copyDone ? "복사됨!" : "링크 복사하기"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 w-full flex-1 gap-2 border-brand-200 bg-white"
          onClick={() => void kakaoShare()}
        >
          <Share2 className="h-4 w-4 shrink-0" aria-hidden />
          카카오톡으로 보내기
        </Button>
      </div>

      {kakaoHint ? (
        <p className="mt-4 text-center text-sm font-medium text-brand-800">
          링크를 복사했어요. 카카오톡 채팅에 붙여넣어 보내 보세요.
        </p>
      ) : null}
    </div>
  );
}
