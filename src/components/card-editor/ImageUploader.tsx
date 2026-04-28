import { BrandHeroFrame } from "@/components/digital-card/BrandHeroFrame";
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
  validateBrandImageFile,
} from "@/lib/brandImageConstraints";
import { optimizeImageFileToDataUrl } from "@/lib/brandImageProcess";
import { uploadBrandImageDataUrl } from "@/lib/brandImageUpload";
import { cn } from "@/lib/utils";
import { ImageIcon, Minus, Move, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type UrlMeta = {
  reset?: boolean;
  naturalW?: number | null;
  naturalH?: number | null;
};

export type BrandImagePersistPayload = {
  publicUrl: string;
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
  /** 저장된 명함이 있으면 업로드 직후 원격 DB에도 반영 */
  persistBrandImageCardId?: string | null;
  onBrandImagePersist?: (payload: BrandImagePersistPayload) => Promise<void>;
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
  persistBrandImageCardId,
  onBrandImagePersist,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  /** 업로드 완료 전 로컬 미리보기(data URL). 업로드 성공 시 비움 */
  const [previewDuringUpload, setPreviewDuringUpload] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadLine, setUploadLine] = useState<string | null>(null);
  const successClearRef = useRef<number | null>(null);

  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    return () => {
      if (successClearRef.current !== null) window.clearTimeout(successClearRef.current);
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
  }, [value, previewDuringUpload]);

  const iw = naturalWidth ?? 0;
  const ih = naturalHeight ?? 0;

  /** 미리보기/저장에 쓰는 URL — 업로드 중에는 로컬 data URL */
  const displayUrl = previewDuringUpload ?? value;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const valid = validateBrandImageFile(file);
    if (!valid.ok) {
      setUploadLine(valid.message);
      setPreviewDuringUpload(null);
      return;
    }

    setProcessing(true);
    setUploadLine("이미지를 업로드하고 있습니다...");
    try {
      const { dataUrl, width, height } = await optimizeImageFileToDataUrl(file);
      setPreviewDuringUpload(dataUrl);

      const publicUrl = await uploadBrandImageDataUrl(dataUrl, file.name);
      onUrlChange(publicUrl, { reset: true, naturalW: width, naturalH: height });
      setPreviewDuringUpload(null);

      if (persistBrandImageCardId && onBrandImagePersist) {
        await onBrandImagePersist({
          publicUrl,
          naturalW: width,
          naturalH: height,
        });
      }

      setUploadLine("이미지가 저장되었습니다.");
      if (successClearRef.current !== null) window.clearTimeout(successClearRef.current);
      successClearRef.current = window.setTimeout(() => {
        setUploadLine(null);
        successClearRef.current = null;
      }, 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ImageUploader] 이미지 저장 실패:", msg, err);
      setPreviewDuringUpload(null);
      setUploadLine("이미지 저장에 실패했습니다. 저장소 설정을 확인해 주세요.");
    } finally {
      setProcessing(false);
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

  const clearImage = () => {
    setPreviewDuringUpload(null);
    setUploadLine(null);
    onUrlChange(null, { reset: true, naturalW: null, naturalH: null });
  };

  return (
    <div className="space-y-3">
      <label className="text-base font-medium text-slate-800" htmlFor={inputId}>
        {label}
      </label>
      <p className="text-xs text-slate-500">
        JPG · PNG · WEBP · 최대 5MB · 업로드 시 긴 변 기준 최대 1920px로 최적화됩니다
      </p>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={BRAND_IMAGE_ACCEPT}
        className="sr-only"
        onChange={onPick}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={processing}
          onClick={() => inputRef.current?.click()}
        >
          {processing ? "이미지를 업로드하고 있습니다..." : "파일 선택"}
        </Button>
        {displayUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            disabled={processing}
            onClick={clearImage}
          >
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
            삭제
          </Button>
        ) : null}
      </div>
      {uploadLine ? (
        <p
          className={cn(
            "text-sm font-medium",
            uploadLine.includes("실패") ? "text-red-600" : "text-brand-700",
          )}
          role="status"
        >
          {uploadLine}
        </p>
      ) : null}

      {displayUrl ? (
        <div className="space-y-3">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
            <Move className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            미리보기 (16:9) — 드래그로 위치 · 슬라이더 또는 ±로 확대/축소
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

          <div
            ref={frameRef}
            className={cn(
              "relative w-full max-w-xl overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900/10 shadow-inner",
              "aspect-video touch-none select-none",
            )}
            style={{ touchAction: "none" }}
            onPointerDown={onPointerDownFrame}
            onPointerMove={onPointerMoveFrame}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onWheel={onWheelFrame}
            role="application"
            aria-label="대표 이미지 구도 조정"
          >
            <BrandHeroFrame
              className="absolute inset-0 h-full w-full"
              imageUrl={displayUrl}
              naturalWidth={iw}
              naturalHeight={ih}
              zoom={clampZoom(zoom)}
              panNormX={panX}
              panNormY={panY}
              legacyObjectPosition={legacyObjectPosition}
              onNaturalMeasured={onNaturalMeasured}
              imgLoading="eager"
            />
          </div>
        </div>
      ) : (
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <ImageIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          등록된 이미지 없음
        </span>
      )}

      <div className="mt-4 max-w-xl space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-600 sm:px-4 sm:py-3.5">
        <p className="break-keep">
          <strong className="font-medium text-slate-700">처음 업로드하면</strong> 사진 전체가 16:9 프레임 안에{" "}
          <strong className="font-medium text-slate-700">한 번에 보이도록</strong> 맞춰져요. 잘리지 않은 상태에서
          시작합니다.
        </p>
        <p className="break-keep">
          강조하고 싶을 때만 확대한 뒤, <strong className="font-medium text-slate-700">드래그</strong>로 위·아래·
          좌·우 모두 움직여 구도를 맞출 수 있어요.
        </p>
        <p className="break-keep">
          여기서 조정한 화면과 <strong className="font-medium text-slate-700">저장된 명함·미리보기</strong>가
          같은 비율(16:9)로 동일하게 보입니다.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
