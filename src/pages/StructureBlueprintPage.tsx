import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  buildStructureBlueprint,
  type StructureBlueprintResult,
  type StructureGoal,
} from "@/lib/structureBlueprint";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { ArrowDown, Check, Sparkles, Users } from "lucide-react";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

const GOAL_OPTIONS: { value: StructureGoal; label: string; hint: string }[] = [
  { value: "promo", label: "홍보", hint: "알려지고 싶을 때" },
  { value: "inquiry", label: "문의", hint: "상담·연락이 먼저일 때" },
  { value: "sales", label: "판매", hint: "계약·구매까지 고려할 때" },
];

function ResultBlock({ result }: { result: StructureBlueprintResult }) {
  return (
    <div className="space-y-6">
      <Card className="border-brand-200/80 bg-white">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-800">추천 명함 헤드라인</p>
          <p className="mt-2 text-lg font-bold leading-snug text-slate-900 sm:text-xl">{result.headline}</p>
        </CardHeader>
        <CardContent className="space-y-6 border-t border-slate-100 pt-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">소개 문구 (방향)</p>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800 sm:text-base">
              {result.intro}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">버튼 구성 (권장 순서)</p>
            <ol className="mt-3 space-y-2">
              {result.buttons.map((b, i) => (
                <li
                  key={b.label}
                  className="flex flex-wrap items-baseline gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-[15px] text-slate-800"
                >
                  <span className="font-mono text-xs font-bold text-brand-700">{i + 1}</span>
                  <span className="font-semibold">{b.label}</span>
                  <span className="text-sm text-slate-600">— {b.hint}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">추천 공유 방법</p>
            <ul className="mt-2 space-y-2 text-[15px] leading-relaxed text-slate-700">
              {result.shareTips.map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">홍보 방향</p>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-800 sm:text-base">{result.promotionDirection}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StructureBlueprintPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [industry, setIndustry] = useState("");
  const [goal, setGoal] = useState<StructureGoal>("promo");
  const [concern, setConcern] = useState("");
  const [result, setResult] = useState<StructureBlueprintResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onGenerate = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const r = buildStructureBlueprint({ industry, goal, concern });
      setResult(r);
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    },
    [industry, goal, concern],
  );

  return (
    <div className={cn(layout.page, "py-10 sm:py-14")}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-800">무료 → 유료 전환</p>
        <h1 className="mt-2 text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
          명함 구조, 먼저 받아보기
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-slate-600 sm:text-lg">
          <span className="font-semibold text-slate-800">무료</span>는 자동으로{" "}
          <span className="font-semibold text-slate-800">방향</span>을 제시하고,{" "}
          <span className="font-semibold text-slate-800">유료</span>는{" "}
          <span className="font-semibold text-slate-800">전문가 연결</span>로 실행과 결과까지 이어집니다.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 sm:mt-12">
        <Card className="border-slate-200 bg-slate-50/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-900">
              <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
              <h2 className="text-base font-bold">무료</h2>
            </div>
            <p className="text-sm font-medium text-slate-700">구조 안내 · 방향 제시</p>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-slate-600">
            입력만으로 헤드라인·소개·버튼·공유·홍보 방향 초안을 바로 확인합니다. 혼자 판단하기 어려울 때 첫 지도를
            받는 단계예요.
          </CardContent>
        </Card>
        <Card className="border-brand-200/90 bg-brand-50/40 ring-1 ring-brand-200/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-950">
              <Users className="h-5 w-5 shrink-0" aria-hidden />
              <h2 className="text-base font-bold">유료</h2>
            </div>
            <p className="text-sm font-medium text-slate-800">전문가 연결 · 실행 + 결과</p>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-slate-700">
            전문 상담가 연결, 1:1 상담, 맞춤 명함 제작, 블로그/영상 홍보, 의뢰가 이어지는 연결 구조까지 함께
            설계합니다.
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto mt-8 flex max-w-xl justify-center sm:mt-10">
        <Button
          type="button"
          size="lg"
          className="min-h-[52px] w-full max-w-md gap-2 bg-gradient-to-r from-cta-500 to-cta-600 text-base font-bold shadow-lg shadow-cta-900/20 hover:from-cta-400 hover:to-cta-500 sm:w-auto sm:min-w-[280px]"
          onClick={scrollToForm}
        >
          무료로 구조 받아보기
          <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </div>

      <div id="structure-form" ref={formRef} className="mx-auto mt-14 max-w-xl scroll-mt-24 sm:mt-16">
        <Card className="border-slate-200 shadow-md">
          <CardHeader>
            <h2 className="text-lg font-bold text-slate-900">간단 입력</h2>
            <p className="text-sm text-slate-600">아래만 채우면 맞춤 구조 초안이 생성됩니다.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onGenerate} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-800" htmlFor="structure-industry">
                  업종
                </label>
                <Input
                  id="structure-industry"
                  className="mt-1"
                  placeholder="예: 로컬 카페, B2B SaaS, 프리랜서 디자인"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  autoComplete="organization"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">목표</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {GOAL_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={cn(
                        "rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition-colors",
                        goal === o.value
                          ? "border-brand-600 bg-brand-50 text-brand-950"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300",
                      )}
                      onClick={() => setGoal(o.value)}
                    >
                      {o.label}
                      <span className="mt-0.5 block text-xs font-normal text-slate-600">{o.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800" htmlFor="structure-concern">
                  현재 고민
                </label>
                <Textarea
                  id="structure-concern"
                  className="mt-1 min-h-[100px]"
                  placeholder="예: 링크는 있는데 문의가 거의 없어요 / 블로그는 써야 하는데 시간이 없어요"
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                />
              </div>
              <Button type="submit" className="min-h-12 w-full text-base font-semibold">
                구조 생성하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {result ? (
        <div ref={resultRef} className="mx-auto mt-12 max-w-3xl scroll-mt-24 space-y-8 sm:mt-16">
          <div className="text-center">
            <p className="text-sm font-semibold text-emerald-800">자동 결과</p>
            <p className="mt-1 text-xs text-slate-500">입력을 바탕으로 한 초안이에요. 저장되지 않습니다.</p>
          </div>
          <ResultBlock result={result} />

          <Card className="border-2 border-brand-200/90 bg-gradient-to-b from-brand-50/80 to-white">
            <CardContent className="space-y-4 pt-6 sm:pt-7">
              <p className="text-center text-base font-bold text-slate-900 sm:text-lg">
                이 구조를 실제로 만들어드립니다
              </p>
              <ul className="mx-auto max-w-md space-y-2.5 text-[15px] text-slate-800">
                {[
                  "명함 제작",
                  "블로그 홍보",
                  "영상 콘텐츠 제작",
                  "상담 연결 구조 설계",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-center pt-2">
                <Link
                  to="/signup?intent=expert-structure"
                  className="inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-xl bg-cta-500 px-6 text-base font-bold text-white shadow-md shadow-cta-900/20 transition-colors hover:bg-cta-600"
                >
                  전문가와 함께 진행하기
                </Link>
              </div>
              <p className="text-center text-xs leading-relaxed text-slate-500">
                유료 신청 시 전문 상담가 연결 후 1:1 상담, 맞춤 명함·블로그/영상·의뢰 연결 구조를 함께 진행합니다.
                (데모에서는 가입 화면으로 연결됩니다.)
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-6 text-center sm:px-8">
            <p className="text-[15px] font-medium leading-relaxed text-slate-800">
              구조는 잡았습니다.
              <br />
              이제 실행만 남았습니다.
            </p>
            <p className="text-sm leading-relaxed text-slate-600">무료: 방향 제시 · 유료: 실행 + 결과</p>
            <p className="border-t border-slate-200 pt-4 text-[15px] font-medium leading-relaxed text-slate-800">
              혼자 만들면 오래 걸립니다.
              <br />
              전문가와 함께하면 바로 연결됩니다.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
