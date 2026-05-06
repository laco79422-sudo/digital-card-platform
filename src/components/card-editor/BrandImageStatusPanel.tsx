import { Badge } from "@/components/ui/Badge";
import {
  brandImageStatusBadgeLabel,
  brandImageStatusBadgeTone,
  normalizeBrandImageStatus,
} from "@/lib/brandImageStatus";
import { cn } from "@/lib/utils";

export function BrandImageStatusPanel({
  status,
  rejectReason,
  className,
}: {
  status: string | null | undefined;
  rejectReason?: string | null;
  className?: string;
}) {
  const n = normalizeBrandImageStatus(status == null ? null : String(status));
  const label = brandImageStatusBadgeLabel(n);
  if (!label) return null;

  const tone = brandImageStatusBadgeTone(n);
  const reason = rejectReason?.trim();

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-3 sm:px-4",
        tone === "danger" && "border-red-200 bg-red-50/80",
        tone === "warning" && "border-amber-200 bg-amber-50/70",
        tone === "success" && "border-emerald-200 bg-emerald-50/70",
        tone === "brand" && "border-brand-200 bg-brand-50/60",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-600">검수 상태</span>
        <Badge tone={tone === "default" ? "default" : tone}>{label}</Badge>
      </div>
      {reason ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-800">
          {n === "rejected_manual" || n === "rejected_auto" ? (
            <>
              <span className="font-medium">사유: </span>
              {reason}
            </>
          ) : (
            reason
          )}
        </p>
      ) : null}
      {n === "pending_review" ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          관리자 검토 후 공개 명함에 반영됩니다. 승인 전까지는 이전에 승인된 이미지 또는 기본 이미지가 보일 수 있습니다.
        </p>
      ) : null}
      {n === "approved" ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-600">공개 명함에 현재 이미지가 표시됩니다.</p>
      ) : null}
    </div>
  );
}
