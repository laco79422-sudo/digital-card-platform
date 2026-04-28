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
      <h3 className="text-center text-lg font-bold text-slate-900 sm:text-xl">이제 더 멀리 퍼지게 할 수 있습니다</h3>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-slate-600 sm:text-base">
        저장한 명함을 블로그, 영상, 공유 구조까지 확장할 수 있습니다. 제작 전문가와 함께하면 더 빠르게 고객 연결 구조를 만들 수
        있습니다.
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
