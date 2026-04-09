/** 명함 히어로 프레임 가로:세로 (고정) */
export const BRAND_HERO_FRAME_RATIO = "16:9";
export const BRAND_HERO_ASPECT = 16 / 9;

export const BRAND_HERO_MIN_ZOOM = 1;
export const BRAND_HERO_MAX_ZOOM = 2.75;

/** 전체 이미지가 프레임 안에 들어가도록 하는 기준 배율(contain) */
export function computeContainFit(frameW: number, frameH: number, iw: number, ih: number): number {
  if (frameW <= 0 || frameH <= 0 || iw <= 0 || ih <= 0) return 1;
  return Math.min(frameW / iw, frameH / ih);
}

export function clampZoom(z: number): number {
  return Math.min(BRAND_HERO_MAX_ZOOM, Math.max(BRAND_HERO_MIN_ZOOM, z));
}

export type HeroLayout = {
  scaledW: number;
  scaledH: number;
  translateX: number;
  translateY: number;
  maxPanX: number;
  maxPanY: number;
  fit: number;
  zoom: number;
};

export function computeHeroLayout(
  frameW: number,
  frameH: number,
  iw: number,
  ih: number,
  zoom: number,
  panNormX: number,
  panNormY: number,
): HeroLayout {
  const fit = computeContainFit(frameW, frameH, iw, ih);
  const z = clampZoom(zoom);
  const scaledW = iw * fit * z;
  const scaledH = ih * fit * z;
  const maxPanX = Math.max(0, (scaledW - frameW) / 2);
  const maxPanY = Math.max(0, (scaledH - frameH) / 2);
  const translateX = maxPanX > 0 ? panNormX * maxPanX : 0;
  const translateY = maxPanY > 0 ? panNormY * maxPanY : 0;
  return { scaledW, scaledH, translateX, translateY, maxPanX, maxPanY, fit, zoom: z };
}

export function clampPanNorm(
  panX: number,
  panY: number,
  frameW: number,
  frameH: number,
  iw: number,
  ih: number,
  zoom: number,
): { x: number; y: number } {
  const { maxPanX, maxPanY } = computeHeroLayout(frameW, frameH, iw, ih, zoom, 0, 0);
  return {
    x: maxPanX > 0 ? Math.max(-1, Math.min(1, panX)) : 0,
    y: maxPanY > 0 ? Math.max(-1, Math.min(1, panY)) : 0,
  };
}
