import { DigitalCardPublicView } from "@/components/digital-card/DigitalCardPublicView";
import type { BrandImagePersistPayload } from "@/components/card-editor/ImageUploader";
import {
  BRAND_IMAGE_ACCEPT,
  validateBrandImageFile,
} from "@/lib/brandImageConstraints";
import { optimizeImageFileToDataUrl } from "@/lib/brandImageProcess";
import { getBrandImageUploadUserMessage, uploadBrandImageDataUrl } from "@/lib/brandImageUpload";
import { DEFAULT_CARD_PERSON_NAME, draftToPreviewBusinessCard } from "@/stores/cardEditorDraftStore";
import { useCardEditorDraftStore } from "@/stores/cardEditorDraftStore";
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
  if (t.startsWith("#") && !t.startsWith("#__")) {
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
  guestTempHint?: boolean;
  /** 로그인 멤버: 업로드 직후 원격 카드 레코드에 반영 */
  persistUploadedHero?: (payload: BrandImagePersistPayload) => Promise<void>;
  persistClearHero?: () => Promise<void>;
  /** card_events 등 기록용 실제 카드 id */
  analyticsCardId?: string | null;
  isGuestPreview?: boolean;
  /** 비회원 미리보기: 빈 영역 탭 시 이미지 대신 회원 안내로 연결 */
  onGuestHeroImageBlocked?: () => void;
};

export function CardPreview({
  linkRows,
  existingCardId,
  createdAt,
  guestTempHint,
  persistUploadedHero,
  persistClearHero,
  analyticsCardId,
  isGuestPreview = false,
  onGuestHeroImageBlocked,
}: Props) {
  const draft = useCardEditorDraftStore((s) => s.draft);
  const setDraft = useCardEditorDraftStore((s) => s.setDraft);
  const user = useAuthStore((s) => s.user);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    cardId: existingCardId ?? analyticsCardId ?? undefined,
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

      if (!isGuestPreview && persistUploadedHero) {
        await persistUploadedHero({ publicUrl, naturalW: width, naturalH: height });
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
      const detail = getBrandImageUploadUserMessage(error);
      setImageMessage(
        isGuestPreview
          ? "이미지 저장은 회원가입 후 가능합니다. 작성한 내용은 임시저장됩니다."
          : detail,
      );
    }
  };

  const removeHero = async () => {
    setDraft({
      imageUrl: null,
      brand_image_url: null,
      brand_image_natural_width: null,
      brand_image_natural_height: null,
      brand_image_zoom: 1,
      brand_image_pan_x: 0,
      brand_image_pan_y: 0,
      brand_image_legacy_object_position: null,
    });
    if (!isGuestPreview && persistClearHero) {
      try {
        await persistClearHero();
      } catch (err) {
        console.warn("[CardPreview] 이미지 삭제 동기화", err);
      }
    }
  };

  const editorHeroEditable = Boolean(!isGuestPreview && persistUploadedHero);

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
        onEmptyImageClick={
          isGuestPreview && onGuestHeroImageBlocked ? () => onGuestHeroImageBlocked() : () => fileInputRef.current?.click()
        }
        analyticsCardId={analyticsCardId?.trim() || existingCardId?.trim() || null}
        editorHeroEditable={editorHeroEditable}
        onHeroImagePick={() => fileInputRef.current?.click()}
        onHeroImageRemove={() => void removeHero()}
        editableName
        namePlaceholder={DEFAULT_CARD_PERSON_NAME}
        onNameChange={(name) => setDraft({ person_name: name.trim() || DEFAULT_CARD_PERSON_NAME })}
      />
    </>
  );
}
