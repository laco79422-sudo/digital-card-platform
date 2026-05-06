import { BrandHeroFrame } from "@/components/digital-card/BrandHeroFrame";
import {
  BrandImageTwoStepFlow,
  type FirstCheckStatus,
  type ImageSaveStatus,
  type LineStatus,
  type SecondCheckStatus,
} from "@/components/card-editor/BrandImageTwoStepFlow";
import { Button } from "@/components/ui/Button";
import {
  BRAND_HERO_MAX_ZOOM,
  BRAND_HERO_MIN_ZOOM,
  clampPanNorm,
  clampZoom,
  computeHeroLayout,
} from "@/lib/brandHeroLayout";
import {
  BRAND_IMAGE_ACCEPT,
  BRAND_IMAGE_MAX_BYTES,
  BRAND_IMAGE_MIN_EDGE_PX,
  BRAND_IMAGE_TOO_SMALL_ERROR,
  measureImageDimensions,
  validateBrandImageFile,
  validateBrandImageFilename,
} from "@/lib/brandImageConstraints";
import type { BrandImageStatus } from "@/lib/brandImageStatus";
import { optimizeImageFileToDataUrl } from "@/lib/brandImageProcess";
import { uploadBrandImageToPendingFromDataUrl } from "@/lib/brandImagePendingUpload";
import { formatUploadErrorForDisplay } from "@/lib/brandImageUploadDiagnostics";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useCardEditorDraftStore } from "@/stores/cardEditorDraftStore";
import { ChevronDown, ImageIcon, Minus, Move, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type UrlMeta = {
  reset?: boolean;
  naturalW?: number | null;
  naturalH?: number | null;
};

export type BrandImagePersistPayload = {
  /** 편집기·미리보기용 (signed URL 또는 blob) */
  displayUrl: string;
  /** private 버킷 객체 경로 — null이면 서버에 히어로를 저장하지 않음(로컬만) */
  pendingPath: string | null;
  naturalW: number | null;
  naturalH: number | null;
};

type Props = {
  label?: string;
  value: string | null;
  naturalWidth: number | null;
  naturalHeight: number | null;
  zoom: number;
  panX: number;
  panY: number;
  onUrlChange: (url: string | null, meta?: UrlMeta) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (panX: number, panY: number) => void;
  /** 이미지에서 natural 픽셀을 읽었을 때(구 카드·외부 URL) */
  onNaturalMeasured: (w: number, h: number) => void;
  /** natural 없을 때만 적용 (구 카드) */
  legacyObjectPosition?: string | null;
  error?: string;
  /** 비회원: 서버 업로드 없이 로컬 미리보기만 */
  gateGuestPick?: boolean;
  uploadFailMessage?: string;
  /** 스크롤용 앵커 id · scroll-mt-24 클래스 적용 */
  sectionAnchorId?: string;
  /** 기본: 고급(확대·위치) 조절 접힘 */
  defaultAdvancedOpen?: boolean;
  /** 편집기용: 삭제를 붉은 강조 대신 작은 보조 버튼으로 */
  compactDeleteStyle?: boolean;
  moderationNote?: string | null;
  /** 저장된 명함이 있으면 업로드 직후 원격 DB에도 반영 — ID가 준비될 때까지 지연 필요 시 getter 사용 */
  persistBrandImageCardId?: string | null;
  getPersistBrandImageCardId?: () => string | null;
  onBrandImagePersist?: (payload: BrandImagePersistPayload) => Promise<void>;
  /** 1차 통과 전·2차 검증 전·검증 중일 때 true — 명함 폼 최종 저장 비활성화용 */
  onHeroImageFlowBlockingChange?: (blocked: boolean) => void;
  /** 1차 검수 단계에서 draft.brand_image_status 동기화 (checking → 실패 시 rejected_auto 등) */
  onBrandImageDraftPatch?: (patch: {
    brand_image_status?: BrandImageStatus | null;
    brand_image_reject_reason?: string | null;
  }) => void;
};

export function ImageUploader({
  label = "브랜드 대표 이미지",
  value,
  naturalWidth,
  naturalHeight,
  zoom,
  panX,
  panY,
  onUrlChange,
  onZoomChange,
  onPanChange,
  onNaturalMeasured,
  legacyObjectPosition,
  error,
  gateGuestPick = false,
  uploadFailMessage = "알 수 없는 업로드 오류",
  sectionAnchorId,
  defaultAdvancedOpen = false,
  compactDeleteStyle = false,
  moderationNote,
  persistBrandImageCardId,
  getPersistBrandImageCardId,
  onBrandImagePersist,
  onHeroImageFlowBlockingChange,
  onBrandImageDraftPatch,
}: Props) {
  const inputId = useId();
  const sessionUser = useAuthStore((s) => s.user);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
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
  /** 저장 성공 후 추가 안내(임시 미리보기 등) — 실패 메시지와 별도 */
  const [postSaveHint, setPostSaveHint] = useState<string | null>(null);

  const [advancedOpen, setAdvancedOpen] = useState(defaultAdvancedOpen);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  useEffect(() => {
    setAdvancedOpen(defaultAdvancedOpen);
  }, [defaultAdvancedOpen]);

  useEffect(() => {
    if (imageFile) setAdvancedOpen(false);
  }, [imageFile]);

  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    return () => {
      if (successClearRef.current !== null) window.clearTimeout(successClearRef.current);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setFrame({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setFrame({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, [value]);

  const iw = naturalWidth ?? 0;
  const ih = naturalHeight ?? 0;

  const committedUrl = value;
  const displayUrl = committedUrl;

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
    onBrandImageDraftPatch?.({ brand_image_status: "checking", brand_image_reject_reason: null });
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
      setImageErrorMessage("빈 파일입니다. 다른 이미지를 선택해 주세요.");
      onBrandImageDraftPatch?.({
        brand_image_status: "rejected_auto",
        brand_image_reject_reason: "빈 파일입니다. 다른 이미지를 선택해 주세요.",
      });
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
      onBrandImageDraftPatch?.({ brand_image_status: "rejected_auto", brand_image_reject_reason: v.message });
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
          onBrandImageDraftPatch?.({
            brand_image_status: "rejected_auto",
            brand_image_reject_reason: BRAND_IMAGE_TOO_SMALL_ERROR,
          });
          return;
        }
        setPreviewUrl(url);
        setLinePixels("pass");
        setFirstCheckStatus("passed");
        setLinePreview("pass");
        onBrandImageDraftPatch?.({ brand_image_status: null, brand_image_reject_reason: null });
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
        onBrandImageDraftPatch?.({ brand_image_status: "rejected_auto", brand_image_reject_reason: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [imageFile, revokePreview, onBrandImageDraftPatch]);

  useEffect(() => {
    const blocked =
      imageFile != null && !(firstCheckStatus === "passed" && secondCheckStatus === "passed");
    onHeroImageFlowBlockingChange?.(blocked);
  }, [imageFile, firstCheckStatus, secondCheckStatus, onHeroImageFlowBlockingChange]);

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
    onBrandImageDraftPatch?.({
      brand_image_status: st0,
      brand_image_reject_reason: r0,
    });
    setImageFile(null);
    setImageSaveStatus("idle");
    setImageErrorMessage(null);
    setPostSaveHint(null);
    setSecondAck(false);
    setSecondCheckStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }, [onBrandImageDraftPatch]);

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

      if (gateGuestPick) {
        onUrlChange(dataUrl, { reset: true, naturalW: width, naturalH: height });
        onBrandImageDraftPatch?.({ brand_image_status: null, brand_image_reject_reason: null });
        setSecondCheckStatus("passed");
        setImageSaveStatus("saved");
        setPostSaveHint(
          "비회원: 이 기기에서만 미리보기입니다. 서버 업로드 없음(로그인 후 저장·검수 업로드 가능).",
        );
        setImageFile(null);
        console.log("[ImageUploader] guest — local preview only, no Supabase storage");
        scheduleSaveMessageClear();
        return;
      }

      const cardId = getPersistBrandImageCardId?.() ?? persistBrandImageCardId ?? null;
      const usePendingBucket = Boolean(sessionUser?.id && cardId && onBrandImagePersist);

      if (usePendingBucket && cardId) {
        const { path, signedUrl } = await uploadBrandImageToPendingFromDataUrl(dataUrl, imageFile.name, cardId);
        onUrlChange(signedUrl, { reset: true, naturalW: width, naturalH: height });
        await onBrandImagePersist?.({
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

      onUrlChange(dataUrl, { reset: true, naturalW: width, naturalH: height });
      setSecondCheckStatus("passed");
      setImageSaveStatus("saved");
      setImageFile(null);
      const cardIdMissing = !cardId;
      if (cardIdMissing && sessionUser?.id) {
        setPostSaveHint(
          "임시 미리보기입니다. 명함을 저장한 뒤 같은 화면에서 다시 선택하면 검수 대기 업로드가 됩니다.",
        );
      } else if (!sessionUser?.id) {
        setPostSaveHint("미리보기만 반영되었습니다. 저장 후 다시 시도해 주세요.");
      } else {
        setPostSaveHint(null);
      }
      scheduleSaveMessageClear();
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setImageSaveStatus("failed");
      const line = formatUploadErrorForDisplay(err);
      const msg = line?.trim() ? line : uploadFailMessage;
      setImageErrorMessage(msg);
      onBrandImageDraftPatch?.({ brand_image_status: "rejected_auto", brand_image_reject_reason: msg });
    }
  };

  const applyPanDrag = useCallback(
    (dx: number, dy: number) => {
      if (!iw || !ih || frame.w <= 0 || frame.h <= 0) return;
      const { maxPanX, maxPanY } = computeHeroLayout(frame.w, frame.h, iw, ih, zoom, panX, panY);
      const nx =
        maxPanX > 0 ? Math.max(-1, Math.min(1, panX + dx / Math.max(maxPanX, 0.001))) : 0;
      const ny =
        maxPanY > 0 ? Math.max(-1, Math.min(1, panY + dy / Math.max(maxPanY, 0.001))) : 0;
      const o = clampPanNorm(nx, ny, frame.w, frame.h, iw, ih, zoom);
      onPanChange(o.x, o.y);
    },
    [frame.h, frame.w, iw, ih, onPanChange, panX, panY, zoom],
  );

  const onPointerDownFrame = useCallback(
    (e: React.PointerEvent) => {
      if (!displayUrl || !frameRef.current) return;
      e.preventDefault();
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      frameRef.current.setPointerCapture(e.pointerId);
    },
    [displayUrl],
  );

  const onPointerMoveFrame = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      applyPanDrag(dx, dy);
    },
    [applyPanDrag],
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    try {
      frameRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const setZoomAndClampPan = useCallback(
    (nextZoom: number) => {
      const z = clampZoom(nextZoom);
      onZoomChange(z);
      if (frame.w > 0 && frame.h > 0 && iw > 0 && ih > 0) {
        const o = clampPanNorm(panX, panY, frame.w, frame.h, iw, ih, z);
        onPanChange(o.x, o.y);
      }
    },
    [frame.h, frame.w, iw, ih, onPanChange, onZoomChange, panX, panY],
  );

  const nudgeZoom = (delta: number) => setZoomAndClampPan(zoom + delta);

  const onWheelFrame = useCallback(
    (e: React.WheelEvent) => {
      if (!displayUrl || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const dz = e.deltaY > 0 ? -0.08 : 0.08;
      setZoomAndClampPan(zoom + dz);
    },
    [displayUrl, setZoomAndClampPan, zoom],
  );

  const clearImageConfirmed = () => {
    setRemoveModalOpen(false);
    cancelSelection();
    onUrlChange(null, { reset: true, naturalW: null, naturalH: null });
  };

  const resetLayout = () => {
    onZoomChange(1);
    onPanChange(0, 0);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const checking = firstCheckStatus === "checking";
  const saving = imageSaveStatus === "saving";
  const filePickDisabled = checking || saving;

  const showHeroBlock = Boolean(displayUrl);
  const showEmptyPlaceholder = !displayUrl && !imageFile;
  const advancedActive = advancedOpen && !imageFile;

  return (
    <div className={cn("space-y-3", sectionAnchorId && "scroll-mt-24")} id={sectionAnchorId}>
      <Modal open={removeModalOpen} onClose={() => setRemoveModalOpen(false)} title="대표 이미지 삭제">
        <p className="text-sm leading-relaxed text-slate-600">
          등록한 이미지를 제거할까요? 저장 전이라면 언제든지 다시 선택할 수 있습니다.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setRemoveModalOpen(false)}>
            취소
          </Button>
          <Button type="button" variant="secondary" className="text-slate-800" onClick={clearImageConfirmed}>
            삭제하기
          </Button>
        </div>
      </Modal>

      <label className="text-base font-medium text-slate-800" htmlFor={inputId}>
        {label}
      </label>
      {moderationNote ? (
        <p className="rounded-lg border border-amber-200/90 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-950">
          {moderationNote}
        </p>
      ) : null}

      <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-900">[1] 이미지 업로드</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
          JPG · JPEG · PNG · WEBP · 최대 5MB · 업로드 시 긴 변 기준 최대 1920px로 최적화됩니다. 파일을 고른 뒤 1차 검사와 2차 검증을 거쳐야
          명함에 반영됩니다.
        </p>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={BRAND_IMAGE_ACCEPT}
          className="sr-only"
          onChange={onPick}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" className="min-h-11" disabled={filePickDisabled} onClick={openFilePicker}>
            {checking ? "1차 검사 중…" : saving ? "저장 중…" : "파일 선택"}
          </Button>
        </div>
      </div>

      {imageFile && committedUrl ? (
        <p className="text-xs font-medium text-slate-600">
          아래 검증을 완료하고 저장하기 전까지는 명함 미리보기에 기존 이미지가 그대로 표시됩니다.
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
      />

      {postSaveHint && imageSaveStatus === "saved" ? (
        <p className="text-xs font-medium text-slate-600">{postSaveHint}</p>
      ) : null}

      {showHeroBlock ? (
        <div
          ref={frameRef}
          className={cn(
            "relative w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900/10 shadow-inner",
            "aspect-video touch-none select-none",
            !advancedActive && "pointer-events-none",
          )}
          style={{ touchAction: "none" }}
          onPointerDown={advancedActive ? onPointerDownFrame : undefined}
          onPointerMove={advancedActive ? onPointerMoveFrame : undefined}
          onPointerUp={advancedActive ? endDrag : undefined}
          onPointerCancel={advancedActive ? endDrag : undefined}
          onWheel={advancedActive ? onWheelFrame : undefined}
          role={advancedActive ? "application" : "img"}
          aria-label={advancedActive ? "대표 이미지 구도 조정" : "대표 이미지 미리보기"}
        >
          <BrandHeroFrame
            className="absolute inset-0 h-full w-full"
            imageUrl={displayUrl!}
            naturalWidth={iw}
            naturalHeight={ih}
            zoom={clampZoom(zoom)}
            panNormX={panX}
            panNormY={panY}
            legacyObjectPosition={legacyObjectPosition}
            onNaturalMeasured={onNaturalMeasured}
            imgLoading="eager"
          />
          {!advancedActive ? (
            <p className="pointer-events-none absolute bottom-2 left-1/2 max-w-[90%] -translate-x-1/2 rounded-md bg-black/45 px-2 py-1 text-center text-[10px] font-medium text-white sm:text-xs">
              {imageFile
                ? "새 이미지는 아래 검증을 완료한 뒤 반영됩니다."
                : "구도 조정은 &quot;고급 이미지 조정&quot;을 연 뒤 사용하세요."}
            </p>
          ) : null}
        </div>
      ) : showEmptyPlaceholder ? (
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <ImageIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          등록된 이미지 없음
        </span>
      ) : null}

      {showHeroBlock && !imageFile ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="min-h-11" disabled={filePickDisabled} onClick={openFilePicker}>
            다른 이미지로 바꾸기
          </Button>
          <button
            type="button"
            disabled={filePickDisabled}
            onClick={() => setRemoveModalOpen(true)}
            className={cn(
              "text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-50",
              compactDeleteStyle
                ? "text-slate-500 hover:text-slate-800"
                : "text-rose-700/85 hover:text-rose-800",
            )}
          >
            이미지 제거
          </button>
        </div>
      ) : null}

      {showHeroBlock && !imageFile ? (
        <div className="max-w-2xl">
          <button
            type="button"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            고급 이미지 조정 {advancedOpen ? "접기" : "열기"}
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", advancedOpen && "rotate-180")}
              aria-hidden
            />
          </button>

          {advancedOpen ? (
            <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-white px-3 py-4 shadow-sm sm:px-4">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
                <Move className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                미리보기 영역 안에서 드래그하면 위치를 옮길 수 있어요. 아래 슬라이더로 확대·축소합니다.
              </p>

              <div className="flex max-w-xl flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-slate-600 sm:text-sm">확대</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() => nudgeZoom(-0.1)}
                  aria-label="축소"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </Button>
                <input
                  type="range"
                  min={BRAND_HERO_MIN_ZOOM}
                  max={BRAND_HERO_MAX_ZOOM}
                  step={0.02}
                  value={clampZoom(zoom)}
                  onChange={(e) => setZoomAndClampPan(Number(e.target.value))}
                  className="h-2 min-w-[8rem] flex-1 cursor-pointer accent-brand-600 sm:min-w-[12rem]"
                  aria-label="이미지 확대 배율"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={() => nudgeZoom(0.1)}
                  aria-label="확대"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
                <span className="text-xs tabular-nums text-slate-500 sm:text-sm">{clampZoom(zoom).toFixed(2)}×</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                트랙패드에서 Ctrl(또는 ⌘) + 스크롤로 확대/축소할 수 있어요.
              </p>

              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={resetLayout}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                확대·위치 초기화
              </Button>

              <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                <p className="break-keep">
                  <strong className="font-medium text-slate-700">처음 업로드하면</strong> 사진 전체가 16:9 프레임 안에 한 번에 보이도록
                  맞춰져요.
                </p>
                <p className="break-keep">명함 미리보기와 같은 비율(16:9)로 표시됩니다.</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
