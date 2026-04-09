import {
  computeHeroLayout,
} from "@/lib/brandHeroLayout";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type Props = {
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  zoom: number;
  panNormX: number;
  panNormY: number;
  /** natural 미저장 구 카드: cover + object-position */
  legacyObjectPosition?: string | null;
  /** 구 카드·외부 URL에서 natural 픽셀을 처음 읽었을 때 */
  onNaturalMeasured?: (w: number, h: number) => void;
  className?: string;
  imgLoading?: "eager" | "lazy";
};

export function BrandHeroFrame({
  imageUrl,
  naturalWidth,
  naturalHeight,
  zoom,
  panNormX,
  panNormY,
  legacyObjectPosition,
  onNaturalMeasured,
  className,
  imgLoading = "lazy",
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setFrame({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setFrame({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, []);

  const iw = naturalWidth;
  const ih = naturalHeight;
  const useLegacy = !iw || !ih || iw <= 0 || ih <= 0;

  if (useLegacy) {
    return (
      <div ref={shellRef} className={cn("relative h-full min-h-0 w-full overflow-hidden", className)}>
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: legacyObjectPosition?.trim() || "50% 50%" }}
          loading={imgLoading}
          decoding="async"
          onLoad={(e) => {
            const w = e.currentTarget.naturalWidth;
            const h = e.currentTarget.naturalHeight;
            if (w > 0 && h > 0) onNaturalMeasured?.(w, h);
          }}
        />
      </div>
    );
  }

  const layout =
    frame.w > 0 && frame.h > 0
      ? computeHeroLayout(frame.w, frame.h, iw, ih, zoom, panNormX, panNormY)
      : null;

  return (
    <div
      ref={shellRef}
      className={cn("relative h-full min-h-0 w-full overflow-hidden", className)}
    >
      {layout ? (
        <div
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{
            width: layout.scaledW,
            height: layout.scaledH,
            marginLeft: -layout.scaledW / 2,
            marginTop: -layout.scaledH / 2,
            transform: `translate(${layout.translateX}px, ${layout.translateY}px)`,
          }}
        >
          <img
            src={imageUrl}
            alt=""
            className="block max-w-none"
            width={Math.round(layout.scaledW)}
            height={Math.round(layout.scaledH)}
            draggable={false}
            loading={imgLoading}
            decoding="async"
          />
        </div>
      ) : (
        <div className="h-full w-full bg-white/5" aria-hidden />
      )}
    </div>
  );
}
