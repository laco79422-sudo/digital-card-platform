import { DigitalCardPublicView } from "@/components/digital-card/DigitalCardPublicView";
import { DigitalCardSeo } from "@/components/digital-card/DigitalCardSeo";
import { resolveBusinessCardPublicUrl } from "@/lib/cardShareUrl";
import { saveLinkoReferralCodeFromUrl } from "@/lib/linkoReferralStorage";
import { savePromotionReferralCode } from "@/lib/promotionReferralStorage";
import { insertCardVisitLog } from "@/services/cardVisitLogsService";
import { insertCardViewRemote } from "@/services/cardViewsRemote";
import { fetchCardBySlug, updateCardNameRemote } from "@/services/cardsService";
import { decodeRouteSlugParam, slugEqualsStored } from "@/lib/publicCardSlug";
import { getLinksForCard, useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { BusinessCard, CardLink, User } from "@/types/domain";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";

export function PublicCardPage() {
  const { slug } = useParams();
  const decodedSlug = useMemo(() => decodeRouteSlugParam(slug), [slug]);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardLinks = useAppDataStore((s) => s.cardLinks);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const addCardView = useAppDataStore((s) => s.addCardView);
  const addCardClick = useAppDataStore((s) => s.addCardClick);
  const addCardLinkVisit = useAppDataStore((s) => s.addCardLinkVisit);

  const fetchGenRef = useRef(0);

  const [slugResolveBusy, setSlugResolveBusy] = useState(() => Boolean(slug?.trim()));

  const card = useMemo(
    () =>
      businessCards.find((c) => slugEqualsStored(c.slug, decodedSlug) && c.is_public),
    [businessCards, decodedSlug],
  );

  useEffect(() => {
    const gen = ++fetchGenRef.current;

    if (!decodedSlug.trim()) {
      setSlugResolveBusy(false);
      return;
    }

    if (
      useAppDataStore.getState().businessCards.some((c) => slugEqualsStored(c.slug, decodedSlug) && c.is_public)
    ) {
      setSlugResolveBusy(false);
      return;
    }

    setSlugResolveBusy(true);

    void (async () => {
      const result = await fetchCardBySlug(decodedSlug);
      if (gen !== fetchGenRef.current) return;
      if (result.card) {
        upsertBusinessCard(result.card);
      } else {
        console.error("[PublicCardPage] 명함을 찾을 수 없음 — slug 조회 실패", {
          rawSlugFromRouter: slug,
          decodedSlug,
          sourceTable: result.sourceTable,
          errorMessage: result.errorMessage,
        });
      }
      setSlugResolveBusy(false);
    })();
  }, [decodedSlug, slug, upsertBusinessCard]);
  const links = useMemo(
    () => (card ? getLinksForCard(card.id, cardLinks) : []),
    [card, cardLinks],
  );
  const referralCode = useMemo(
    () => new URLSearchParams(location.search).get("ref")?.trim().toUpperCase() ?? "",
    [location.search],
  );
  const viewSource = useMemo(() => {
    const s = new URLSearchParams(location.search).get("source")?.trim().toLowerCase() ?? "";
    return s === "nfc" ? "nfc" : null;
  }, [location.search]);
  const [qr, setQr] = useState<string | null>(null);

  const canEditName = Boolean(card && cardBelongsToUser(card, user));

  const saveCardName = async (name: string) => {
    if (!card || !canEditName) return;
    const nextName = name.trim() || "이름을 입력하세요";
    upsertBusinessCard({ ...card, person_name: nextName, name: nextName });
    await updateCardNameRemote(card.id, nextName);
  };

  useEffect(() => {
    if (!card) return;
    const qrUrl = resolveBusinessCardPublicUrl(card, window.location.origin) ?? "";
    console.log("[QR URL]", qrUrl);
    console.log("[CARD SLUG]", card.slug);
    console.log("[CARD PUBLIC URL]", card.publicUrl);
    if (!qrUrl) return;
    QRCode.toDataURL(qrUrl, { margin: 1, width: 200, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [card]);

  useEffect(() => {
    if (!card?.user_id || !card.slug?.trim()) return;
    const refRaw = new URLSearchParams(window.location.search).get("ref")?.trim() ?? "";
    const refNorm = refRaw.toUpperCase();
    const source: "direct" | "promotion" = refNorm ? "promotion" : "direct";
    const slugKey = card.slug.trim();
    const storageKey = `visitLogged:${slugKey}:${refNorm || "direct"}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore storage failures */
    }
    void insertCardVisitLog({
      card_id: card.id,
      card_slug: slugKey,
      owner_user_id: card.user_id,
      promoter_code: refNorm || null,
      source,
      visitor_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  }, [card?.id, card?.slug, card?.user_id, location.search]);

  useEffect(() => {
    if (!card) return;
    addCardView({
      id: crypto.randomUUID(),
      card_id: card.id,
      viewed_at: new Date().toISOString(),
      referrer: document.referrer || "direct",
      user_agent: navigator.userAgent,
      promoter_code: referralCode || null,
      source: viewSource,
    });
    void insertCardViewRemote({
      card_id: card.id,
      referrer: document.referrer || "direct",
      user_agent: navigator.userAgent,
      promoter_code: referralCode || null,
      source: viewSource,
    });
    if (referralCode) {
      savePromotionReferralCode(referralCode);
      addCardLinkVisit({
        id: crypto.randomUUID(),
        card_id: card.id,
        slug: card.slug,
        ref_code: referralCode,
        visited_at: new Date().toISOString(),
        page_path: `${location.pathname}${location.search}`,
        user_agent: navigator.userAgent,
      });
    }
  }, [
    card,
    addCardView,
    addCardLinkVisit,
    location.pathname,
    location.search,
    referralCode,
    viewSource,
  ]);

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

  if (slugResolveBusy) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5">
        <p className="text-base font-medium text-slate-600">명함을 불러오고 있습니다.</p>
      </div>
    );
  }

  if (!card) {
    /** 추천 전용은 `/?ref=` — 잘못 `/c/{slug}?ref=` 로 들어온 경우 메인으로 넘김 */
    const refFromQuery = new URLSearchParams(location.search).get("ref")?.trim();
    if (refFromQuery) {
      saveLinkoReferralCodeFromUrl(refFromQuery);
      return <Navigate to={`/?ref=${encodeURIComponent(refFromQuery)}`} replace />;
    }
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
      <DigitalCardPublicView
        card={card}
        links={links}
        onLinkClick={handleLink}
        qrDataUrl={qr}
        referralLanding={Boolean(referralCode)}
        editableName={canEditName}
        namePlaceholder="이름을 입력하세요"
        onNameChange={(name) => void saveCardName(name)}
      />
    </>
  );
}

function cardBelongsToUser(card: BusinessCard, user: User | null): boolean {
  if (!user) return false;
  const email = user.email.trim().toLowerCase();
  return (
    card.user_id === user.id ||
    card.owner_id === user.id ||
    Boolean(email && (card.owner_email?.trim().toLowerCase() === email || card.email?.trim().toLowerCase() === email))
  );
}
