import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";

export type FirstCheckStatus = "idle" | "checking" | "passed" | "failed";
export type SecondCheckStatus = "idle" | "passed";
export type ImageSaveStatus = "idle" | "saving" | "saved" | "failed";

export type LineStatus = "idle" | "pending" | "pass" | "fail";

function formatLineIcon(status: LineStatus) {
  if (status === "pending") return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-500" aria-hidden />;
  if (status === "pass") return <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />;
  if (status === "fail") return <X className="h-4 w-4 shrink-0 text-red-600" aria-hidden />;
  return <span className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-300" aria-hidden />;
}

export type BrandImageTwoStepFlowProps = {
  /** 선택된 원본 파일 — 없으면 [2][3] 숨김 */
  imageFile: File | null;
  /** 1차 통과 후 미리보기 URL(object URL 등) */
  previewUrl: string | null;
  firstCheckStatus: FirstCheckStatus;
  secondCheckStatus: SecondCheckStatus;
  imageSaveStatus: ImageSaveStatus;
  imageErrorMessage: string | null;
  lineFormat: LineStatus;
  lineSize: LineStatus;
  lineExists: LineStatus;
  linePreview: LineStatus;
  secondAck: boolean;
  onSecondAckChange: (v: boolean) => void;
  onConfirmApply: () => void;
  onCancelSelection: () => void;
  compact?: boolean;
};

/**
 * [2] 1차 검사 · [3] 2차 검증 · [4] 저장 결과
 * `imageFile`이 비어도 `imageSaveStatus`가 idle이 아니면 [4]만 표시합니다.
 */
export function BrandImageTwoStepFlow({
  imageFile,
  previewUrl,
  firstCheckStatus,
  secondCheckStatus,
  imageSaveStatus,
  imageErrorMessage,
  lineFormat,
  lineSize,
  lineExists,
  linePreview,
  secondAck,
  onSecondAckChange,
  onConfirmApply,
  onCancelSelection,
  compact = false,
}: BrandImageTwoStepFlowProps) {
  const showFirstBlock = Boolean(imageFile);
  const showFinal = imageSaveStatus !== "idle";

  if (!showFirstBlock && !showFinal) return null;

  const showSecond = showFirstBlock && firstCheckStatus === "passed";
  const saving = imageSaveStatus === "saving";

  return (
    <div className={cn("space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5", compact && "p-3 sm:p-4")}>
      {showFirstBlock ? (
        <>
          <div>
            <h3 className="text-sm font-bold text-slate-900">[2] 1차 검사 결과</h3>
            <p className="mt-1 text-xs text-slate-500">형식·용량·파일·미리보기 생성 가능 여부를 확인합니다.</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                {formatLineIcon(lineFormat)}
                <span className={lineFormat === "fail" ? "text-red-700" : "text-slate-700"}>
                  형식: JPG / JPEG / PNG / WEBP
                  {lineFormat === "pass" ? " — 통과" : lineFormat === "fail" ? " — 실패" : lineFormat === "pending" ? " — 확인 중" : ""}
                </span>
              </li>
              <li className="flex items-center gap-2">
                {formatLineIcon(lineSize)}
                <span className={lineSize === "fail" ? "text-red-700" : "text-slate-700"}>
                  용량: 5MB 이하
                  {lineSize === "pass" ? " — 통과" : lineSize === "fail" ? " — 실패" : lineSize === "pending" ? " — 확인 중" : ""}
                </span>
              </li>
              <li className="flex items-center gap-2">
                {formatLineIcon(lineExists)}
                <span className={lineExists === "fail" ? "text-red-700" : "text-slate-700"}>
                  파일 존재
                  {lineExists === "pass" ? " — 통과" : lineExists === "fail" ? " — 실패" : lineExists === "pending" ? " — 확인 중" : ""}
                </span>
              </li>
              <li className="flex items-center gap-2">
                {formatLineIcon(linePreview)}
                <span className={linePreview === "fail" ? "text-red-700" : "text-slate-700"}>
                  미리보기 가능
                  {linePreview === "pass" ? " — 통과" : linePreview === "fail" ? " — 실패" : linePreview === "pending" ? " — 확인 중" : ""}
                </span>
              </li>
            </ul>
            {firstCheckStatus === "checking" ? (
              <p className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                1차 검사 진행 중…
              </p>
            ) : null}
            {firstCheckStatus === "passed" ? (
              <p className="mt-2 text-sm font-semibold text-emerald-800">1차 검사 완료</p>
            ) : null}
            {firstCheckStatus === "failed" && imageErrorMessage ? (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{imageErrorMessage}</p>
            ) : null}
            {firstCheckStatus === "failed" ? (
              <div className="mt-3">
                <Button type="button" variant="outline" size="sm" onClick={onCancelSelection}>
                  선택 취소
                </Button>
              </div>
            ) : null}
          </div>

          {showSecond ? (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-900">[3] 2차 검증</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                명함·프로필·작품 소개 등 <strong className="font-semibold text-slate-800">공개 노출</strong>에 쓰일 이미지인지 확인해 주세요.
                초상·타인 권리 침해·과도한 텍스트·선정성 등은 검수에서 반려될 수 있습니다.
              </p>
              {previewUrl ? (
                <div className={cn("mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100", compact ? "max-h-48" : "max-h-80")}>
                  <img src={previewUrl} alt="선택한 이미지 미리보기" className="mx-auto max-h-full w-full object-contain" />
                </div>
              ) : null}
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-brand-600"
                  checked={secondAck}
                  onChange={(e) => onSecondAckChange(e.target.checked)}
                />
                <span>이 이미지로 등록해도 괜찮습니다</span>
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  disabled={!secondAck || saving || secondCheckStatus === "passed"}
                  onClick={onConfirmApply}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      저장 중…
                    </>
                  ) : (
                    "2차 검증 완료 후 저장하기"
                  )}
                </Button>
                <Button type="button" variant="outline" size="sm" className="min-h-11" disabled={saving} onClick={onCancelSelection}>
                  선택 취소
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {showFinal ? (
        <div className={cn(!showFirstBlock ? "" : "border-t border-slate-100 pt-4")}>
          <h3 className="text-sm font-bold text-slate-900">[4] 최종 저장 결과</h3>
          {imageSaveStatus === "saving" ? (
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              이미지를 반영하는 중입니다…
            </p>
          ) : null}
          {imageSaveStatus === "saved" ? (
            <p className="mt-2 text-sm font-medium text-emerald-800">이미지 반영이 완료되었습니다. 명함 미리보기에서 확인해 주세요.</p>
          ) : null}
          {imageSaveStatus === "failed" ? (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {imageErrorMessage ?? "저장에 실패했습니다."}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
