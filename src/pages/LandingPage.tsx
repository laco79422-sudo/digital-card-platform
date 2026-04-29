import { RewardAdsSection } from "@/components/reward-ads/RewardAdsSection";
import { LandingSampleCard, type LandingSampleType } from "@/components/landing/LandingSampleCard";
import { SiteLinkPreviewSeo } from "@/components/seo/SiteLinkPreviewSeo";
import { CreatorCard } from "@/components/ui/CreatorCard";
import { PricingCard } from "@/components/ui/PricingCard";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { useDevMountLog } from "@/dev/renderDiagnostics";
import { PRO_PLAN, STARTER_PLAN } from "@/data/businessCardPlans";
import { LANDING_FAQ, LANDING_TESTIMONIALS } from "@/data/sampleData";
import { layout, section, type } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import {
  ArrowRight,
  Check,
  Eye,
  IdCard,
  MessageCircle,
  MousePointerClick,
  Repeat,
  Share2,
  Users,
  Video,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

const CREATE_CARD_HREF = "/create-card";
const CREATE_SAMPLE_HREF = "/create-card?sample=true";
const LOGIN_SUCCESS_NOTICE = "로그인되었습니다. 이제 메인화면에서 명함 만들기와 내 공간을 이용할 수 있어요.";
const LANDING_SAMPLE_TYPES: Array<{ id: LandingSampleType; label: string }> = [
  { id: "personal", label: "개인형" },
  { id: "business", label: "사업자형" },
  { id: "store", label: "매장형" },
];

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
        "inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-xl px-6 text-base font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-cta-400 focus:ring-offset-2",
        variant === "gradient"
          ? "bg-gradient-to-r from-cta-500 to-cta-600 text-white ring-2 ring-cta-300/45 hover:from-cta-400 hover:to-cta-500 hover:ring-cta-200/70"
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
  const location = useLocation();
  const loginNotice =
    (location.state as { loginNotice?: string } | null)?.loginNotice ??
    (new URLSearchParams(location.search).get("login") === "success" ? LOGIN_SUCCESS_NOTICE : null);
  const [sampleType, setSampleType] = useState<LandingSampleType>("personal");
  const featuredCreatorIds = useAppDataStore((s) => s.featuredCreatorIds);
  const creators = useAppDataStore((s) => s.creators);
  const user = useAuthStore((s) => s.user);
  const featured = useMemo(
    () =>
      featuredCreatorIds
        .map((id) => creators.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [featuredCreatorIds, creators],
  );

  const expertItems = ["명함 제작", "블로그 홍보", "영상 콘텐츠 제작", "상담 구조 설계"] as const;

  const platformSteps = [
    { icon: IdCard, title: "명함 만들기", description: "업종 템플릿과 최소 입력으로 바로 시작합니다." },
    { icon: Share2, title: "바로 공유", description: "링크·홍보 문구를 복사해 카카오·당근·문자로 보냅니다." },
    { icon: Users, title: "고객 유입", description: "명함 링크로 문의와 방문이 이어집니다." },
    { icon: Repeat, title: "성과 보고 다시 공유", description: "조회·클릭·문의를 보고 더 넓게 다시 보냅니다." },
  ] as const;

  const whyLinkoItems = [
    "다음 행동이 끊기지 않게 안내합니다 — 만들고, 보내고, 숫자를 보고, 또 보냅니다",
    "내 공간에서 성과를 확인한 뒤 같은 자리에서 다시 공유할 수 있습니다",
    "업종별 템플릿으로 입력은 줄이고 공유는 빠르게 시작합니다",
  ] as const;

  const performanceMetrics = [
    { icon: Eye, label: "조회수" },
    { icon: MousePointerClick, label: "클릭수" },
    { icon: MessageCircle, label: "문의 수" },
    { icon: Users, label: "방문 수" },
  ] as const;

  return (
    <>
      <SiteLinkPreviewSeo />
      {loginNotice ? (
        <div className="border-b border-emerald-100 bg-emerald-50">
          <div className={cn(layout.page, "py-3")}>
            <p className="rounded-xl border border-emerald-200 bg-white/75 px-4 py-3 text-sm font-semibold text-emerald-900">
              {loginNotice}
            </p>
          </div>
        </div>
      ) : null}

      {!user ? (
        <section className="border-b border-slate-100 bg-slate-50/90">
          <div className={cn(layout.page, "py-5")}>
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm leading-relaxed text-slate-700">
                추천링크는 회원가입 후 자동으로 만들어집니다.
                <br />
                가입 후 나만의 링크로 린코를 소개할 수 있어요.
              </p>
              <Link
                to="/signup"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-cta-500 px-5 text-center text-sm font-bold text-white shadow-sm hover:bg-cta-600"
              >
                회원가입하고 추천링크 받기
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* 1. 강한 결과 + 메인 CTA */}
      <section className="hero-section">
        <div className={cn("relative z-10", layout.page, section.yHero)}>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="text-balance text-3xl font-extrabold leading-snug tracking-tight text-slate-950 sm:text-4xl md:text-[2.65rem]">
              명함 하나로 고객이 먼저 찾아옵니다
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base font-medium leading-relaxed text-slate-700 sm:mt-5 sm:text-lg">
              만들고 → 공유하고 → 성과를 보고 → 다시 공유합니다.
              <br className="hidden sm:block" />
              멈추지 않는 한 줄 흐름이에요.
            </p>

            <div className="mx-auto mt-8 w-full max-w-md sm:mt-10">
              <FlowCtaLink to={CREATE_CARD_HREF} className="max-w-none">
                내 명함 만들기
              </FlowCtaLink>
              <p className="mt-4 text-center text-sm text-slate-600">
                디자인까지 맡기고 싶다면{" "}
                <Link to="/request" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
                  제작 전문가 의뢰
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <RewardAdsSection placement="landing" />

      {/* 2. 플랫폼 설명 — 4단계 */}
      <section className={cn("border-b border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={cn(type.sectionTitleCenter, "text-slate-900")}>린코는 단순한 명함이 아닙니다</h2>
            <p className={cn("mx-auto mt-3 max-w-xl font-semibold text-brand-800 sm:text-lg")}>
              명함 만들기 → 공유 → 고객 유입 → 성과 확인 → 다시 공유
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-8">
            {platformSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center shadow-sm sm:p-6"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800 ring-1 ring-brand-200/80">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Step {index + 1}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. 왜 린코인가 */}
      <section className={cn("bg-slate-50", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={cn(type.sectionTitleCenter, "text-slate-900")}>왜 린코인가</h2>
            <ul className="mx-auto mt-8 max-w-lg space-y-4 text-left text-[15px] leading-relaxed text-slate-800 sm:mt-10 sm:text-base">
              {whyLinkoItems.map((line) => (
                <li key={line} className="flex gap-3 rounded-xl border border-white bg-white px-4 py-3 shadow-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. 성과 확인 */}
      <section className={cn("border-b border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={cn(type.sectionTitleCenter, "text-slate-900")}>내 명함 성과를 확인하세요</h2>
            <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-4 sm:gap-4">
              {performanceMetrics.map(({ icon: MetricIcon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50/90 px-3 py-5 shadow-sm"
                >
                  <MetricIcon className="h-8 w-8 text-brand-700" aria-hidden />
                  <p className="mt-3 text-sm font-bold text-slate-900 sm:text-base">{label}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-slate-700 sm:mt-10 sm:text-base">
              숫자를 확인한 뒤 같은 날 다시 공유할 수 있습니다. 행동과 결과가 바로 이어지도록 만들었습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 5. 명함 예시 — 서비스 설명과 분리 */}
      <section className={cn("bg-slate-50", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-brand-700">이렇게 만들어집니다</p>
            <h2 className={cn("mt-3", type.sectionTitleCenter)}>명함 예시</h2>
            <p className={cn("mx-auto mt-3 max-w-lg", type.sectionLead)}>
              설명이 아니라 실제로 보이게 될 결과를 먼저 확인하세요.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2" role="tablist" aria-label="명함 예시 유형">
              {LANDING_SAMPLE_TYPES.map((item) => {
                const selected = item.id === sampleType;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setSampleType(item.id)}
                    className={cn(
                      "min-h-10 rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                      selected
                        ? "border-brand-700 bg-brand-800 text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="mx-auto mt-6 w-full max-w-lg">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white/70 p-3 shadow-sm sm:p-4">
                <LandingSampleCard variant="hero" sampleType={sampleType} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 유료 전환 (제작 전문가) — 체험 이후 */}
      <section className={cn("border-y border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={cn(type.sectionTitleCenter)}>제작 전문가와 함께하면, 명함은 홍보가 됩니다</h2>
            <p className={cn("mt-3", type.sectionLead)}>
              명함 제작부터 블로그·영상 홍보까지 제작 전문가가 함께 설계합니다
            </p>
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
                  "inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-xl bg-cta-500 px-6 text-base font-bold text-white shadow-md shadow-cta-900/20 hover:bg-cta-600",
                )}
              >
                제작 전문가와 함께 진행하기
              </Link>
            </div>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-slate-500">
              가입 후 상담·맞춤 실행 단계로 이어집니다. (데모에서는 가입 화면으로 연결됩니다.)
            </p>
          </div>
        </div>
      </section>

      {/* 5. 이용 안내 — 무료 / 스타터 / 프로 선택 */}
      <section className={cn("bg-slate-50", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={type.sectionTitleCenter}>이용 안내</h2>
            <p className={cn("mt-2 sm:mt-3", type.sectionLead)}>
              비교표 대신, 지금 단계에 맞는 하나만 고르면 됩니다.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-8 sm:mt-12 lg:grid-cols-3 lg:gap-10">
            <PricingCard
              name="무료"
              priceLabel="₩0"
              tagline="가볍게 시작"
              features={["명함 1개 생성 가능", "방문·클릭 기본 기록", "간단한 문의 받기"]}
              recommendFor="디지털 명함을 처음 만들어 보고 싶은 분"
              href="/signup"
              cta="무료로 시작"
            />
            <PricingCard
              name={STARTER_PLAN.name}
              priceLabel={STARTER_PLAN.priceLabel}
              description={STARTER_PLAN.priceSuffix}
              tagline={STARTER_PLAN.tagline}
              features={[...STARTER_PLAN.features]}
              recommendFor={STARTER_PLAN.recommendFor}
              href={STARTER_PLAN.href}
              cta={STARTER_PLAN.cta}
            />
            <PricingCard
              name={PRO_PLAN.name}
              priceLabel={PRO_PLAN.priceLabel}
              description={PRO_PLAN.priceSuffix}
              tagline={PRO_PLAN.tagline}
              features={[...PRO_PLAN.features]}
              recommendFor={PRO_PLAN.recommendFor}
              highlighted
              href={PRO_PLAN.href}
              cta={PRO_PLAN.cta}
            />
          </div>

          <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm sm:mt-14">
            <p className="text-base font-semibold text-slate-900">팀·법인·맞춤 견적이 필요하신가요?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              같은 내용을 이용 안내 페이지에서도 확인할 수 있어요. 팀·법인은 페이지 하단 문의로 연결됩니다.
            </p>
            <Link
              to="/pricing"
              className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 sm:w-auto sm:min-w-[200px]"
            >
              문의·상세 안내 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 제작 전문가 목록 */}
      <section className={cn("border-b border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className={type.sectionTitle}>함께할 제작 전문가 (선택)</h2>
              <p className={cn("mt-2 max-w-xl", type.sectionLead)}>
                필요할 때 참고할 제작 전문가 목록입니다.
              </p>
            </div>
            <Link
              to="/creators"
              className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-slate-600 underline-offset-4 hover:text-brand-700 hover:underline"
            >
              제작 전문가 둘러보기 →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {featured.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <FlowCtaLink to={CREATE_CARD_HREF} className="max-w-md">
              내 명함 만들기
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
                제작 전문가로 참여하기
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
            <FlowCtaLink to={CREATE_SAMPLE_HREF} variant="outline" className="sm:max-w-lg">
              샘플로 체험하기
            </FlowCtaLink>
          </div>
        </div>
      </section>

      <section className={cn("border-t border-slate-200 bg-gradient-to-b from-brand-50/90 to-white", section.y)}>
        <div className={layout.page}>
          <div className="flex justify-center">
            <FlowCtaLink to={CREATE_CARD_HREF} className="max-w-md">
              내 명함 만들기
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
              내 명함 만들기
            </FlowCtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
