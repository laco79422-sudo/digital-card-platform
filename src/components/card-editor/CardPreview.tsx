import { DigitalCardPublicView } from "@/components/digital-card/DigitalCardPublicView";
import {
  BrandImageTwoStepFlow,
  type FirstCheckStatus,
  type ImageSaveStatus,
  type LineStatus,
  type SecondCheckStatus,
} from "@/components/card-editor/BrandImageTwoStepFlow";
import type { BrandImagePersistPayload } from "@/components/card-editor/ImageUploader";
import { Button } from "@/components/ui/Button";
import {
  BRAND_IMAGE_ACCEPT,
  BRAND_IMAGE_MAX_BYTES,
  BRAND_IMAGE_MIN_EDGE_PX,
  BRAND_IMAGE_TOO_SMALL_ERROR,
  measureImageDimensions,
  validateBrandImageFile,
  validateBrandImageFilename,
} from "@/lib/brandImageConstraints";
import { optimizeImageFileToDataUrl } from "@/lib/brandImageProcess";
import { uploadBrandImageToPendingFromDataUrl } from "@/lib/brandImagePendingUpload";
import { formatUploadErrorForDisplay } from "@/lib/brandImageUploadDiagnostics";
import { DEFAULT_CARD_PERSON_NAME, draftToPreviewBusinessCard } from "@/stores/cardEditorDraftStore";
import { useCardEditorDraftStore } from "@/stores/cardEditorDraftStore";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { BrandImageStatus } from "@/lib/brandImageStatus";
import type { CardLink, CardLinkType } from "@/types/domain";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const businessCards = useAppDataStore((s) => s.businessCards);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const successClearRef = useRef<number | null>(null);
  const statusBeforePickRef = useRef<BrandImageStatus | null>(null);
  const rejectBeforePickRef = useRef<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [firstCheckStatus, setFirstCheckStatus] = useState<FirstCheckStatus>("idle");
  const [lineFormat, setLineFormat] = useState<LineStatus>("idle");
  const [lineSize, setLineSize] = useState<LineStatus>("idle");
  const [lineExists, setLineExists] = useState<LineStatus>("idle");
  const [linePreview, setLinePreview] = useState<LineStatus>("idle");
  const [linePixels, setLinePixels] = useState<LineStatus>("idle");
  const [secondCheckStatus, setSecondCheckStatus] = useState<SecondCheckStatus>("idle");
  const [secondAck, setSecondAck] = useState(false);
  const [imageSaveStatus, setImageSaveStatus] = useState<ImageSaveStatus>("idle");
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(null);
  const [postSaveHint, setPostSaveHint] = useState<string | null>(null);

  const editorHeroEditable = Boolean(!isGuestPreview && persistUploadedHero);
  const showImageFlowPanel = editorHeroEditable || isGuestPreview;

  useEffect(() => {
    return () => {
      if (successClearRef.current !== null) window.clearTimeout(successClearRef.current);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  const revokePreview = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  useEffect(() => {
    if (!imageFile) {
      revokePreview();
      setFirstCheckStatus("idle");
      setLineFormat("idle");
      setLineSize("idle");
      setLineExists("idle");
      setLinePreview("idle");
      setLinePixels("idle");
      setSecondCheckStatus("idle");
      setSecondAck(false);
      return;
    }

    let cancelled = false;
    const file = imageFile;

    setFirstCheckStatus("checking");
    setDraft({ brand_image_status: "checking", brand_image_reject_reason: null });
    setImageErrorMessage(null);
    setSecondCheckStatus("idle");
    setSecondAck(false);
    setImageSaveStatus("idle");
    setLinePixels("idle");
    setLinePreview("pending");

    revokePreview();

    const existsOk = file.size > 0;
    if (!existsOk) {
      setLineFormat("idle");
      setLineSize("idle");
      setLineExists("fail");
      setLinePreview("idle");
      setFirstCheckStatus("failed");
      const msg = "빈 파일입니다. 다른 이미지를 선택해 주세요.";
      setImageErrorMessage(msg);
      setDraft({ brand_image_status: "rejected_auto", brand_image_reject_reason: msg });
      return;
    }

    const v = validateBrandImageFile(file);
    if (!v.ok) {
      const nameOk = validateBrandImageFilename(file.name).ok;
      const typeOk = /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
      const formatPass = nameOk && typeOk;
      const sizePass = file.size > 0 && file.size <= BRAND_IMAGE_MAX_BYTES;
      setLineFormat(formatPass ? "pass" : "fail");
      setLineSize(sizePass ? "pass" : "fail");
      setLineExists("pass");
      setLinePreview("idle");
      setFirstCheckStatus("failed");
      setImageErrorMessage(v.message);
      setDraft({ brand_image_status: "rejected_auto", brand_image_reject_reason: v.message });
      return;
    }

    setLineFormat("pass");
    setLineSize("pass");
    setLineExists("pass");
    setLinePixels("pending");

    const url = URL.createObjectURL(file);
    previewObjectUrlRef.current = url;

    void measureImageDimensions(url)
      .then(({ width, height }) => {
        if (cancelled) return;
        if (width < BRAND_IMAGE_MIN_EDGE_PX || height < BRAND_IMAGE_MIN_EDGE_PX) {
          URL.revokeObjectURL(url);
          previewObjectUrlRef.current = null;
          setLinePixels("fail");
          setLinePreview("idle");
          setFirstCheckStatus("failed");
          setImageErrorMessage(BRAND_IMAGE_TOO_SMALL_ERROR);
          setDraft({
            brand_image_status: "rejected_auto",
            brand_image_reject_reason: BRAND_IMAGE_TOO_SMALL_ERROR,
          });
          return;
        }
        setPreviewUrl(url);
        setLinePixels("pass");
        setFirstCheckStatus("passed");
        setLinePreview("pass");
        setDraft({ brand_image_status: null, brand_image_reject_reason: null });
      })
      .catch(() => {
        if (cancelled) return;
        URL.revokeObjectURL(url);
        previewObjectUrlRef.current = null;
        setLinePixels("fail");
        setFirstCheckStatus("failed");
        const msg =
          "이미지를 불러오지 못했습니다. 손상된 파일이거나 지원되지 않는 형식일 수 있습니다.";
        setImageErrorMessage(msg);
        setLinePreview("fail");
        setDraft({ brand_image_status: "rejected_auto", brand_image_reject_reason: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [imageFile, revokePreview, setDraft]);

  const scheduleSaveMessageClear = useCallback(() => {
    if (successClearRef.current !== null) window.clearTimeout(successClearRef.current);
    successClearRef.current = window.setTimeout(() => {
      setImageSaveStatus("idle");
      setImageErrorMessage(null);
      setPostSaveHint(null);
      successClearRef.current = null;
    }, 7000);
  }, []);

  const cancelSelection = useCallback(() => {
    const st0 = statusBeforePickRef.current;
    const r0 = rejectBeforePickRef.current;
    statusBeforePickRef.current = null;
    rejectBeforePickRef.current = null;
    setDraft({ brand_image_status: st0, brand_image_reject_reason: r0 });
    setImageFile(null);
    setImageSaveStatus("idle");
    setImageErrorMessage(null);
    setPostSaveHint(null);
    setSecondAck(false);
    setSecondCheckStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [setDraft]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const d = useCardEditorDraftStore.getState().draft;
    statusBeforePickRef.current = d.brand_image_status ?? null;
    rejectBeforePickRef.current = d.brand_image_reject_reason ?? null;
    setImageSaveStatus("idle");
    setImageErrorMessage(null);
    setPostSaveHint(null);
    setImageFile(file);
  };

  const confirmApply = async () => {
    if (!imageFile || firstCheckStatus !== "passed" || !secondAck) return;

    statusBeforePickRef.current = null;
    rejectBeforePickRef.current = null;

    setImageSaveStatus("saving");
    setImageErrorMessage(null);

    try {
      const { dataUrl, width, height } = await optimizeImageFileToDataUrl(imageFile);

      if (isGuestPreview) {
        setDraft({
          imageUrl: dataUrl,
          brand_image_url: dataUrl,
          brand_image_natural_width: width,
          brand_image_natural_height: height,
          brand_image_zoom: 1,
          brand_image_pan_x: 0,
          brand_image_pan_y: 0,
          brand_image_legacy_object_position: null,
          brand_image_status: null,
          brand_image_reject_reason: null,
        });
        setSecondCheckStatus("passed");
        setImageSaveStatus("saved");
        setPostSaveHint("로컬 미리보기입니다. 저장·공유는 로그인 후 가능합니다.");
        setImageFile(null);
        scheduleSaveMessageClear();
        return;
      }

      const cardId = existingCardId?.trim();
      const prevRow = cardId ? businessCards.find((c) => c.id === cardId) : null;
      const approvedKeep =
        prevRow?.brand_image_url?.trim() || prevRow?.image_url?.trim() || prevRow?.imageUrl?.trim() || null;

      if (user?.id && cardId && persistUploadedHero) {
        const { path, signedUrl } = await uploadBrandImageToPendingFromDataUrl(dataUrl, imageFile.name, cardId);
        setDraft({
          imageUrl: signedUrl,
          brand_image_url: signedUrl,
          brand_image_status: "pending_review",
          brand_image_pending_path: path,
          brand_image_reject_reason: null,
          approved_public_hero_url: approvedKeep,
          brand_image_natural_width: width,
          brand_image_natural_height: height,
          brand_image_zoom: 1,
          brand_image_pan_x: 0,
          brand_image_pan_y: 0,
          brand_image_legacy_object_position: null,
        });
        await persistUploadedHero({
          displayUrl: signedUrl,
          pendingPath: path,
          naturalW: width,
          naturalH: height,
        });
        setSecondCheckStatus("passed");
        setImageSaveStatus("saved");
        setPostSaveHint("이미지가 업로드되었습니다. 검수 후 공개됩니다.");
        setImageFile(null);
        scheduleSaveMessageClear();
        return;
      }

      setDraft({
        imageUrl: dataUrl,
        brand_image_url: dataUrl,
        brand_image_natural_width: width,
        brand_image_natural_height: height,
        brand_image_zoom: 1,
        brand_image_pan_x: 0,
        brand_image_pan_y: 0,
        brand_image_legacy_object_position: null,
      });
      setSecondCheckStatus("passed");
      setImageSaveStatus("saved");
      setPostSaveHint(
        user?.id
          ? "임시 미리보기입니다. 명함을 저장한 뒤 이미지를 서버에 올리면 검수를 거칩니다."
          : "미리보기만 반영되었습니다. 저장 후 다시 시도해 주세요.",
      );
      setImageFile(null);
      scheduleSaveMessageClear();
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      setImageSaveStatus("failed");
      const detail = formatUploadErrorForDisplay(error);
      const msg = detail.trim() ? detail : "알 수 없는 업로드 오류";
      setImageErrorMessage(msg);
      setDraft({ brand_image_status: "rejected_auto", brand_image_reject_reason: msg });
    }
  };

  const removeHero = async () => {
    cancelSelection();
    setDraft({
      imageUrl: null,
      brand_image_url: null,
      approved_public_hero_url: null,
      brand_image_status: null,
      brand_image_pending_path: null,
      brand_image_reject_reason: null,
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

  const draftHero = draft.imageUrl ?? draft.brand_image_url;
  const hasHero = Boolean(draftHero?.trim());

  const checking = firstCheckStatus === "checking";
  const saving = imageSaveStatus === "saving";
  const filePickDisabled = checking || saving;

  const emptySlotHelper =
    !hasHero && imageFile && firstCheckStatus === "checking"
      ? "1차 검사 중…"
      : !hasHero && firstCheckStatus === "failed" && imageErrorMessage
        ? imageErrorMessage
        : null;

  return (
    <>
      {guestTempHint ? (
        <div className="mb-2 rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-2 text-center text-[11px] font-medium leading-snug text-amber-950 sm:text-xs">
          이 화면은 실제 명함과 같이 보입니다. 아래에서 임시 링크로 열어 확인·공유할 수 있어요.
        </div>
      ) : null}

      <input ref={fileInputRef} type="file" accept={BRAND_IMAGE_ACCEPT} className="hidden" onChange={onPick} />

      {showImageFlowPanel ? (
        <div className="mb-3 space-y-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 sm:text-sm">[1] 이미지 업로드 (미리보기)</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
              JPG · JPEG · PNG · WEBP · 최대 5MB. 아래 1차·2차 검증 후에만 카드에 반영됩니다.
            </p>
            <div className="mt-2">
              <Button type="button" variant="secondary" size="sm" className="min-h-10" disabled={filePickDisabled} onClick={() => fileInputRef.current?.click()}>
                {checking ? "1차 검사 중…" : saving ? "저장 중…" : "파일 선택"}
              </Button>
            </div>
          </div>
          {hasHero && imageFile ? (
            <p className="text-[11px] font-medium text-slate-600 sm:text-xs">
              검증을 마치기 전까지는 아래 미리보기에 기존 이미지가 표시됩니다.
            </p>
          ) : null}
          <BrandImageTwoStepFlow
            imageFile={imageFile}
            previewUrl={previewUrl}
            firstCheckStatus={firstCheckStatus}
            secondCheckStatus={secondCheckStatus}
            imageSaveStatus={imageSaveStatus}
            imageErrorMessage={imageErrorMessage}
            lineFormat={lineFormat}
            lineSize={lineSize}
            lineExists={lineExists}
            linePreview={linePreview}
            linePixels={linePixels}
            secondAck={secondAck}
            onSecondAckChange={setSecondAck}
            onConfirmApply={() => void confirmApply()}
            onCancelSelection={cancelSelection}
            compact
          />
          {postSaveHint && imageSaveStatus === "saved" ? (
            <p className="text-[11px] font-medium text-slate-600 sm:text-xs">{postSaveHint}</p>
          ) : null}
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
        imageUrlOverride={draft.imageUrl ?? draft.brand_image_url}
        imageHelperText={emptySlotHelper}
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
