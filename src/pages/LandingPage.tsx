import { Button } from "@/components/ui/Button";
import { CreatorCard } from "@/components/ui/CreatorCard";
import { PricingCard } from "@/components/ui/PricingCard";
import { LANDING_FAQ, LANDING_TESTIMONIALS } from "@/data/sampleData";
import { layout, section, type } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import {
  ArrowRight,
  BarChart3,
  Link2,
  MessageSquare,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

export function LandingPage() {
  const featuredCreatorIds = useAppDataStore((s) => s.featuredCreatorIds);
  const creators = useAppDataStore((s) => s.creators);
  const featured = useMemo(
    () =>
      featuredCreatorIds
        .map((id) => creators.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [featuredCreatorIds, creators],
  );

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.2),_transparent_50%)]" />
        <div className={cn("relative", layout.page, section.yHero)}>
          <div className="max-w-3xl">
            <p className={type.heroKicker}>
              <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              BizCard Connect Platform
            </p>
            <h1 className={cn("mt-5 sm:mt-6", type.heroTitle)}>
              명함 하나로, 고객 연결부터 콘텐츠 제작 의뢰까지
            </h1>
            <p className={cn("mt-5 sm:mt-6", type.heroLead)}>
              블로그와 유튜브 제작자를 한곳에서 찾으세요. 사업자는 빠르게 홍보하고, 제작자는 꾸준히
              일감을 얻습니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-stretch">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-white text-brand-950 hover:bg-brand-50">
                  사업자로 시작하기
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Button>
              </Link>
              <Link to="/creators" className="w-full sm:w-auto">
                <Button size="lg" variant="outlineOnDark" className="w-full">
                  제작자 둘러보기
                </Button>
              </Link>
            </div>
            <p className={cn("mt-5 sm:mt-6", type.heroFootnote)}>
              신용카드 없이 무료 플랜으로 명함 1개를 바로 만들 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section className={cn("border-b border-slate-200 bg-white", section.y)}>
        <div className={layout.page}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={type.sectionTitleCenter}>
              명함에서 바로 블로그와 유튜브 의뢰까지
            </h2>
            <p className={cn("mt-3 sm:mt-4", type.sectionLead)}>
              공개 명함 페이지에 의뢰 유형을 노출하고, 검증된 제작자가 지원합니다. 구독과 성사
              수수료로 지속 가능한 B2B 마켓플레이스를 지향합니다.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {[
              {
                icon: Link2,
                title: "디지털 명함",
                body: "슬러그 URL, QR, 테마로 브랜드 톤을 맞춘 공유 경험.",
              },
              {
                icon: BarChart3,
                title: "조회·클릭 통계",
                body: "유입과 버튼 클릭을 한눈에. 캠페인 최적화에 활용하세요.",
              },
              {
                icon: MessageSquare,
                title: "의뢰 등록",
                body: "블로그·유튜브·숏폼·썸네일 의뢰를 명함과 같은 계정에서 관리.",
              },
              {
                icon: Users,
                title: "제작자 매칭",
                body: "포트폴리오와 단가로 비교하고, 지원서를 받아 선택합니다.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6"
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
              <h2 className={type.sectionTitle}>서비스 흐름</h2>
              <p className={cn("mt-2 max-w-xl", type.sectionLead)}>
                사업자와 제작자 모두를 위한 단계형 온보딩.
              </p>
            </div>
          </div>
          <ol className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "명함 · 의뢰 템플릿",
                desc: "회원가입 후 디지털 명함을 만들고, 필요한 의뢰 유형을 등록합니다.",
              },
              {
                step: "02",
                title: "제작자 지원",
                desc: "크리에이터가 포트폴리오와 제안가를 올리면 알림으로 확인합니다.",
              },
              {
                step: "03",
                title: "선택 · 정산",
                desc: "지원자 중 파트너를 선택하고, 플랫폼 정책에 따라 결제·정산합니다.",
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
            <h2 className={type.sectionTitleCenter}>요금제 미리보기</h2>
            <p className={cn("mt-2 sm:mt-3", type.sectionLead)}>전체 비교는 요금제 페이지에서 확인하세요.</p>
            <Link
              to="/pricing"
              className="mt-4 inline-flex min-h-11 items-center justify-center text-base font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              요금제 전체 보기 →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-3">
            <PricingCard
              name="Starter"
              priceLabel="₩29,000"
              description="/월 · 소규모 팀"
              features={["공개 명함 3개", "기본 통계", "의뢰 5건 동시"]}
              href="/signup"
              cta="시작하기"
            />
            <PricingCard
              name="Pro"
              priceLabel="₩59,000"
              description="/월 · 성장하는 브랜드"
              features={["무제한 명함", "클릭 퍼널 리포트", "우선 노출"]}
              highlighted
              href="/signup"
              cta="Pro 선택"
            />
            <PricingCard
              name="Creator Plus"
              priceLabel="₩19,000"
              description="/월 · 제작자"
              features={["의뢰 알림", "포트폴리오 강조", "지원서 템플릿"]}
              href="/signup"
              cta="제작자 가입"
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
                블로그와 유튜브 제작자를 한곳에서 찾으세요.
              </p>
            </div>
            <Link
              to="/creators"
              className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-brand-700 underline-offset-4 hover:underline sm:justify-center"
            >
              전체 디렉터리 →
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
              <h2 className="mt-4 break-keep text-2xl font-bold leading-snug md:text-3xl">제작자 모집</h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90">
                분야별 포트폴리오를 등록하고 의뢰에 지원하세요. Creator Plus로 더 많은 브리프를
                받아보세요.
              </p>
              <Link to="/signup" className="mt-6 inline-block w-full sm:w-auto">
                <Button size="lg" className="w-full bg-white text-brand-950 hover:bg-brand-50 sm:w-auto">
                  크리에이터 가입
                </Button>
              </Link>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md sm:p-6">
              <p className="text-sm font-medium text-brand-100">이번 주 신규 의뢰</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">128건</p>
              <p className="mt-4 text-sm leading-relaxed text-white/85">
                샘플 지표입니다. 실서비스에서는 대시보드와 연동됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={cn("bg-white", section.y)}>
        <div className={layout.page}>
          <h2 className={type.sectionTitleCenter}>고객 후기</h2>
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
          <h2 className={type.sectionTitleCenter}>FAQ</h2>
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
