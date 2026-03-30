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
          사업자는 명함·방문 기록·의뢰 한도 중심으로, 제작자는 프로필 노출과 알림 중심으로 안내드려요.
        </p>
      </div>

      <h2 className="mt-12 text-lg font-semibold text-slate-900 sm:mt-16 sm:text-xl">사업자</h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        <PricingCard
          name="무료"
          priceLabel="₩0"
          description="개인·가볍게 써보기"
          features={["공개 명함 1개", "방문·클릭 기본 기록", "의뢰 1건"]}
          href="/signup"
          cta="무료로 시작"
        />
        <PricingCard
          name="스타터"
          priceLabel="₩29,000"
          description="월"
          features={["명함 3개", "클릭 기록 90일 보관", "의뢰 5건"]}
          href="/signup"
          cta="스타터 선택"
        />
        <PricingCard
          name="프로"
          priceLabel="₩59,000"
          description="월"
          features={["명함 개수 제한 없음", "활동 기록 자세히", "의뢰 제한 없음", "연결 우선 안내"]}
          highlighted
          href="/signup"
          cta="프로 이용하기"
        />
        <PricingCard
          name="비즈니스"
          priceLabel="문의"
          description="팀·법인"
          features={["회사 관리자", "통합 로그인(준비 중)", "담당자 온보딩", "외부 연동 API(준비 중)"]}
          href="/signup"
          cta="문의하기"
        />
      </div>

      <h2 className="mt-14 text-lg font-semibold text-slate-900 sm:mt-20 sm:text-xl">제작자</h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <PricingCard
          name="무료"
          priceLabel="₩0"
          description="포트폴리오 등록"
          features={["기본 프로필", "월 5건 제안", "일반 노출"]}
          href="/signup"
          cta="가입하기"
        />
        <PricingCard
          name="제작자 플러스"
          priceLabel="₩19,000"
          description="월"
          features={["새 의뢰 알림", "프로필 강조", "제안서 양식"]}
          highlighted
          href="/signup"
          cta="플러스 시작"
        />
        <PricingCard
          name="스튜디오 프로"
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
