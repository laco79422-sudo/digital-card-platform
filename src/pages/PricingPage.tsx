import { PromotionMarketingPlansSection } from "@/components/pricing/PromotionMarketingPlansSection";
import { PricingCard } from "@/components/ui/PricingCard";
import { layout, type } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

export function PricingPage() {
  return (
    <div className={cn(layout.page, "py-12 sm:py-16")}>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="break-keep text-center text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-4xl">
          이용 안내
        </h1>
        <p className={cn("mt-3 sm:mt-4", type.sectionLead)}>
          요금은 숫자 나열이 아니라,{" "}
          <span className="font-semibold text-slate-800">지금 어떤 행동을 하게 될지</span>를 기준으로 골라 보세요.
          명함을 통해 고객이 먼저 연락하는 구조를 만듭니다.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/90 to-white px-5 py-5 shadow-sm sm:mt-12 sm:px-7 sm:py-6">
        <p className="text-base font-bold text-slate-900">💡 의뢰란?</p>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-700 sm:text-base">
          명함을 본 고객이 <span className="font-semibold text-slate-900">문의, 상담 요청, 제작 요청</span> 등을 보내는
          것을 의미합니다.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-700 sm:text-base">
          즉, 단순 방문이 아니라 <span className="font-semibold text-slate-900">실제로 연결이 시작되는 행동</span>
          입니다. 플랜마다 이런 의뢰를 <span className="font-semibold text-slate-900">동시에 몇 건까지 관리할지</span>가
          달라집니다.
        </p>
      </div>

      <h2 className="mt-12 text-lg font-semibold text-slate-900 sm:mt-16 sm:text-xl">사업자 · 명함</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
        개인·소규모는 스타터로 링크 공유를 시작하고, 방문·클릭·의뢰 응답이 늘면 프로까지 단계적으로 쓰기 좋아요.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <PricingCard
          name="무료"
          audience="가볍게 체험"
          priceLabel="₩0"
          description="시작해 보기"
          features={["공개 명함 1개(한 달 이용)", "방문·클릭 기본 기록", "동시에 관리 가능한 의뢰 1건"]}
          href="/signup"
          cta="무료로 시작"
        />
        <PricingCard
          name="공개 명함 1개 이용권"
          audience="한 달 이용권"
          priceLabel="월 14,900원"
          description="공개 명함 1개를 한 달 동안 이용할 수 있어요."
          features={[
            "공개 명함 1개",
            "한 달 동안 이용",
            "추천 공유로 무료 혜택 가능",
          ]}
          highlighted
          href="/signup"
          cta="14,900원으로 이용하기"
        />
        <PricingCard
          name="스타터"
          audience="소규모 시작용"
          priceLabel="₩39,000"
          description="월"
          features={[
            "명함 3개",
            "클릭 기록 90일 보관",
            "동시에 관리 가능한 의뢰 5건",
          ]}
          href="/signup"
          cta="스타터 선택"
        />
        <PricingCard
          name="프로"
          audience="성장하는 브랜드"
          priceLabel="₩59,000"
          description="월"
          features={[
            "명함 5개",
            "방문·클릭 기록",
            "버튼 클릭 흐름 보기",
            "의뢰 동시 관리 · 제한 없음",
            "연결 우선 안내",
          ]}
          highlighted
          href="/signup"
          cta="프로 이용하기"
        />
        <PricingCard
          name="비즈니스"
          audience="팀·법인"
          priceLabel="문의"
          description="맞춤 견적"
          features={["회사 관리자", "통합 로그인(준비 중)", "담당자 온보딩", "외부 연동 API(준비 중)"]}
          href="/signup"
          cta="문의하기"
        />
      </div>

      <PromotionMarketingPlansSection className="mt-16 sm:mt-24" />

      <h2 className="mt-14 text-lg font-semibold text-slate-900 sm:mt-20 sm:text-xl">제작자</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
        의뢰를 받아 수익을 내는 제작자는 플러스로{" "}
        <span className="font-medium text-slate-700">새 의뢰 알림·제안서</span> 흐름을 빠르게 잡을 수 있어요.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <PricingCard
          name="무료"
          audience="포트폴리오 시작"
          priceLabel="₩0"
          description="등록·기본 노출"
          features={["기본 프로필", "월 5건 제안", "일반 노출"]}
          href="/signup"
          cta="가입하기"
        />
        <PricingCard
          name="제작자 플러스"
          audience="제작자용"
          priceLabel="₩19,000"
          description="월"
          features={["새 의뢰 알림", "제안서 양식"]}
          highlighted
          href="/signup"
          cta="플러스 시작"
        />
        <PricingCard
          name="스튜디오 프로"
          audience="우선 노출·성장"
          priceLabel="₩49,000"
          description="월"
          features={["추천 자리", "활동 요약", "검증 배지 우선"]}
          href="/signup"
          cta="스튜디오 프로"
        />
      </div>

      <p className="mt-10 text-center text-[15px] leading-relaxed text-slate-600 sm:mt-12 sm:text-base">
        성사 수수료는 의뢰 유형별로 상이하며, 체결 단계에서 안내합니다. (데모 앱에서는 UI만 제공)
      </p>
    </div>
  );
}
