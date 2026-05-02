import { RewardAdsSection } from "@/components/reward-ads/RewardAdsSection";
import { LandingSampleCard, type LandingSampleType } from "@/components/landing/LandingSampleCard";
import { PromotionMarketingPlansSection } from "@/components/pricing/PromotionMarketingPlansSection";
import { SiteLinkPreviewSeo } from "@/components/seo/SiteLinkPreviewSeo";
import { CreatorCard } from "@/components/ui/CreatorCard";
import { PricingCard } from "@/components/ui/PricingCard";
import { useDevMountLog } from "@/dev/renderDiagnostics";
import { useReferralSignupCta } from "@/hooks/useReferralSignupCta";
import { PRO_PLAN, STARTER_PLAN } from "@/data/businessCardPlans";
import { LANDING_FAQ, LANDING_TESTIMONIALS } from "@/data/sampleData";
import { layout, section, type } from "@/lib/ui-classes";
import { canonicalSiteOrigin } from "@/lib/siteOrigin";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import {
  ArrowRight,
  CalendarDays,
  IdCard,
  Megaphone,
  MessageCircle,
  PenSquare,
  Send,
  Share2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

const CREATE_CARD_HREF = "/create-card";
const LOGIN_SUCCESS_NOTICE = "로그인되었습니다. 이제 메인화면에서 명함 만들기와 내 공간을 이용할 수 있어요.";
const REF_LINK_FORMAT = "https://linkoapp.kr/?ref=내코드";

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
  const { signupPrimaryLabel } = useReferralSignupCta();
  const freeSignupCtaLabel = `무료로 ${signupPrimaryLabel}`;
  const featured = useMemo(
    () =>
      featuredCreatorIds
        .map((id) => creators.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [featuredCreatorIds, creators],
  );

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "") || "/";
    if (path !== "/" || location.hash !== "#pricing") return;
    const el = document.getElementById("pricing");
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.pathname, location.hash]);

  const openReferralLinkPreview = () => {
    const url = `${canonicalSiteOrigin()}/`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const inboundFlowSteps = [
    {
      icon: IdCard,
      title: "명함 생성",
      description: "한눈에 보이는 이미지 명함이 완성됩니다.",
    },
    {
      icon: PenSquare,
      title: "상세 내용 작성",
      description: "클릭하면 더 자세한 정보가 보여, 고객이 관심을 키울 수 있습니다.",
    },
    {
      icon: Share2,
      title: "링크 전달",
      description: "카톡, 당근, 블로그 등 받는 사람에게 알리기 편하게 공유합니다.",
    },
    {
      icon: Users,
      title: "고객 유입",
      description: "명함을 본 사람이 업무와 연결된다는 느낌까지 갖게 됩니다.",
    },
    {
      icon: MessageCircle,
      title: "문의 발생",
      description: "고객이 먼저 연락을 시작합니다.",
    },
    {
      icon: CalendarDays,
      title: "상담 진행",
      description: "실제 상담·예약까지 이어집니다.",
    },
  ] as const;

  const deliveryMethods = [
    {
      icon: Send,
      eyebrow: "① 직접 전달",
      title: "내가 채널에 올립니다",
      badge: "기본 이용",
      points: [
        "카카오·당근 피드에 붙여도 바로 확인됩니다",
        "블로그·유튜브 설명란에 넣으면 새 유입으로 이어집니다",
        "링크 하나로 동일하게 연결되어 추적이 간단합니다",
      ],
      moreHref: undefined,
      moreLabel: undefined,
    },
    {
      icon: Megaphone,
      eyebrow: "② 확산 전달",
      title: "가입된 홍보 주체가 채널을 활용합니다",
      badge: "유료 기능",
      points: [
        "노출이 더 필요할 때 채널을 묶어 도달 폭을 넓힐 수 있습니다",
        "블로그·영상 같은 결과물로 검색과 공유까지 이어질 수 있습니다",
        "패키지는 아래 확산 안내와 연결됩니다",
      ],
      moreHref: "#promotion-packages",
      moreLabel: "홍보·확산 패키지 보기",
    },
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

      <section className="hero-section">
        <div className={cn("relative z-10", layout.page, section.yHero)}>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="text-balance text-center text-4xl font-bold leading-snug tracking-tight text-slate-950 sm:text-4xl md:text-[2.65rem]">
              만들고 보내기만 하면
              <br className="sm:hidden" />{" "}
              <span className="sm:whitespace-nowrap">고객의 문의가 시작됩니다</span>
            </h1>
            <p className="mt-5 text-center text-lg font-medium leading-relaxed text-slate-800">
              명함을 보내면 고객이 보고,
              <br className="sm:hidden" /> 먼저 연락이 옵니다.
            </p>

            <div className="mt-8 flex w-full justify-center px-4">
              <Link
                to={CREATE_CARD_HREF}
                className={cn(
                  "inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-xl bg-orange-500 px-10 py-4 text-lg font-bold text-white shadow-md transition-colors hover:bg-orange-600",
                  "focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2",
                )}
              >
                3초 만에 내 명함 만들기
                <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
              </Link>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600 sm:text-base">
              <Link
                to="/request"
                className="font-semibold text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline"
              >
                혼자 만들기 어렵다면 전문가가 도와드려요
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* 명함 예시 (히어로 바로 아래) */}
      <section className={cn("border-b border-slate-200 bg-slate-50", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-brand-700">명함 예시</p>
            <h2 className={cn("mt-3", type.sectionTitleCenter)}>실제로 어떻게 보이는지 바로 확인해 보세요</h2>
            <p className={cn("mx-auto mt-3 max-w-lg font-medium text-slate-600", type.sectionLead)}>
              유형만 바꿔 보면 내 상황에 맞는 형태를 빠르게 떠올릴 수 있습니다.
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
            <div className="mt-8 flex justify-center">
              <FlowCtaLink to={CREATE_CARD_HREF} className="max-w-md">
                내 명함 만들어보기
              </FlowCtaLink>
            </div>
          </div>
        </div>
      </section>

      {/* 고객 유입 흐름 */}
      <section className={cn("border-b border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={cn(type.sectionTitleCenter, "text-slate-900")}>
              명함을 본 고객이 문의까지 이어지는 과정
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              한 번 만든 구조로 초대부터 후속 연락까지 이어져, 매번 새 페이지를 짤 필요가 줄어듭니다.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-6xl gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
            {inboundFlowSteps.map((step, index) => {
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
          <div className="mt-10 flex justify-center lg:mt-12">
            <FlowCtaLink to={CREATE_CARD_HREF} className="max-w-md">
              나도 시작해보기
            </FlowCtaLink>
          </div>
        </div>
      </section>

      {/* 명함 전달 방식 */}
      <section id="delivery" className={cn("border-b border-slate-200 bg-slate-50/80", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={cn(type.sectionTitleCenter, "text-slate-900")}>명함 전달은 두 가지입니다</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              먼저는 직접 보내도 되고, 더 넓히고 싶을 때 확산 옵션을 덧붙이면 됩니다.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:mt-11 lg:grid-cols-2 lg:gap-8">
            {deliveryMethods.map((block) => {
              const Icon = block.icon;
              return (
                <div
                  key={block.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-900 ring-1 ring-brand-200/80">
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{block.eyebrow}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-baseline gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{block.title}</h3>
                    <span
                      className={cn(
                        "rounded-full px-3 py-0.5 text-xs font-bold",
                        block.badge === "유료 기능"
                          ? "bg-amber-100 text-amber-950 ring-1 ring-amber-200/80"
                          : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/70",
                      )}
                    >
                      {block.badge}
                    </span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-left text-[15px] leading-relaxed text-slate-700 sm:text-base">
                    {block.points.map((point) => (
                      <li
                        key={point}
                        className="relative pl-4 before:absolute before:left-0 before:top-[0.65em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-brand-500"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                  {block.moreHref ? (
                    <p className="mt-6 text-center lg:text-left">
                      <a
                        href={block.moreHref}
                        className="text-sm font-bold text-brand-800 underline-offset-4 hover:text-brand-950 hover:underline"
                      >
                        {block.moreLabel ?? ""}
                      </a>
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 추천 성과 · 내가 추천할 링크 */}
      <section className={cn("border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={cn(type.sectionTitleCenter, "text-slate-900")}>내가 추천할 링크</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-slate-700">
              이 링크로 지인을 초대하면 린코 가입·이용이 추천 성과로 남습니다.
              <br />
              유료 확산(파트너·채널 홍보)은 아래 홍보 패키지 흐름과 연결될 수 있어요.
            </p>
            <div className="mx-auto mt-8 grid max-w-md gap-3 text-left sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm text-slate-600">14,900원 결제 시</p>
                <p className="text-lg font-bold text-brand-900">1,490원 적립</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm text-slate-600">59,000원 결제 시</p>
                <p className="text-lg font-bold text-brand-900">5,900원 적립</p>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-slate-600">
              가입 후에만 내 추천 주소를 만들 수 있어요. 지인에게 보여 주는 화면은 일반 메인과 같으며, 주소에 포함된 코드만
              내부적으로 연결됩니다.
            </p>
            <p className="mx-auto mt-3 break-all rounded-xl border border-brand-200 bg-white px-4 py-3 font-mono text-sm text-slate-800">
              {REF_LINK_FORMAT}
            </p>
            <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => openReferralLinkPreview()}
                className={cn(
                  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-6 text-base font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-cta-400 focus:ring-offset-2",
                  "bg-gradient-to-r from-cta-500 to-cta-600 text-white ring-2 ring-cta-300/45 hover:from-cta-400 hover:to-cta-500",
                )}
              >
                추천 링크 확인하기
                <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
              </button>
              {user ? (
                <FlowCtaLink to="/dashboard" variant="outline" className="max-w-md sm:w-auto sm:flex-1">
                  내 공간에서 링크 복사
                </FlowCtaLink>
              ) : (
                <FlowCtaLink to="/signup" variant="outline" className="max-w-md sm:w-auto sm:flex-1">
                  가입하고 링크 받기
                </FlowCtaLink>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className={cn("border-b border-slate-200 bg-white", section.y)}>
          <div className={layout.page}>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className={type.sectionTitleCenter}>명함 만들기는 무료, 확산만 유료 선택</h2>
              <p className={cn("mt-3 text-pretty sm:mt-4", type.sectionLead)}>
                명함 생성·직접 전달은 무료 플랜으로 시작합니다.
                <br />
                더 넓게 퍼트리려면 홍보·확산 같은 유료 옵션을 골라 쓰면 됩니다.
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
                cta={`무료로 ${signupPrimaryLabel}`}
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
          </div>
        </section>

      {/* 블로그·영상 홍보 패키지 (확산 전달 연계) */}
      <section id="promotion-packages" className={cn("bg-slate-50 scroll-mt-[5.25rem]", section.y)}>
          <div className={layout.page}>
            <PromotionMarketingPlansSection compact />
          </div>
        </section>

      {/* 7. 제작 전문가 */}
      <section className={cn("border-y border-slate-200 bg-white", section.y)}>
          <div className={layout.page}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={cn(type.sectionTitleCenter, "text-balance")}>
                혼자 만들기 어렵다면 전문가가 대신 만들어드립니다
              </h2>
              <p className={cn("mx-auto mt-4 max-w-xl", type.sectionLead)}>
                명함 제작부터 블로그·영상 홍보까지,
                <br />
                전문가가 고객이 들어오는 구조로 도와드립니다.
              </p>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
                제작 전문가는 명함·구조를 함께 잡아 주는 분이고, 블로그·숏츠 패키지는 위 섹션의 유료 홍보 서비스와
                조합할 수 있어요.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <FlowCtaLink to="/request" className="max-w-xs sm:max-w-sm">
                  전문가에게 맡기기
                </FlowCtaLink>
                <FlowCtaLink to="/creators" variant="outline" className="max-w-xs sm:max-w-sm">
                  제작 전문가와 상담하기
                </FlowCtaLink>
              </div>
            </div>

            <div className="mx-auto mt-14 max-w-6xl border-t border-slate-100 pt-12">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">함께할 제작 전문가</h3>
                  <p className={cn("mt-2 max-w-xl text-[15px] text-slate-600 sm:text-base")}>
                    결과물을 만들어 드리는 제작 전문가 목록입니다. (홍보 파트너의 패키지 상품과 역할이 다릅니다.)
                  </p>
                </div>
                <Link
                  to="/creators"
                  className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-slate-600 underline-offset-4 hover:text-brand-700 hover:underline"
                >
                  전체 보기 →
                </Link>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {featured.map((c) => (
                  <CreatorCard key={c.id} creator={c} />
                ))}
              </div>
            </div>
          </div>
        </section>

      {/* 8. 후기 */}
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
          </div>
        </section>

      {/* 9. FAQ */}
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
              <FlowCtaLink to="/signup" className="max-w-md">
                {freeSignupCtaLabel}
              </FlowCtaLink>
            </div>
          </div>
        </section>

      {/* 마지막 CTA */}
      <section className={cn("border-t border-slate-200 bg-gradient-to-b from-brand-50/90 to-white", section.y)}>
          <div className={layout.page}>
            <div className="mx-auto flex max-w-xl flex-col items-center px-4 text-center">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                오늘 보내면, 오늘 반응이 올 수 있습니다
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
                링크 한 줄이면 카톡·당근·블로그 어디에서도 같은 방식으로 이어집니다.
              </p>
              <div className="mt-8 flex w-full justify-center">
                <FlowCtaLink to="/signup" className="max-w-md">
                  {freeSignupCtaLabel}
                </FlowCtaLink>
              </div>
            </div>
          </div>
        </section>
      <RewardAdsSection placement="landing" />
    </>
  );
}
