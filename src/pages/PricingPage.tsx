import { PricingCard } from "@/components/ui/PricingCard";
import { layout, type } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

export function PricingPage() {
  return (
    <div className={cn(layout.page, "py-12 sm:py-16")}>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="break-keep text-center text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-4xl">
          요금제
        </h1>
        <p className={cn("mt-3 sm:mt-4", type.sectionLead)}>
          사업자 플랜은 명함·통계·의뢰 한도 중심, 제작자 플랜은 노출과 알림 중심으로 구성했습니다.
        </p>
      </div>

      <h2 className="mt-12 text-lg font-semibold text-slate-900 sm:mt-16 sm:text-xl">사업자</h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        <PricingCard
          name="Free"
          priceLabel="₩0"
          description="개인·실험용"
          features={["공개 명함 1개", "기본 통계", "의뢰 1건"]}
          href="/signup"
          cta="무료 시작"
        />
        <PricingCard
          name="Starter"
          priceLabel="₩29,000"
          description="/월"
          features={["명함 3개", "클릭 로그 90일", "의뢰 5건"]}
          href="/signup"
          cta="Starter"
        />
        <PricingCard
          name="Pro"
          priceLabel="₩59,000"
          description="/월"
          features={["무제한 명함", "고급 통계", "의뢰 무제한", "우선 매칭"]}
          highlighted
          href="/signup"
          cta="Pro 구독"
        />
        <PricingCard
          name="Business"
          priceLabel="문의"
          description="팀·법인"
          features={["회사 관리자", "SSO 준비", "전담 온보딩", "API(로드맵)"]}
          href="/signup"
          cta="영업팀 문의"
        />
      </div>

      <h2 className="mt-14 text-lg font-semibold text-slate-900 sm:mt-20 sm:text-xl">제작자</h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <PricingCard
          name="Free"
          priceLabel="₩0"
          description="포트폴리오 등록"
          features={["기본 프로필", "월 5건 지원", "표준 노출"]}
          href="/signup"
          cta="가입하기"
        />
        <PricingCard
          name="Creator Plus"
          priceLabel="₩19,000"
          description="/월"
          features={["의뢰 알림", "프로필 강조", "지원서 템플릿"]}
          highlighted
          href="/signup"
          cta="Plus 시작"
        />
        <PricingCard
          name="Studio Pro"
          priceLabel="₩49,000"
          description="/월"
          features={["추천 슬롯", "분석 리포트", "우선 검증 배지"]}
          href="/signup"
          cta="Studio Pro"
        />
      </div>

      <p className="mt-10 text-center text-[15px] leading-relaxed text-slate-600 sm:mt-12 sm:text-base">
        성사 수수료는 의뢰 유형별로 상이하며, 체결 단계에서 안내합니다. (데모 앱에서는 UI만 제공)
      </p>
    </div>
  );
}
