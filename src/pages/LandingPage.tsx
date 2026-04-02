import { SiteLinkPreviewSeo } from "@/components/seo/SiteLinkPreviewSeo";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { CreatorCard } from "@/components/ui/CreatorCard";
import { PricingCard } from "@/components/ui/PricingCard";
import { LANDING_FAQ, LANDING_TESTIMONIALS } from "@/data/sampleData";
import { form, layout, section, type } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import {
  ArrowRight,
  BarChart3,
  Link2,
  MessageSquare,
  Users,
  Video,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

export function LandingPage() {
  const navigate = useNavigate();
  const featuredCreatorIds = useAppDataStore((s) => s.featuredCreatorIds);
  const creators = useAppDataStore((s) => s.creators);
  const featured = useMemo(
    () =>
      featuredCreatorIds
        .map((id) => creators.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [featuredCreatorIds, creators],
  );

  const sampleCreator = featured[0] ?? null;

  const flowItems = [
    {
      icon: Link2,
      title: "나를 담은 명함",
      body: "웹 주소·QR·테마로 첫인상을 완성하고, 어디서든 펼쳐 보이세요.",
    },
    {
      icon: BarChart3,
      title: "누가 찾아왔는지",
      body: "방문과 클릭을 기록해, 어떤 인연이 닿고 있는지 감을 잡을 수 있어요.",
    },
    {
      icon: MessageSquare,
      title: "이야기 이어가기",
      body: "의뢰와 문의를 한곳에 모아, 놓치지 않고 답할 수 있습니다.",
    },
    {
      icon: Users,
      title: "맞는 사람과 연결",
      body: "제작자·협업자를 찾고, 제안을 주고받으며 관계를 키워 가세요.",
    },
  ] as const;

  return (
    <>
      <SiteLinkPreviewSeo />
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-brand-950 to-brand-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(96,165,250,0.2),_transparent_55%)]" />
        <div className={cn("relative", layout.page, section.yHero)}>
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <p className={type.heroKicker}>
              <Link2 className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              Link + Go · 연결하고 나아가요
            </p>

            <h1 className={cn("mt-6 sm:mt-8", type.heroMain)}>
              나를 소개하는 가장 쉬운 방법, 린코 디지털 명함
            </h1>

            <p className={type.heroSub}>
              한 번 만들면 링크로 퍼지는 나만의 디지털 명함
            </p>

            {/* 홍보 흐름 안내: 한눈에 읽히는 4카드 */}
            <div
              className="mt-10 w-full max-w-3xl rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:mt-12 sm:p-7"
              aria-label="서비스 안내"
            >
              <p className="text-sm font-semibold text-brand-100 sm:text-base">홍보 흐름 안내</p>
              <div className="mt-5 grid gap-4 text-left sm:grid-cols-2 sm:gap-5">
                {flowItems.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-4"
                  >
                    <item.icon className="mt-0.5 h-6 w-6 shrink-0 text-brand-300" aria-hidden />
                    <div>
                      <h3 className="text-sm font-semibold text-white sm:text-sm">{item.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-white/85 sm:text-[15px]">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p
              className={cn(
                type.heroLead,
                "mt-10 max-w-2xl rounded-2xl border border-brand-400/40 bg-brand-600/25 px-5 py-4 text-base font-semibold text-brand-50 shadow-lg sm:mt-12 sm:px-6 sm:py-5 sm:text-lg md:text-xl",
              )}
            >
              이름을 남기는 명함에서, 고객과 연결되는 명함으로
            </p>

            <div className="mt-8 w-full sm:mt-10">
              <p className="text-sm font-medium text-brand-100/95">명함 샘플 미리보기</p>
              <div className="mx-auto mt-4 max-w-[22rem]">
                {sampleCreator ? (
                  <CreatorCard creator={sampleCreator} />
                ) : (
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-left shadow-lg backdrop-blur-md">
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-200/90">Sample</p>
                    <p className="mt-3 text-xl font-bold text-white">김링코</p>
                    <p className="mt-1 text-sm text-white/80">디지털 명함 · 제작자</p>
                    <p className="mt-4 text-[15px] leading-relaxed text-white/88">
                      링크 하나로 프로필·포트폴리오·문의를 연결합니다. 실제 명함은 가입 후 바로 편집할 수 있어요.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs text-white/95">프로필</span>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs text-white/95">QR</span>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs text-white/95">문의</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 w-full max-w-md sm:mt-12">
              <p className="text-sm font-medium text-white/90">디지털 명함 만들기</p>
              <form
                className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate("/signup");
                }}
              >
                <label htmlFor="landing-email" className="sr-only">
                  이메일
                </label>
                <input
                  id="landing-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="이메일 주소를 입력하세요"
                  className={cn(form.input, "border-white/25 bg-white/95 text-slate-900 placeholder:text-slate-500")}
                />
                <button
                  type="submit"
                  className={cn(
                    "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-slate-900 shadow-md",
                    "bg-white hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-brand-950 sm:px-6",
                  )}
                >
                  시작하기
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              </form>
              <p className={cn("mt-4", type.heroFootnote)}>
                첫 명함은 무료로, 이름 하나로 오늘부터 연결을 열어 보세요.
              </p>
            </div>

            <div className="mt-8 flex w-full max-w-lg flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center">
              <Link
                to="/signup"
                className={cn(
                  "w-full sm:w-auto",
                  linkButtonClassName({
                    variant: "outlineOnDark",
                    size: "lg",
                    className: "w-full sm:w-auto",
                  }),
                )}
              >
                회원가입으로 이동
              </Link>
              <Link
                to="/creators"
                className={cn(
                  "w-full sm:w-auto",
                  linkButtonClassName({
                    variant: "outlineOnDark",
                    size: "lg",
                    className: "w-full sm:w-auto",
                  }),
                )}
              >
                함께할 사람 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={cn("border-b border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={type.sectionTitleCenter}>이름으로 열리는 만남의 문</h2>
            <p className={cn("mt-3 sm:mt-4", type.sectionLead)}>
              한 장의 명함이 곧 첫 인사가 됩니다. 소개하고, 응답하고, 다음 이야기로 이어지는 흐름을
              Linko가 옆에서 돕습니다.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {[
              {
                icon: Link2,
                title: "나를 담은 명함",
                body: "웹 주소·QR·테마로 당신만의 첫인상을 완성하고, 어디서든 펼쳐 보이세요.",
              },
              {
                icon: BarChart3,
                title: "누가 찾아왔는지",
                body: "방문과 클릭을 조용히 기록해, 어떤 인연이 닿고 있는지 감을 잡을 수 있어요.",
              },
              {
                icon: MessageSquare,
                title: "이야기 이어가기",
                body: "의뢰와 문의를 같은 공간에 모아, 놓치지 않고 답할 수 있습니다.",
              },
              {
                icon: Users,
                title: "맞는 사람과 연결",
                body: "제작자·협업자를 찾고, 제안을 주고받으며 관계를 키워 가세요.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm sm:p-6"
              >
                <item.icon className="h-8 w-8 text-brand-700" aria-hidden />
                <h3 className={type.featureCardTitle}>{item.title}</h3>
                <p className={type.featureCardBody}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn("bg-slate-50", section.y)}>
        <div className={layout.page}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={type.sectionTitle}>이렇게 이어져요</h2>
              <p className={cn("mt-2 max-w-xl", type.sectionLead)}>
                가볍게 시작하고, 천천히 관계를 쌓을 수 있도록 단계를 나눴어요.
              </p>
            </div>
          </div>
          <ol className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "프로필 명함 만들기",
                desc: "가입 후 나를 소개하는 명함을 만들고, 필요하면 의뢰나 문의 유형을 적어 둡니다.",
              },
              {
                step: "02",
                title: "서로의 이야기",
                desc: "상대가 명함을 열고, 제작자·협업자는 제안을 남깁니다. 알림으로 놓치지 마세요.",
              },
              {
                step: "03",
                title: "선택과 다음 걸음",
                desc: "마음에 맞는 인연을 고르고, 정책에 따라 결제·정산을 이어 갑니다.",
              },
            ].map((s) => (
              <li key={s.step} className="relative rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <span className="text-xs font-bold text-brand-600">{s.step}</span>
                <h3 className="mt-2 text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-700 sm:text-base">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={cn("bg-white", section.y)}>
        <div className={layout.page}>
          <div className="text-center">
            <h2 className={type.sectionTitleCenter}>이용 안내 미리보기</h2>
            <p className={cn("mt-2 sm:mt-3", type.sectionLead)}>
              자세한 비교는 이용 안내 페이지에서 확인하세요.
            </p>
            <Link
              to="/pricing"
              className="mt-4 inline-flex min-h-11 items-center justify-center text-base font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              이용 안내 자세히 보기 →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-3">
            <PricingCard
              name="스타터"
              priceLabel="₩29,000"
              description="월 · 소규모 팀"
              features={["공개 명함 3개", "방문·클릭 기록", "의뢰 5건까지 동시"]}
              href="/signup"
              cta="무료로 시작"
            />
            <PricingCard
              name="프로"
              priceLabel="₩59,000"
              description="월 · 성장하는 브랜드"
              features={["명함 개수 제한 없음", "버튼 클릭 흐름 보기", "목록에서 먼저 보이기"]}
              highlighted
              href="/signup"
              cta="프로 플랜 선택"
            />
            <PricingCard
              name="제작자 플러스"
              priceLabel="₩19,000"
              description="월 · 제작자"
              features={["새 의뢰 알림", "프로필 더 잘 보이게", "제안서 양식"]}
              href="/signup"
              cta="제작자로 가입"
            />
          </div>
        </div>
      </section>

      <section className={cn("border-y border-slate-200 bg-slate-50", section.y)}>
        <div className={layout.page}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className={type.sectionTitle}>추천 제작자</h2>
              <p className={cn("mt-2 max-w-xl", type.sectionLead)}>
                글·영상·디자인으로 당신의 이야기를 돕는 분들을 만나 보세요.
              </p>
            </div>
            <Link
              to="/creators"
              className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-brand-700 underline-offset-4 hover:underline sm:justify-center"
            >
              제작자 전체 보기 →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {featured.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
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
                포트폴리오를 올리고, 의뢰에 응답해 보세요. 누군가의 다음 시작을 함께 만들 수 있습니다.
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
              <p className="mt-4 text-sm leading-relaxed text-white/85">
                샘플 숫자입니다. 실서비스에서는 내 공간과 연결됩니다.
              </p>
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
        </div>
      </section>
    </>
  );
}
