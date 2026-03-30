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
  Users,
  Video,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const HERO_STORY = `당신의 이름이 하나의 연결이 되는 순간,
Linko는 사람과 사람을 이어줍니다.
단순한 명함이 아니라,
당신을 보여주고, 연결을 만들고,
기회를 이어가는 새로운 시작입니다.`;

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
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-brand-950 to-brand-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(96,165,250,0.18),_transparent_55%)]" />
        <div className={cn("relative", layout.page, section.yHero)}>
          <div className="max-w-3xl">
            <p className={type.heroKicker}>
              <Link2 className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              Link + Go · 연결하고 나아가요
            </p>
            <h1 className={cn("mt-5 sm:mt-6", type.heroTitle)}>Linko 명함</h1>
            <p className={cn("mt-4 sm:mt-5", type.heroTagline)}>연결되는 나의 시작</p>
            <p className={cn("mt-6 sm:mt-7", type.heroStory)}>{HERO_STORY}</p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-stretch">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" variant="solidLight" className="w-full">
                  연결 시작하기
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-900" aria-hidden />
                </Button>
              </Link>
              <Link to="/creators" className="w-full sm:w-auto">
                <Button size="lg" variant="outlineOnDark" className="w-full">
                  함께할 사람 둘러보기
                </Button>
              </Link>
            </div>
            <p className={cn("mt-5 sm:mt-6", type.heroFootnote)}>
              첫 명함은 무료로, 이름 하나로 오늘부터 연결을 열어 보세요.
            </p>
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
              <Link to="/signup" className="mt-6 inline-block w-full sm:w-auto">
                <Button size="lg" variant="solidLight" className="w-full sm:w-auto">
                  제작자로 참여하기
                </Button>
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
