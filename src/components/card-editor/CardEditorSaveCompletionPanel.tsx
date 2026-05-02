import { Button } from "@/components/ui/Button";
import { downloadRemoteFile } from "@/lib/downloadRemoteFile";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Camera,
  Carrot,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  LayoutDashboard,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { useCallback, useId, useState } from "react";
import { Link } from "react-router-dom";

type Props = {
  shareUrl: string;
  promoShareText: string;
  /** 블로그·유튜브 설명란용 (링크 포함) */
  blogShareSnippet: string;
  cardTitle: string;
  qrImageUrl?: string | null;
  heroImageUrl?: string | null;
  slug?: string;
  /** 3초 명함 만들기 직후 저장 분기 */
  quickDraft?: boolean;
  onDismiss: () => void;
};

export function CardEditorSaveCompletionPanel({
  shareUrl,
  promoShareText,
  blogShareSnippet,
  cardTitle,
  qrImageUrl,
  heroImageUrl,
  slug,
  quickDraft,
  onDismiss,
}: Props) {
  const baseId = useId();
  const [copyDetailLinkDone, setCopyDetailLinkDone] = useState(false);
  const [copyBlogDone, setCopyBlogDone] = useState(false);
  const [kakaoBusy, setKakaoBusy] = useState(false);
  const [kakaoClipboardHint, setKakaoClipboardHint] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [daangnOpen, setDaangnOpen] = useState(false);
  const [kakaoOgOpen, setKakaoOgOpen] = useState(true);

  const safeSlug = (slug ?? "명함").trim() || "card";

  const copyDetailLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyDetailLinkDone(true);
      window.setTimeout(() => setCopyDetailLinkDone(false), 2200);
    } catch {
      window.prompt("상세 링크를 복사해 주세요", shareUrl);
    }
  }, [shareUrl]);

  const copyBlogSnippet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(blogShareSnippet);
      setCopyBlogDone(true);
      window.setTimeout(() => setCopyBlogDone(false), 2200);
    } catch {
      window.prompt("문구를 복사해 주세요", blogShareSnippet);
    }
  }, [blogShareSnippet]);

  const nativeShareDetail = useCallback(async () => {
    setKakaoBusy(true);
    try {
      const r = await shareCardLinkNativeOrder({
        shareUrl,
        title: cardTitle,
        shortMessage: promoShareText.slice(0, 280),
      });
      if (r === "clipboard") {
        setKakaoClipboardHint(true);
        window.setTimeout(() => setKakaoClipboardHint(false), 5200);
      }
    } finally {
      setKakaoBusy(false);
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
            {quickDraft ? (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-sm font-semibold leading-relaxed text-emerald-950">
                명함 초안이 완성되었습니다. 필요한 부분만 수정하고 아래부터 공유해 보세요.
              </p>
            ) : null}
            <p className="mt-2 max-w-xl text-[15px] font-medium leading-relaxed text-slate-700">
              이미지는 한눈에 보여주고, 링크는 자세한 설명으로 이어집니다.
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

      <div className="mt-8 space-y-3 rounded-2xl border border-emerald-200/80 bg-white/90 p-4 sm:p-5">
        <p className="text-sm font-extrabold text-emerald-950">① 이미지형 명함</p>
        <p className="text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
          대표 이미지·카드 디자인이 보이면 그대로 저장해 두면 카톡·당근 등에 바로 넣기 좋습니다.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 w-full gap-2"
          disabled={!hasDownloadableImage || imageSaving}
          loading={imageSaving}
          title={!hasDownloadableImage ? "QR 또는 대표 이미지가 준비되면 저장할 수 있어요." : undefined}
          onClick={() => void saveCardImage()}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          이미지 저장하기
        </Button>
        {!hasDownloadableImage ? (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
            <ImageIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            QR 생성 또는 대표 이미지 업로드 후 다시 시도해 주세요.
          </p>
        ) : null}
      </div>

      <div className="mt-5 space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5">
        <p className="text-sm font-extrabold text-slate-900">② 상세 링크</p>
        <p className="text-xs font-medium text-slate-600 sm:text-sm">고객이 눌렀을 때 경력·서비스·연락처가 한 페이지로 열립니다.</p>
        <div className="break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-brand-900">
          {shareUrl}
        </div>
        <Button type="button" variant="outline" className="min-h-12 w-full gap-2" onClick={() => void copyDetailLink()}>
          <Copy className="h-4 w-4 shrink-0" aria-hidden />
          {copyDetailLinkDone ? "복사됨!" : "상세 링크 복사하기"}
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-200/70 bg-brand-50/50 p-4 sm:p-5">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          onClick={() => setKakaoOgOpen((o) => !o)}
          aria-expanded={kakaoOgOpen}
        >
          <span className="flex items-center gap-2 text-sm font-extrabold text-brand-950">
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            카카오톡으로 보내기 &amp; 미리보기 팁
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition", kakaoOgOpen ? "rotate-180" : "")} aria-hidden />
        </button>
        {kakaoOgOpen ? (
          <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-800">
            <p className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-slate-700">
              <span className="font-bold text-slate-900">이미지를 먼저 보내면</span> 한눈에 보이고,&nbsp;
              <span className="font-bold text-slate-900">링크를 함께 보내면</span> 자세한 내용을 확인할 수 있습니다.
            </p>
            <p className="font-bold text-brand-950">링크 미리보기(OG 이미지)가 불안정할 때</p>
            <ol className="list-decimal space-y-1.5 pl-5 text-slate-800">
              <li>위에서 이미지 명함 저장</li>
              <li>상세 링크 복사</li>
              <li>카카오톡에 이미지 먼저 전송</li>
              <li>이어서 상세 링크 전송</li>
            </ol>
            <Button
              type="button"
              className={cn(
                "min-h-[52px] w-full gap-2 border-0 font-extrabold shadow-lg",
                "bg-gradient-to-r from-cta-500 to-cta-600 text-white hover:from-cta-400 hover:to-cta-500",
              )}
              onClick={() => void nativeShareDetail()}
              disabled={kakaoBusy}
              loading={kakaoBusy}
            >
              <Share2 className="h-5 w-5 shrink-0" aria-hidden />
              카카오톡으로 보내기
            </Button>
          </div>
        ) : null}
        {kakaoClipboardHint ? (
          <p className="mt-3 rounded-lg bg-white/70 px-2 py-2 text-center text-sm font-semibold text-brand-900">
            클립보드에 준비했습니다. 카톡에 붙여넣은 뒤, 위 순서대로 이미지·링크를 나누어 보내 보세요.
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-orange-200/80 bg-orange-50/50 p-4 sm:p-5">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left text-sm font-extrabold text-orange-950"
          onClick={() => setDaangnOpen((o) => !o)}
          aria-expanded={daangnOpen}
        >
          <span className="inline-flex items-center gap-2">
            <Carrot className="h-4 w-4 shrink-0" aria-hidden />
            당근에 올리는 방법 보기
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition", daangnOpen ? "rotate-180" : "")} aria-hidden />
        </button>
        {daangnOpen ? (
          <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-orange-950/95">
            <p className="rounded-xl border border-white/60 bg-white/70 px-3 py-2">
              당근에서는 이미지가 먼저 보이는 것이 중요합니다.
              이미지 명함을 저장한 뒤 게시글에 올리고, 상세 링크를 본문에 붙여 주세요.
            </p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>이미지 명함 저장</li>
              <li>당근 게시글에 이미지 첨부</li>
              <li>본문에 상세 링크 붙여넣기</li>
            </ol>
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <BookOpen className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
          블로그·유튜브에 넣을 문구 복사
        </p>
        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">
          아래 소개 문구와 링크를 복사해 블로그 글이나 유튜브 설명란에 넣어 주세요.
        </p>
        <pre className="mt-3 max-h-40 whitespace-pre-wrap break-words overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-sans text-sm leading-relaxed text-slate-900">
          {blogShareSnippet}
        </pre>
        <Button type="button" variant="outline" className="mt-3 min-h-11 w-full gap-2" onClick={() => void copyBlogSnippet()}>
          <Camera className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          {copyBlogDone ? "복사됨!" : "블로그/유튜브 문구 복사"}
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          to={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50",
          )}
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          상세 페이지 열기
        </Link>
        <Link
          to="/dashboard"
          className={cn(
            "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50",
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
          내 공간에서 성과 보기
        </Link>
      </div>
    </div>
  );
}
