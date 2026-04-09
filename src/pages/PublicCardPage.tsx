import { DigitalCardPublicView } from "@/components/digital-card/DigitalCardPublicView";
import { DigitalCardSeo } from "@/components/digital-card/DigitalCardSeo";
import { buildCardShareUrl } from "@/lib/cardShareUrl";
import { getLinksForCard, useAppDataStore } from "@/stores/appDataStore";
import type { CardLink } from "@/types/domain";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

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
    const url = buildCardShareUrl(window.location.origin, card.slug) ?? "";
    if (!url) return;
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
          주소가 맞는지 확인하거나 홈으로 돌아가 보세요.
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

  return (
    <>
      <DigitalCardSeo card={card} />
      <DigitalCardPublicView card={card} links={links} onLinkClick={handleLink} qrDataUrl={qr} />
    </>
  );
}
