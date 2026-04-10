import { LandingSampleCard } from "@/components/landing/LandingSampleCard";
import { SiteLinkPreviewSeo } from "@/components/seo/SiteLinkPreviewSeo";
import { CreatorCard } from "@/components/ui/CreatorCard";
import { PricingCard } from "@/components/ui/PricingCard";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { useDevMountLog } from "@/dev/renderDiagnostics";
import { LANDING_FAQ, LANDING_TESTIMONIALS } from "@/data/sampleData";
import { layout, section, type } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import { ArrowRight, Check, Video } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";

const CREATE_CARD_HREF = "/create-card";
const CREATE_SAMPLE_HREF = "/create-card?sample=true";

function FlowCtaLink({
  to,
  children,
  className,
  variant = "gradient",
}: {
  to: string;
  children: ReactNode;
  className?: string;
  variant?: "gradient" | "outline";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-xl px-6 text-base font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2",
        variant === "gradient"
          ? "text-white ring-2 ring-brand-400/35 bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 hover:ring-brand-300/50"
          : "border-2 border-brand-600 bg-white text-brand-950 shadow-md hover:bg-brand-50",
        className,
      )}
    >
      {children}
      <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
    </Link>
  );
}

export function LandingPage() {
  useDevMountLog("LandingPage");
  const featuredCreatorIds = useAppDataStore((s) => s.featuredCreatorIds);
  const creators = useAppDataStore((s) => s.creators);
  const featured = useMemo(
    () =>
      featuredCreatorIds
        .map((id) => creators.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [featuredCreatorIds, creators],
  );

  const painItems = [
    "고객이 나를 기억하지 못합니다",
    "설명을 계속 반복해야 합니다",
    "연결이 이어지지 않습니다",
  ] as const;

  const expertItems = ["명함 제작", "블로그 홍보", "영상 콘텐츠 제작", "상담 구조 설계"] as const;

  return (
    <>
      <SiteLinkPreviewSeo />

      {/* 1. 강한 결과 + 메인 CTA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-brand-950 to-brand-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(96,165,250,0.2),_transparent_55%)]" />
        <div className={cn("relative", layout.page, section.yHero)}>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="text-balance text-3xl font-extrabold leading-snug tracking-tight text-white sm:text-4xl md:text-[2.65rem]">
              명함 하나로 고객이 먼저 찾아옵니다
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-slate-200 sm:mt-5 sm:text-lg">
              링크 하나로 소개하고, 연결되고, 상담까지 이어집니다
            </p>

            <div className="mt-8 w-full max-w-md sm:mt-10">
              <FlowCtaLink to={CREATE_CARD_HREF} className="w-full shadow-2xl ring-brand-400/40">
                지금 바로 명함 만들기
              </FlowCtaLink>
              <p className="mt-3 text-center text-sm text-slate-300">가입 없이 바로 체험 가능합니다</p>
            </div>

            <div className="mx-auto mt-8 w-full max-w-2xl sm:mt-10">
              <p className="sr-only">체험으로 직접 만들거나 전문가에게 맡길 수 있습니다</p>
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12">
                <Link
                  to={CREATE_CARD_HREF}
                  className="group flex flex-col gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950"
                >
                  <span
                    className={cn(
                      "inline-flex min-h-[52px] w-full items-center justify-center rounded-xl px-4 text-center text-sm font-bold leading-snug text-slate-900 shadow-md transition-colors sm:text-base",
                      "bg-white hover:bg-slate-100",
                    )}
                  >
                    내가 직접 만들어보기
                  </span>
                  <span className="text-center text-[13px] leading-snug text-slate-400 sm:text-sm">
                    샘플로 바로 체험하고 직접 수정할 수 있습니다
                  </span>
                </Link>
                <Link
                  to="/signup?intent=expert-structure"
                  className="group flex flex-col gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950"
                >
                  <span
                    className={cn(
                      "inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border-2 border-white/90 px-4 text-center text-sm font-bold leading-snug text-white shadow-inner transition-colors sm:text-base",
                      "bg-slate-950/75 hover:border-white hover:bg-slate-950/95",
                    )}
                  >
                    전문가에게 맡기기
                  </span>
                  <span className="text-center text-[13px] leading-snug text-slate-400 sm:text-sm">
                    명함 제작부터 홍보까지 전문가가 도와드립니다
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 문제 공감 + 해결 */}
      <section className={cn("border-b border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={cn(type.sectionTitleCenter, "text-slate-900")}>왜 필요한가</h2>
            <ul className="mx-auto mt-8 max-w-lg space-y-3 text-left">
              {painItems.map((line) => (
                <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-slate-800 sm:text-base">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-8 max-w-xl rounded-2xl border border-brand-200/80 bg-brand-50/80 px-5 py-4 text-base font-bold text-brand-950 sm:text-lg">
              이제는 링크 하나로 연결됩니다
            </p>
          </div>
          <div className="mt-10 flex justify-center sm:mt-12">
            <FlowCtaLink to={CREATE_CARD_HREF} variant="outline" className="sm:max-w-lg">
              이제 링크 하나로 시작하기
            </FlowCtaLink>
          </div>
        </div>
      </section>

      {/* 3. 체험 유도 + 샘플 미리보기 */}
      <section className={cn("bg-slate-50", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={cn(type.sectionTitleCenter)}>지금 바로 만들어보세요</h2>
            <p className={cn("mx-auto mt-3 max-w-lg", type.sectionLead)}>
              클릭하면 샘플이 자동으로 채워집니다
            </p>
            <div className="mt-8 flex justify-center">
              <FlowCtaLink to={CREATE_SAMPLE_HREF} variant="outline" className="max-w-md">
                샘플로 바로 만들어보기
              </FlowCtaLink>
            </div>
            <div className="mx-auto mt-10 w-full max-w-lg">
              <p className="text-sm font-semibold text-slate-700">디지털 명함 샘플 미리보기</p>
              <div className="mt-3">
                <LandingSampleCard variant="hero" />
              </div>
              <div className="mt-8 flex justify-center">
                <FlowCtaLink to={CREATE_SAMPLE_HREF} className="max-w-md">
                  이대로 내 명함 확인하기
                </FlowCtaLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 유료 전환 (전문가) — 체험 이후 */}
      <section className={cn("border-y border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={cn(type.sectionTitleCenter)}>혼자 만들면 오래 걸립니다</h2>
            <p className={cn("mt-3", type.sectionLead)}>전문가와 함께하면 바로 연결됩니다</p>
            <ul className="mx-auto mt-8 max-w-md space-y-2.5 text-left text-[15px] text-slate-800 sm:text-base">
              {expertItems.map((line) => (
                <li key={line} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex justify-center">
              <Link
                to="/signup?intent=expert-structure"
                className={cn(
                  "inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-xl bg-slate-900 px-6 text-base font-bold text-white shadow-md hover:bg-slate-800",
                )}
              >
                전문가와 함께 진행하기
              </Link>
            </div>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-slate-500">
              가입 후 상담·맞춤 실행 단계로 이어집니다. (데모에서는 가입 화면으로 연결됩니다.)
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-slate-200 bg-slate-50/90 px-5 py-6 text-center sm:px-8 sm:py-8">
            <p className="text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
              구조는 잡았습니다
              <br />
              이제 실행만 남았습니다
            </p>
            <p className="mt-4 text-sm font-medium text-brand-800 sm:text-base">
              명함 하나로 고객이 먼저 찾아옵니다
            </p>
          </div>

          <div className="mt-10 flex justify-center sm:mt-12">
            <FlowCtaLink to={CREATE_SAMPLE_HREF} variant="outline" className="sm:max-w-lg">
              샘플로 바로 만들어보기
            </FlowCtaLink>
          </div>
        </div>
      </section>

      {/* 5. 요금 미리보기 */}
      <section className={cn("bg-slate-50", section.y)}>
        <div className={layout.page}>
          <div className="text-center">
            <h2 className={type.sectionTitleCenter}>이용 안내</h2>
            <p className={cn("mt-2 sm:mt-3", type.sectionLead)}>자세한 비교는 이용 안내 페이지에서 확인하세요.</p>
            <Link
              to="/pricing"
              className="mt-4 inline-flex min-h-11 items-center justify-center text-base font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              전체 요금 보기 →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-3">
            <PricingCard
              name="스타터"
              audience="소규모 시작용"
              priceLabel="₩39,000"
              description="월"
              features={["명함 3개", "클릭 기록 90일 보관", "동시에 관리 가능한 의뢰 5건"]}
              href="/signup"
              cta="스타터 선택"
            />
            <PricingCard
              name="프로"
              audience="성장하는 브랜드"
              priceLabel="₩59,000"
              description="월"
              features={["명함 5개", "방문·클릭 기록", "버튼 클릭 흐름 보기"]}
              highlighted
              href="/signup"
              cta="프로 이용하기"
            />
            <PricingCard
              name="제작자 플러스"
              audience="제작자용"
              priceLabel="₩19,000"
              description="월"
              features={["새 의뢰 알림", "제안서 양식"]}
              href="/signup"
              cta="플러스 시작"
            />
          </div>
          <div className="mt-10 flex justify-center sm:mt-12">
            <Link
              to="/pricing"
              className="inline-flex min-h-11 items-center justify-center text-base font-semibold text-brand-800 underline-offset-4 hover:underline"
            >
              프로 플랜 자세히 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* 제작자 목록 */}
      <section className={cn("border-b border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className={type.sectionTitle}>함께할 제작자 (선택)</h2>
              <p className={cn("mt-2 max-w-xl", type.sectionLead)}>
                필요할 때 참고할 파트너 목록입니다.
              </p>
            </div>
            <Link
              to="/creators"
              className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-slate-600 underline-offset-4 hover:text-brand-700 hover:underline"
            >
              제작자 둘러보기 →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {featured.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <FlowCtaLink to={CREATE_CARD_HREF} className="max-w-md">
              지금 바로 명함 만들기
            </FlowCtaLink>
          </div>
        </div>
      </section>

      <section className={cn("bg-brand-950 py-12 text-white sm:py-16 lg:py-20")}>
        <div className={layout.page}>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
            <div>
              <Video className="h-10 w-10 text-brand-300" aria-hidden />
              <h2 className="mt-4 break-keep text-2xl font-bold leading-snug md:text-3xl">당신의 재능도 연결로</h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90">
                포트폴리오를 올리고 의뢰에 응답해 보세요.
              </p>
              <Link
                to="/signup"
                className={cn(
                  "mt-6 inline-flex w-full sm:w-auto",
                  linkButtonClassName({
                    variant: "solidLight",
                    size: "lg",
                    className: "w-full sm:w-auto",
                  }),
                )}
              >
                제작자로 참여하기
              </Link>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md sm:p-6">
              <p className="text-sm font-medium text-brand-100">이번 주 새 의뢰</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">128건</p>
              <p className="mt-4 text-sm leading-relaxed text-white/85">샘플 숫자입니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={cn("bg-white", section.y)}>
        <div className={layout.page}>
          <h2 className={type.sectionTitleCenter}>이야기들</h2>
          <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 md:grid-cols-3">
            {LANDING_TESTIMONIALS.map((t) => (
              <blockquote
                key={t.name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left sm:p-6"
              >
                <p className="text-[15px] leading-relaxed text-slate-800 sm:text-base">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-base font-semibold text-slate-900">{t.name}</footer>
                <p className="text-sm text-slate-600">{t.role}</p>
              </blockquote>
            ))}
          </div>
          <div className="mt-10 flex justify-center sm:mt-12">
            <FlowCtaLink to={CREATE_SAMPLE_HREF} variant="outline" className="border-white/40 bg-white/10 text-white ring-white/20 hover:bg-white/15 sm:max-w-lg">
              샘플로 체험하기
            </FlowCtaLink>
          </div>
        </div>
      </section>

      <section className={cn("bg-slate-50", section.y)}>
        <div className={layout.pageNarrow}>
          <h2 className={type.sectionTitleCenter}>자주 묻는 질문</h2>
          <dl className="mt-8 space-y-3 sm:mt-10 sm:space-y-4">
            {LANDING_FAQ.map((item) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <dt className="text-base font-semibold text-slate-900">{item.q}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-slate-700 sm:text-base">{item.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex justify-center">
            <FlowCtaLink to={CREATE_CARD_HREF} className="max-w-md">
              지금 바로 명함 만들기
            </FlowCtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
