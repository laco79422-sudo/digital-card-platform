import { PromotionMarketingPlansSection } from "@/components/pricing/PromotionMarketingPlansSection";
import { PricingCard } from "@/components/ui/PricingCard";
import { layout, type } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function PricingPage() {
  return (
    <div className={cn(layout.page, "py-12 sm:py-16")}>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="break-keep text-center text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-4xl">
          이용 안내
        </h1>
        <p className={cn("mt-3 sm:mt-4", type.sectionLead)}>
          숫자 나열이 아니라,{" "}
          <span className="font-semibold text-slate-800">지금 어떤 행동을 하게 될지</span>를 기준으로 하나만 골라 보세요.
          명함으로 고객이 먼저 연락하는 구조를 만듭니다.
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
        비교표보다는 지금 단계에 맞는 하나만 고르면 됩니다.
      </p>
      <div className="mx-auto mt-8 grid max-w-6xl gap-8 lg:grid-cols-3 lg:gap-10">
        <PricingCard
          name="무료"
          priceLabel="₩0"
          tagline="가볍게 시작"
          features={["공개 명함 1개", "방문·클릭 기본 기록", "간단한 문의 받기"]}
          recommendFor="디지털 명함을 처음 만들어 보고 싶은 분"
          href="/signup"
          cta="무료로 시작"
        />
        <PricingCard
          name="스타터"
          priceLabel="₩14,900"
          description="/ 월"
          tagline="혼자 시작하기"
          features={[
            "명함·링크 공유에 맞는 구성",
            "의뢰·상담을 한곳에서 관리",
            "클릭 기록으로 반응 확인",
          ]}
          recommendFor="프리랜서·1인 사업으로 바로 시작하는 분"
          href="/signup"
          cta="스타터 선택"
        />
        <PricingCard
          name="프로"
          priceLabel="₩59,000"
          description="/ 월"
          tagline="고객을 만드는 구조"
          features={[
            "명함 여러 개·고객 흐름 한눈에",
            "방문부터 버튼 클릭까지 깊게 확인",
            "의뢰를 여유 있게 동시에 처리",
          ]}
          recommendFor="문의가 늘고 고객 동선을 체계적으로 잡고 싶은 분"
          highlighted
          href="/signup"
          cta="프로 시작하기"
        />
      </div>

      <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-slate-200 bg-slate-50/90 px-6 py-8 text-center sm:mt-14">
        <p className="text-base font-semibold text-slate-900">팀·법인·맞춤 견적이 필요하신가요?</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">별도 상담 후 견적과 도입 방식을 안내해 드립니다.</p>
        <Link
          to="/signup?intent=business"
          className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 sm:w-auto sm:min-w-[200px]"
        >
          문의하기
        </Link>
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
