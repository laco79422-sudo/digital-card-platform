import { Button } from "@/components/ui/Button";
import { focalAfterDrag, optimizeImageFileToDataUrl, parseFocalPercent } from "@/lib/brandImageProcess";
import { cn } from "@/lib/utils";
import { ImageIcon, Move, Trash2 } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

type Props = {
  label?: string;
  value: string | null;
  /** CSS object-position 값 (예: 50% 40%) */
  objectPosition: string;
  onUrlChange: (url: string | null, opts?: { resetPosition?: boolean }) => void;
  onObjectPositionChange: (position: string) => void;
  error?: string;
};

function isAllowedImage(file: File): boolean {
  if (file.size > MAX_BYTES) return false;
  const okType = /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  const okName = /\.(jpe?g|png|webp)$/i.test(file.name);
  return okType || okName;
}

export function ImageUploader({
  label = "브랜드 대표 이미지",
  value,
  objectPosition,
  onUrlChange,
  onObjectPositionChange,
  error,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [processing, setProcessing] = useState(false);
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAllowedImage(file)) {
      window.alert("jpg, jpeg, png, webp 형식이며 4MB 이하만 업로드할 수 있습니다.");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await optimizeImageFileToDataUrl(file);
      onUrlChange(dataUrl, { resetPosition: true });
    } catch {
      window.alert("이미지를 불러오는 데 실패했습니다. 다른 파일로 시도해 주세요.");
    } finally {
      setProcessing(false);
    }
  };

  const onPointerDownFrame = useCallback(
    (e: React.PointerEvent) => {
      if (!value || !frameRef.current) return;
      e.preventDefault();
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      frameRef.current.setPointerCapture(e.pointerId);
    },
    [value],
  );

  const onPointerMoveFrame = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.active || !frameRef.current) return;
      const el = frameRef.current;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      onObjectPositionChange(focalAfterDrag(objectPosition, dx, dy, rect.width, rect.height));
    },
    [objectPosition, onObjectPositionChange],
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

  const focalHint = value ? parseFocalPercent(objectPosition) : null;

  return (
    <div className="space-y-3">
      <label className="text-base font-medium text-slate-800" htmlFor={inputId}>
        {label}
      </label>
      <p className="text-xs text-slate-500">jpg · jpeg · png · webp · 최대 4MB · 업로드 시 긴 변 기준 최대 1920px로 최적화됩니다</p>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
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
          {processing ? "처리 중…" : "파일 선택"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            onClick={() => onUrlChange(null, { resetPosition: true })}
          >
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
            삭제
          </Button>
        ) : null}
      </div>

      {value ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Move className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            미리보기 (16:9) — 이미지를 드래그해 보이는 영역을 맞추세요
          </p>
          <div
            ref={frameRef}
            className={cn(
              "relative w-full max-w-xl overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900/5 shadow-inner",
              "aspect-video touch-none select-none",
            )}
            style={{ touchAction: "none" }}
            onPointerDown={onPointerDownFrame}
            onPointerMove={onPointerMoveFrame}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            role="application"
            aria-label="대표 이미지 초점 조정. 드래그하여 영역을 이동합니다."
          >
            <img
              src={value}
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full object-cover"
              style={{ objectPosition }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-3 py-2">
              <p className="text-center text-[11px] font-medium text-white/95 sm:text-xs">
                초점 {focalHint ? `${focalHint.x}% · ${focalHint.y}%` : ""}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <ImageIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          등록된 이미지 없음
        </span>
      )}

      <div className="mt-4 max-w-xl space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-600 sm:px-4 sm:py-3.5">
        <p>
          명함 상단은 <strong className="font-medium text-slate-700">16:9</strong>로 고정됩니다. 가로·세로 어떤 사진이든 업로드되면
          이 비율에 맞춰 보이며, 기본은 가운데를 기준으로 맞춥니다.
        </p>
        <p>
          중요한 부분이 잘려 보이면 위 프레임에서 사진을 <strong className="font-medium text-slate-700">드래그</strong>해 조정하세요.
          변경 내용은 미리보기와 저장된 명함에 동일하게 반영됩니다.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
