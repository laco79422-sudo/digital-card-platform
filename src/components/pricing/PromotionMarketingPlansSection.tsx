import { PricingCard } from "@/components/ui/PricingCard";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ArrowRight, CheckCircle2, Share2 } from "lucide-react";
import { useCallback, useState } from "react";

const FLOW_STEPS = ["결제", "제작", "콘텐츠 생성", "완료", "공유"] as const;

function FlowStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 sm:gap-3 sm:text-[15px]">
      {FLOW_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-800">{step}</span>
          {i < FLOW_STEPS.length - 1 ? (
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function OutcomePreviewDemo() {
  const [hint, setHint] = useState(false);

  const onKakao = useCallback(async () => {
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}/create-card` : "https://example.com/create-card";
    const r = await shareCardLinkNativeOrder({
      shareUrl,
      title: "린코 디지털 명함 · 홍보 패키지",
      shortMessage: "명함과 콘텐츠로 유입을 만드는 구조를 안내해 드려요.",
    });
    if (r === "clipboard") {
      setHint(true);
      window.setTimeout(() => setHint(false), 2800);
    }
  }, []);

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white p-5 shadow-md sm:mt-12 sm:p-7">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-emerald-900/80">제작 완료 후</p>
      <p className="mt-2 text-center text-base font-bold text-slate-900 sm:text-lg">고객 유입으로 이어지는 결과물</p>
      <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-slate-600">
        블로그·영상 등 <span className="font-semibold text-slate-800">홍보 파트너</span>가 만든 콘텐츠로 고객이 들어오는
        길을 넓힙니다.
      </p>
      <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-slate-800 sm:text-base">
        <li className="flex gap-3 rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <span>
            <span className="font-semibold">당신의 명함 링크</span>
            <span className="block text-sm font-normal text-slate-600">공유 한 번으로 바로 열리는 디지털 명함</span>
          </span>
        </li>
        <li className="flex gap-3 rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <span>
            <span className="font-semibold">블로그 게시</span>
            <span className="block text-sm font-normal text-slate-600">검색·링크 유입용 글 배포</span>
          </span>
        </li>
        <li className="flex gap-3 rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <span>
            <span className="font-semibold">영상(숏츠 등)</span>
            <span className="block text-sm font-normal text-slate-600">영상 채널로 도달 범위 확대</span>
          </span>
        </li>
      </ul>
      <div className="mt-6">
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 w-full gap-2 border-2 border-emerald-200/90 bg-white font-semibold hover:bg-emerald-50/80"
          onClick={() => void onKakao()}
        >
          <Share2 className="h-4 w-4 shrink-0" aria-hidden />
          카카오톡으로 보내기
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500">
          데모: 안내 링크가 공유되거나 클립보드로 복사될 수 있어요.
        </p>
        {hint ? (
          <p className="mt-2 text-center text-sm font-medium text-emerald-900">링크를 복사했어요. 카카오톡에 붙여넣어 보세요.</p>
        ) : null}
      </div>
    </div>
  );
}

type PromotionMarketingPlansSectionProps = {
  className?: string;
  /** 랜딩 등에서 플로우·데모 블록 숨김 */
  compact?: boolean;
};

export function PromotionMarketingPlansSection({ className, compact }: PromotionMarketingPlansSectionProps) {
  return (
    <section className={cn(className)}>
      <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">블로그·영상 홍보까지 맡길 수 있어요</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
        명함만으로 부족하다면, 블로그 글과 영상 콘텐츠로{" "}
        <span className="font-semibold text-slate-800">고객이 들어오는 길을 넓힐 수 있습니다</span>. 패키지는 기능 나열이
        아니라 <span className="font-semibold text-slate-800">홍보 파트너가 만들어 주는 결과물</span> 단위입니다.
      </p>

      {!compact ? (
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-5 sm:px-6 sm:py-6">
          <p className="text-center text-sm font-semibold text-slate-800">한 번의 여정</p>
          <div className="mt-4">
            <FlowStrip />
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <PricingCard
          name="기본 홍보"
          priceLabel="₩499,000"
          description="1회 패키지 · 상담 후 확정"
          features={["업종 소개글", "블로그 글 1건", "공유 메시지 제공"]}
          href="/signup?plan=promo-basic"
          cta="홍보 시작하기"
        />
        <PricingCard
          name="성장 홍보"
          priceLabel="₩899,000"
          description="1회 패키지 · 상담 후 확정"
          features={["업종 소개글", "블로그 글 3건", "유튜브 숏츠 1건"]}
          highlighted
          href="/signup?plan=promo-growth"
          cta="홍보 시작하기"
        />
        <PricingCard
          name="확산 패키지"
          priceLabel="₩1,490,000"
          description="1회 패키지 · 상담 후 확정"
          features={["업종 소개글", "블로그 글 5건", "유튜브 숏츠 2건", "공유 전략 제공"]}
          href="/signup?plan=promo-scale"
          cta="홍보 시작하기"
        />
      </div>

      {!compact ? <OutcomePreviewDemo /> : null}

      <p className="mt-8 text-center text-sm leading-relaxed text-slate-500">
        실제 금액·일정은 상담 후 확정됩니다. (데모 앱에서는 가입·문의 흐름만 연결됩니다.)
      </p>
    </section>
  );
}
