import { PromotionMarketingPlansSection } from "@/components/pricing/PromotionMarketingPlansSection";
import { PricingCard } from "@/components/ui/PricingCard";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { layout, type } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { Video } from "lucide-react";
import { Link } from "react-router-dom";

/** 메인 `/` 의 `#pricing` 과 중복되지 않도록 구독 카드는 두지 않습니다. */
export function PricingPage() {
  return (
    <div className={cn(layout.page, "py-12 sm:py-16")}>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="break-keep text-center text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-4xl">
          요금·홍보 안내
        </h1>
        <p className={cn("mt-3 sm:mt-4", type.sectionLead)}>
          명함으로 고객이 들어오는 구조와 요금은 메인 페이지에서 먼저 안내됩니다. 무료·스타터·프로 비교는 한곳만
          유지합니다.
        </p>
        <Link
          to="/#pricing"
          className="mt-8 inline-flex min-h-[52px] w-full max-w-sm items-center justify-center rounded-xl bg-brand-800 px-6 text-base font-bold text-white shadow-md hover:bg-brand-900 sm:w-auto"
        >
          메인에서 플랜 비교하기
        </Link>
      </div>

      <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50/90 px-5 py-6 text-center sm:mt-16 sm:px-8 sm:py-8">
        <p className="text-base font-semibold text-slate-900">역할 구분</p>
        <ul className="mx-auto mt-4 max-w-xl space-y-2 text-left text-[15px] leading-relaxed text-slate-700 sm:text-base">
          <li>
            <span className="font-semibold text-slate-900">명함 고객</span> — 디지털 명함을 만들고 링크를 보내는 분
          </li>
          <li>
            <span className="font-semibold text-slate-900">홍보 파트너</span> — 블로그·영상 패키지 등 콘텐츠 홍보를 맡기는
            영역
          </li>
          <li>
            <span className="font-semibold text-slate-900">제작 전문가</span> — 명함·구조를 함께 잡아 주는 파트너
          </li>
        </ul>
      </div>

      <PromotionMarketingPlansSection className="mt-16 sm:mt-24" />

      <section className="mt-14 rounded-2xl border border-brand-900/20 bg-brand-950 px-5 py-10 text-white sm:mt-20 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <Video className="mx-auto h-10 w-10 text-brand-300" aria-hidden />
          <h2 className="mt-4 text-xl font-bold leading-snug sm:text-2xl">제작 전문가로 활동하기</h2>
          <p className="mt-3 text-base leading-relaxed text-white/90">
            포트폴리오를 등록하고 의뢰에 응답해 보세요. 아래는 플랫폼 이용 플랜 예시입니다.
          </p>
          <Link
            to="/signup"
            className={cn(
              "mx-auto mt-6 inline-flex min-h-12 w-full max-w-xs justify-center sm:w-auto",
              linkButtonClassName({ variant: "solidLight", size: "lg", className: "w-full sm:w-auto" }),
            )}
          >
            제작 전문가로 참여하기
          </Link>
        </div>
      </section>

      <h2 className="mt-14 text-lg font-semibold text-slate-900 sm:mt-20 sm:text-xl">제작 전문가 이용 플랜</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
        새 의뢰 알림·제안서 등 활동을 빠르게 잡을 때 참고하세요.
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
          name="제작 전문가 플러스"
          audience="제작 전문가용"
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
