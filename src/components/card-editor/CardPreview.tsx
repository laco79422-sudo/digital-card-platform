import { DigitalCardPublicView } from "@/components/digital-card/DigitalCardPublicView";
import { draftToPreviewBusinessCard } from "@/stores/cardEditorDraftStore";
import { useCardEditorDraftStore } from "@/stores/cardEditorDraftStore";
import { useAuthStore } from "@/stores/authStore";
import type { CardLink, CardLinkType } from "@/types/domain";

export type CardPreviewLinkRow = { id: string; label: string; type: CardLinkType; url: string };

type Props = {
  linkRows: CardPreviewLinkRow[];
  existingCardId?: string;
  createdAt?: string;
};

export function CardPreview({ linkRows, existingCardId, createdAt }: Props) {
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
    <DigitalCardPublicView
      card={card}
      links={previewLinks}
      onLinkClick={() => {}}
      compact
      hideSticky
      qrDataUrl={null}
    />
  );
}
