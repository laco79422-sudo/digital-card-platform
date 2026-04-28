import { CaseSection } from "@/components/education/CaseSection";
import { CTASection } from "@/components/education/CTASection";
import { EducationForm } from "@/components/education/EducationForm";
import { EducationSeo } from "@/components/education/EducationSeo";
import { HeroSection } from "@/components/education/HeroSection";
import { InstructorForm } from "@/components/education/InstructorForm";
import { ProcessSection } from "@/components/education/ProcessSection";
import { RevenueFlowSection } from "@/components/education/RevenueFlowSection";
import { TeachingMethodSection } from "@/components/education/TeachingMethodSection";
import { layout } from "@/lib/ui-classes";

/**
 * 유입(Hero·사례) → 신뢰(수익 구조·과정·방식) → 신청(교육/강사 폼) → 참여(하단 CTA)
 */
export function EducationPage() {
  return (
    <>
      <EducationSeo />
      <div className="pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <HeroSection />
        <section className="border-b border-slate-200 bg-white py-6 sm:py-8">
          <div className={layout.page}>
            <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-slate-600 sm:text-base">
              사례와 수익 흐름을 확인한 뒤, 교육 참여 또는 강사 홍보 파트너로 참여할 수 있습니다. 스크롤하여
              신청서까지 이어지는 구조입니다.
            </p>
          </div>
        </section>
        <CaseSection />
        <RevenueFlowSection />
        <ProcessSection />
        <TeachingMethodSection />
        <EducationForm />
        <InstructorForm />
      </div>
      <CTASection />
    </>
  );
}
