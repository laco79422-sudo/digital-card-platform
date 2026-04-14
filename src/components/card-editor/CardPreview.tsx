import { DigitalCardPublicView } from "@/components/digital-card/DigitalCardPublicView";
import { draftToPreviewBusinessCard } from "@/stores/cardEditorDraftStore";
import { useCardEditorDraftStore } from "@/stores/cardEditorDraftStore";
import { useAuthStore } from "@/stores/authStore";
import type { CardLink, CardLinkType } from "@/types/domain";

export type CardPreviewLinkRow = { id: string; label: string; type: CardLinkType; url: string };

function navigatePreviewLink(url: string) {
  const t = url.trim();
  if (t.startsWith("tel:") || t.startsWith("mailto:")) {
    window.location.href = t;
    return;
  }
  if (t.startsWith("#")) {
    document.querySelector(t)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (t.startsWith("/") && !t.startsWith("//")) {
    window.location.assign(t);
    return;
  }
  window.open(t, "_blank", "noopener,noreferrer");
}

type Props = {
  linkRows: CardPreviewLinkRow[];
  existingCardId?: string;
  createdAt?: string;
  /** 게스트 체험 — 임시 미리보기 안내 띠 */
  guestTempHint?: boolean;
};

export function CardPreview({ linkRows, existingCardId, createdAt, guestTempHint }: Props) {
  const draft = useCardEditorDraftStore((s) => s.draft);
  const user = useAuthStore((s) => s.user);

  const card = draftToPreviewBusinessCard(draft, {
    userId: user?.id ?? "preview",
    cardId: existingCardId,
    createdAt,
  });

  const previewLinks: CardLink[] = linkRows
    .filter((r) => r.label.trim() && r.url.trim())
    .map((r, i) => ({
      id: r.id,
      card_id: "preview",
      label: r.label,
      type: r.type,
      url: r.url,
      sort_order: i,
    }));

  return (
    <>
      {guestTempHint ? (
        <div className="mb-2 rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-2 text-center text-[11px] font-medium leading-snug text-amber-950 sm:text-xs">
          이 화면은 실제 명함과 같이 보입니다. 아래에서 임시 링크로 열어 확인·공유할 수 있어요.
        </div>
      ) : null}
      <DigitalCardPublicView
        card={card}
        links={previewLinks}
        onLinkClick={(link) => navigatePreviewLink(link.url)}
        compact
        hideSticky
        qrDataUrl={null}
        previewVariant={draft.card_type}
      />
    </>
  );
}
