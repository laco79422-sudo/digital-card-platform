import { DigitalCardPublicView } from "@/components/digital-card/DigitalCardPublicView";
import {
  BRAND_IMAGE_ACCEPT,
  validateBrandImageFile,
} from "@/lib/brandImageConstraints";
import { optimizeImageFileToDataUrl } from "@/lib/brandImageProcess";
import { uploadBrandImageDataUrl } from "@/lib/brandImageUpload";
import { patchCardBrandHeroRemote } from "@/services/cardsService";
import { DEFAULT_CARD_PERSON_NAME, draftToPreviewBusinessCard } from "@/stores/cardEditorDraftStore";
import { useCardEditorDraftStore } from "@/stores/cardEditorDraftStore";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { CardLink, CardLinkType } from "@/types/domain";
import { useEffect, useRef, useState } from "react";

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
  const setDraft = useCardEditorDraftStore((s) => s.setDraft);
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);

  const fileInputRef = useRef<HTMLInputElement>(null);
  /** 업로드 완료 전에만 사용하는 로컬 data URL 미리보기 */
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const successClearRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (successClearRef.current !== null) window.clearTimeout(successClearRef.current);
    };
  }, []);

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

  const pickPreviewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const valid = validateBrandImageFile(file);
    if (!valid.ok) {
      setLocalImagePreview(null);
      setImageMessage(valid.message);
      return;
    }

    setImageMessage("이미지를 업로드하고 있습니다...");
    try {
      const { dataUrl, width, height } = await optimizeImageFileToDataUrl(file);
      setLocalImagePreview(dataUrl);

      const publicUrl = await uploadBrandImageDataUrl(dataUrl, file.name);

      setDraft({
        imageUrl: publicUrl,
        brand_image_url: publicUrl,
        brand_image_natural_width: width,
        brand_image_natural_height: height,
        brand_image_zoom: 1,
        brand_image_pan_x: 0,
        brand_image_pan_y: 0,
        brand_image_legacy_object_position: null,
      });

      if (existingCardId) {
        const patch = {
          imageUrl: publicUrl,
          brand_image_url: publicUrl,
          image_url: publicUrl,
          brand_image_natural_width: width,
          brand_image_natural_height: height,
          brand_image_zoom: 1,
          brand_image_pan_x: 0,
          brand_image_pan_y: 0,
          brand_image_object_position: null,
        };
        const remoteOk = await patchCardBrandHeroRemote(existingCardId, patch);
        const row = businessCards.find((c) => c.id === existingCardId);
        if (remoteOk && row) {
          upsertBusinessCard({ ...row, ...patch });
        }
      }

      setLocalImagePreview(null);
      setImageMessage("이미지가 저장되었습니다.");
      if (successClearRef.current !== null) window.clearTimeout(successClearRef.current);
      successClearRef.current = window.setTimeout(() => {
        setImageMessage(null);
        successClearRef.current = null;
      }, 4000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[CardPreview] 이미지 저장 실패:", msg, error);
      setLocalImagePreview(null);
      setImageMessage("이미지 저장에 실패했습니다. 저장소 설정을 확인해 주세요.");
    }
  };

  return (
    <>
      {guestTempHint ? (
        <div className="mb-2 rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-2 text-center text-[11px] font-medium leading-snug text-amber-950 sm:text-xs">
          이 화면은 실제 명함과 같이 보입니다. 아래에서 임시 링크로 열어 확인·공유할 수 있어요.
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept={BRAND_IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => void pickPreviewImage(e)}
      />
      <DigitalCardPublicView
        card={card}
        links={previewLinks}
        onLinkClick={(link) => navigatePreviewLink(link.url)}
        compact
        hideSticky
        qrDataUrl={null}
        previewVariant={draft.card_type}
        imageUrlOverride={localImagePreview}
        imageHelperText={imageMessage}
        onEmptyImageClick={() => fileInputRef.current?.click()}
        editableName
        namePlaceholder={DEFAULT_CARD_PERSON_NAME}
        onNameChange={(name) => setDraft({ person_name: name.trim() || DEFAULT_CARD_PERSON_NAME })}
      />
    </>
  );
}
