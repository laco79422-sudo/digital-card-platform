import { DigitalCardPublicView } from "@/components/digital-card/DigitalCardPublicView";
import { DigitalCardSeo } from "@/components/digital-card/DigitalCardSeo";
import { INSTANT_GUEST_USER_ID } from "@/lib/instantCardCreate";
import { loadTempCard } from "@/lib/tempCardStorage";
import { syncTempPreviewRemote } from "@/lib/syncTempPreviewRemote";
import { normalizePreviewCardType } from "@/lib/previewCardType";
import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";
import { draftToBusinessCard, mergeDraftDefaults } from "@/stores/cardEditorDraftStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { CardLink } from "@/types/domain";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

function rowsToCardLinks(
  cardId: string,
  draft: CardEditorDraft,
  rows: { id: string; label: string; type: CardLink["type"]; url: string }[],
): CardLink[] {
  const filtered = rows.filter((r) => r.label.trim() && r.url.trim());
  if (filtered.length > 0) {
    return filtered.map((r, i) => ({
      id: r.id,
      card_id: cardId,
      label: r.label,
      type: r.type,
      url: r.url,
      sort_order: i,
    }));
  }
  return [
    {
      id: crypto.randomUUID(),
      card_id: cardId,
      label: "웹사이트",
      type: "website",
      url: draft.website_url.trim() || "https://example.com",
      sort_order: 0,
    },
  ];
}

export function TempCardPreviewPage() {
  const { tempId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const addCardView = useAppDataStore((s) => s.addCardView);
  const addCardClick = useAppDataStore((s) => s.addCardClick);

  const payload = useMemo(() => (tempId ? loadTempCard(tempId) : null), [tempId]);

  const { card, links } = useMemo(() => {
    if (!payload?.draft || !tempId) {
      return { card: null as ReturnType<typeof draftToBusinessCard> | null, links: [] as CardLink[] };
    }
    const requestedTypeRaw = searchParams.get("type");
    const requestedType = requestedTypeRaw ? normalizePreviewCardType(requestedTypeRaw) : undefined;
    const d = mergeDraftDefaults({ ...payload.draft, card_type: requestedType ?? payload.draft.card_type });
    const c = draftToBusinessCard(d, {
      id: tempId,
      user_id: INSTANT_GUEST_USER_ID,
      created_at: payload.updatedAt ?? new Date().toISOString(),
    });
    const ls = rowsToCardLinks(tempId, d, payload.linkRows ?? []);
    return { card: c, links: ls };
  }, [payload, searchParams, tempId]);

  const [qr, setQr] = useState<string | null>(null);
  const absoluteUrl = useMemo(() => {
    if (typeof window === "undefined" || !tempId) return "";
    const requestedTypeRaw = searchParams.get("type");
    const type = requestedTypeRaw
      ? normalizePreviewCardType(requestedTypeRaw)
      : payload?.draft?.card_type
        ? normalizePreviewCardType(payload.draft.card_type)
        : "person";
    return `${window.location.origin}/preview/${encodeURIComponent(tempId)}?type=${encodeURIComponent(type)}`;
  }, [payload?.draft?.card_type, searchParams, tempId]);

  useEffect(() => {
    if (!absoluteUrl) return;
    QRCode.toDataURL(absoluteUrl, { margin: 1, width: 200, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [absoluteUrl]);

  const onBeforeKakaoShare = useCallback(async () => {
    if (!tempId) return;
    const p = loadTempCard(tempId);
    if (p?.draft) {
      await syncTempPreviewRemote({
        tempId,
        draft: p.draft,
        linkRows: p.linkRows ?? [],
        shareUrl: absoluteUrl || undefined,
        state: "preview",
      });
    }
  }, [absoluteUrl, tempId]);

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

  if (!tempId || !card) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5">
        <p className="text-xl font-semibold text-slate-900">임시 명함을 찾을 수 없습니다</p>
        <p className="mt-2 max-w-sm text-center text-base leading-relaxed text-slate-600">
          이 브라우저에서 만든 미리보기만 열 수 있거나, 링크가 만료되었을 수 있어요.
        </p>
        <Link
          to="/create-card"
          className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-xl bg-cta-500 px-6 text-base font-bold text-white shadow-md shadow-cta-900/20 hover:bg-cta-600"
        >
          명함 만들기
        </Link>
      </div>
    );
  }

  return (
    <>
      <DigitalCardSeo card={card} />
      <div className="border-b border-amber-200/90 bg-amber-50 px-4 py-3 text-center sm:px-6">
        <p className="text-sm font-semibold text-amber-950">이 링크는 임시 미리보기 링크입니다.</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-900/90 sm:text-sm">
          마음에 들면 회원가입 후 내 명함으로 저장할 수 있습니다.
        </p>
      </div>
      <DigitalCardPublicView
        card={card}
        links={links}
        onLinkClick={handleLink}
        qrDataUrl={qr}
        shareUrlOverride={absoluteUrl}
        tempPreview
        previewVariant={
          searchParams.get("type")
            ? normalizePreviewCardType(searchParams.get("type"))
            : normalizePreviewCardType(payload?.draft?.card_type)
        }
        onBeforeKakaoShare={onBeforeKakaoShare}
      />
    </>
  );
}
