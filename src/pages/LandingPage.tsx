import { LandingSampleCard, type LandingSampleType } from "@/components/landing/LandingSampleCard";
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
  const featured = useMemo(
    () =>
      featuredCreatorIds
        .map((id) => creators.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [featuredCreatorIds, creators],
  );

  const expertItems = ["명함 제작", "블로그 홍보", "영상 콘텐츠 제작", "상담 구조 설계"] as const;

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

      {/* 1. 강한 결과 + 메인 CTA */}
      <section className="hero-section">
        <div className={cn("relative z-10", layout.page, section.yHero)}>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="text-balance text-3xl font-extrabold leading-snug tracking-tight text-slate-950 sm:text-4xl md:text-[2.65rem]">
              린코 디지털 명함은 고객이 먼저 찾아옵니다
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base font-medium leading-relaxed text-slate-700 sm:mt-5 sm:text-lg">
              링크 하나로 소개 → 연결 → 상담까지 이어집니다
            </p>

            <div className="mx-auto mt-8 w-full max-w-2xl sm:mt-10">
              <p className="sr-only">직접 만들거나 전문가에게 맡길 수 있습니다</p>
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12">
                <Link
                  to={CREATE_CARD_HREF}
                  className="group flex flex-col gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-400 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-100"
                >
                  <span
                    className={cn(
                      "inline-flex min-h-[52px] w-full items-center justify-center rounded-xl px-4 text-center text-sm font-bold leading-snug text-white shadow-lg transition-colors sm:text-base",
                      "bg-cta-500 shadow-cta-900/25 hover:bg-cta-600",
                    )}
                  >
                    내 명함 만들기
                  </span>
                  <span className="text-center text-[13px] font-medium leading-snug text-slate-700 sm:text-sm">
                    무료로 바로 시작, 직접 수정 가능
                  </span>
                </Link>
                <Link
                  to="/request"
                  className="group flex flex-col gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-100"
                >
                  <span
                    className={cn(
                      "inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border-2 border-slate-900/70 px-4 text-center text-sm font-bold leading-snug text-slate-950 shadow-md transition-colors sm:text-base",
                      "bg-white/45 backdrop-blur-sm hover:border-brand-600 hover:bg-white/70",
                    )}
                  >
                    명함 디자인 전문가에게 맡기기
                  </span>
                  <span className="text-center text-[13px] font-medium leading-snug text-slate-700 sm:text-sm">
                    디자인 상담 후 맞춤 제작 진행
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
            <h2 className={cn(type.sectionTitleCenter, "text-slate-900")}>명함을 만들면 홍보 링크를 추가할 수 있습니다</h2>
            <div className="mx-auto mt-8 max-w-lg space-y-3 text-[15px] leading-relaxed text-slate-800 sm:text-base">
              <p>명함을 만든 뒤 홍보 링크를 추가하면, 가입자들이 홍보 신청을 할 수 있습니다.</p>
              <p>이용자가 승인한 가입자는 전용 링크를 받아 명함을 공유할 수 있습니다.</p>
              <p>
                가입자들의 홍보 활동은 실시간으로 집계되며, 누가 더 많은 고객을 연결하고 있는지 한눈에 확인할 수
                있습니다.
              </p>
            </div>
            <p className="mx-auto mt-8 max-w-xl rounded-2xl border border-brand-200/80 bg-brand-50/80 px-5 py-4 text-base font-bold text-brand-950 sm:text-lg">
              내 명함을 만들고, 승인된 가입자들과 함께 공유하세요
            </p>
          </div>
          <div className="mt-10 flex justify-center sm:mt-12">
            <FlowCtaLink to={CREATE_CARD_HREF} variant="outline" className="sm:max-w-lg">
              내 명함 만들고 홍보 시작하기
            </FlowCtaLink>
          </div>
        </div>
      </section>

      {/* 3. 명함 예시 — 서비스 설명과 분리 */}
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

      {/* 4. 유료 전환 (전문가) — 체험 이후 */}
      <section className={cn("border-y border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={cn(type.sectionTitleCenter)}>전문가와 함께하면, 명함은 홍보가 됩니다</h2>
            <p className={cn("mt-3", type.sectionLead)}>
              명함 제작부터 블로그, 영상 홍보까지 전문가가 함께 설계합니다
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
                전문가와 함께 진행하기
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
              내가 직접 만들어보기
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
              내가 직접 만들어보기
            </FlowCtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
