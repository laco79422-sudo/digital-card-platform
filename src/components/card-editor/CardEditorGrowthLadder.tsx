import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";
import { Megaphone, GraduationCap, Sparkles, Users, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

type CardEditorGrowthLadderProps = {
  className?: string;
  feedback: string | null;
  onPaidActivate: () => void;
  onPromotionRequest: () => void;
  paidBusy: boolean;
};

export function CardEditorGrowthLadder({
  className,
  feedback,
  onPaidActivate,
  onPromotionRequest,
  paidBusy,
}: CardEditorGrowthLadderProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-brand-300/50 bg-gradient-to-b from-brand-50/90 via-white to-slate-50/80 px-4 py-6 shadow-md sm:px-6 sm:py-7",
        className,
      )}
    >
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-brand-800/90">
        명함 → 홍보 → 사람 → 교육 → 확산
      </p>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm font-semibold leading-relaxed text-slate-800 sm:text-base">
        단순 명함이 아니라,{" "}
        <span className="text-brand-900">명함을 중심으로 사람과 홍보가 연결되는 구조</span>예요.
      </p>

      <ul className="mx-auto mt-5 grid max-w-xl gap-2.5 text-left text-xs leading-relaxed text-slate-600 sm:text-sm">
        <li className="flex gap-2">
          <span className="mt-0.5 font-bold text-brand-700">①</span>
          <span>명함 제작으로 첫인상과 링크를 만듭니다.</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 font-bold text-brand-700">②</span>
          <span>홍보 풀·홍보 파트너와 연결되어 노출이 커집니다.</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 font-bold text-brand-700">③</span>
          <span>교육으로 공유 습관·전환 구조를 익혀 확산으로 이어집니다.</span>
        </li>
      </ul>

      <div className="mx-auto mt-6 flex max-w-xl flex-col gap-2.5">
        <Button
          type="button"
          size="lg"
          className="min-h-12 w-full justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 font-bold text-white hover:from-amber-500 hover:to-amber-600"
          onClick={onPaidActivate}
          loading={paidBusy}
        >
          <Wallet className="h-4 w-4 shrink-0" aria-hidden />
          이 명함 실제 사용하기 (유료)
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-slate-500">
          데모 환경에서는 결제가 시뮬레이션되며, 명함이 저장되고 공개가 켜집니다.
        </p>

        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full gap-2 border-brand-200/80 bg-white"
          onClick={onPromotionRequest}
        >
          <Megaphone className="h-4 w-4 shrink-0 text-brand-800" aria-hidden />
          홍보 요청하기
        </Button>
        <p className="text-center text-[11px] text-slate-500">
          생성된 명함을 홍보 풀에 올려 홍보 파트너에게 노출합니다.
        </p>

        <Link
          to="/promotion/partner"
          className={linkButtonClassName({
            variant: "secondary",
            size: "md",
            className: "min-h-11 w-full border-brand-200/80 bg-white font-medium",
          })}
        >
          <Users className="h-4 w-4 shrink-0 text-brand-800" aria-hidden />
          홍보 파트너로 참여하기
        </Link>
        <p className="text-center text-[11px] text-slate-500">
          참여 신청 후 홍보 풀 명함 목록을 보고 공유 활동을 이어갑니다.
        </p>

        <Link
          to="/promotion/guide"
          className={linkButtonClassName({
            variant: "outline",
            size: "md",
            className: "min-h-11 w-full border-brand-300/70 font-medium",
          })}
        >
          <GraduationCap className="h-4 w-4 shrink-0 text-brand-800" aria-hidden />
          홍보 교육 받기
        </Link>
        <p className="text-center text-[11px] text-slate-500">
          카카오톡 공유, 메시지 템플릿, 전환 구조, 명함 사용자·홍보 파트너 역할을 정리했어요.
        </p>
      </div>

      {feedback ? (
        <p
          className="mx-auto mt-4 max-w-lg rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2.5 text-center text-sm font-medium text-brand-950"
          role="status"
        >
          <Sparkles className="mr-1.5 inline-block h-4 w-4 align-text-bottom text-amber-600" aria-hidden />
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
