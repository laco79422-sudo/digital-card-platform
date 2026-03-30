import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { getLinksForCard, useAppDataStore } from "@/stores/appDataStore";
import type { CardLink } from "@/types/domain";
import { ExternalLink, Mail, MessageCircle, Phone, Video } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const themeClass: Record<string, string> = {
  navy: "from-slate-950 via-brand-950 to-brand-900",
  slate: "from-slate-900 via-slate-800 to-slate-950",
  midnight: "from-black via-slate-950 to-slate-900",
};

function iconForType(t: CardLink["type"]) {
  switch (t) {
    case "youtube":
      return Video;
    case "blog":
    case "website":
    case "custom":
      return ExternalLink;
    case "kakao":
      return MessageCircle;
    case "email":
      return Mail;
    case "phone":
      return Phone;
    default:
      return ExternalLink;
  }
}

export function PublicCardPage() {
  const { slug } = useParams();
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardLinks = useAppDataStore((s) => s.cardLinks);
  const addCardView = useAppDataStore((s) => s.addCardView);
  const addCardClick = useAppDataStore((s) => s.addCardClick);

  const card = useMemo(
    () => businessCards.find((c) => c.slug === slug && c.is_public),
    [businessCards, slug],
  );
  const links = useMemo(
    () => (card ? getLinksForCard(card.id, cardLinks) : []),
    [card, cardLinks],
  );

  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!card) return;
    const url = `${window.location.origin}/c/${card.slug}`;
    QRCode.toDataURL(url, { margin: 1, width: 200, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [card]);

  useEffect(() => {
    if (!card) return;
    addCardView({
      id: crypto.randomUUID(),
      card_id: card.id,
      viewed_at: new Date().toISOString(),
      referrer: document.referrer || "direct",
      user_agent: navigator.userAgent,
    });
  }, [card, addCardView]);

  const handleLink = (link: CardLink) => {
    if (!card) return;
    addCardClick({
      id: crypto.randomUUID(),
      card_id: card.id,
      action_type: link.type,
      clicked_at: new Date().toISOString(),
    });
    let href = link.url;
    if (link.type === "email" && !href.startsWith("mailto:")) href = `mailto:${href}`;
    if (link.type === "phone" && !href.startsWith("tel:")) href = `tel:${href}`;
    if (href.startsWith("#")) return;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  if (!card) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5">
        <p className="text-xl font-semibold text-slate-900">명함을 찾을 수 없습니다</p>
        <p className="mt-2 max-w-sm text-center text-base leading-relaxed text-slate-600">
          슬러그를 확인하거나 홈으로 이동하세요.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-[52px] items-center justify-center text-base font-semibold text-brand-700"
        >
          홈으로
        </Link>
      </div>
    );
  }

  const grad = themeClass[card.theme] ?? themeClass.navy;

  return (
    <div className="min-h-dvh bg-slate-100">
      <div
        className={cn(
          `bg-gradient-to-br ${grad}`,
          "px-5 pb-14 pt-8 text-white sm:px-6 sm:pb-16 sm:pt-12 lg:px-8",
        )}
      >
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-white/10 text-xl font-bold backdrop-blur sm:h-20 sm:w-20 sm:text-2xl">
            {card.brand_name.slice(0, 2)}
          </div>
          <h1 className="mt-5 break-keep text-2xl font-bold leading-snug tracking-tight sm:mt-6 sm:text-3xl">
            {card.brand_name}
          </h1>
          <p className="mt-2 text-base text-white/95 sm:text-lg">{card.person_name}</p>
          <Badge tone="default" className="mt-3 border border-white/25 bg-white/10 text-sm text-white">
            {card.job_title}
          </Badge>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/92 sm:text-base">{card.intro}</p>
        </div>
      </div>

      <div className={cn(layout.pageCompact, "-mt-10")}>
        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-lg shadow-slate-900/10 sm:p-6">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            연결하기
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {links.map((link) => {
              const Icon = iconForType(link.type);
              return (
                <Button
                  key={link.id}
                  variant="secondary"
                  className="min-h-[52px] w-full justify-between border-slate-300 px-4 text-base text-slate-900"
                  onClick={() => handleLink(link)}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-brand-700" />
                    {link.label}
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" />
                </Button>
              );
            })}
          </div>

          {qr ? (
            <div className="mt-8 flex flex-col items-center border-t border-slate-200 pt-8">
              <p className="text-sm font-medium text-slate-600">명함 공유 QR</p>
              <img src={qr} alt="QR code" className="mt-3 h-40 w-40 rounded-xl border border-slate-100 bg-white p-2" />
            </div>
          ) : null}

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex min-h-10 items-center justify-center text-sm text-slate-500 hover:text-brand-700"
            >
              Powered by BizCard Connect
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
