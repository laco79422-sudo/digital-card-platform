import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type Props = {
  className?: string;
};

/** 정식 저장 직후 — 유료·홍보는 약하게, 흐름만 연결 */
export function PostSaveGrowthPanel({ className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/95 to-white px-5 py-6 shadow-sm sm:px-8 sm:py-8",
        className,
      )}
      role="region"
      aria-label="저장 후 다음 단계"
    >
      <h3 className="text-center text-lg font-bold text-slate-900 sm:text-xl">공유를 더 키우고 싶을 때</h3>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-slate-600 sm:text-base">
        지금은 계속 공유하는 것만으로도 고객 유입이 시작됩니다. 홍보 범위를 넓히려면 아래에서 다음 단계를 선택해 보세요.
      </p>
      <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
        <Link
          to="/signup?intent=expert-structure"
          className={cn(
            linkButtonClassName({ variant: "secondary", size: "lg" }),
            "min-h-[48px] w-full justify-center text-center",
          )}
        >
          홍보까지 맡기기
        </Link>
        <Link
          to="/promotion/guide"
          className={cn(
            linkButtonClassName({ variant: "outline", size: "lg" }),
            "min-h-[48px] w-full justify-center text-center",
          )}
        >
          블로그 홍보 시작하기
        </Link>
        <Link
          to="/education"
          className={cn(
            linkButtonClassName({ variant: "outline", size: "lg" }),
            "min-h-[48px] w-full justify-center text-center",
          )}
        >
          영상 제작 연결하기
        </Link>
        <Link
          to="/pricing"
          className={cn(
            linkButtonClassName({ variant: "primary", size: "lg" }),
            "min-h-[48px] w-full justify-center text-center",
          )}
        >
          프로 플랜 보기
        </Link>
      </div>
    </div>
  );
}
