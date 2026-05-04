import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { LINKO_CARD_CREATE_FLOW_HREF, LINKO_MAIN_CTA_LABEL } from "@/lib/linkoFlowCopy";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const DEMO_LINK_PLACEHOLDER = "https://linkoapp.kr/c/내-명함";

function SectionTitle({ children, tone = "slate" }: { children: ReactNode; tone?: "brand" | "slate" }) {
  return (
    <h2
      className={cn(
        "text-xl font-extrabold tracking-tight sm:text-2xl",
        tone === "brand" ? "text-brand-900" : "text-slate-900",
      )}
    >
      {children}
    </h2>
  );
}

export function PromotionGuidePage() {
  return (
    <div className={cn(layout.page, "py-10 sm:py-16")}>
      <div className="mx-auto max-w-3xl">
        {/* [1] 헤드라인 */}
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2.125rem] sm:leading-tight">
          명함 하나로 고객 유입부터 상담까지 시작됩니다
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base font-medium leading-relaxed text-slate-700 sm:text-lg">
          링크를 보내면 고객이 보고 먼저 연락합니다.
          <br className="hidden sm:inline" /> 혼자 홍보하거나, 파트너와 함께 확산할 수 있습니다.
        </p>

        {/* [2] 최상단 CTA — 메인 명함 + 유입 링크 */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to={LINKO_CARD_CREATE_FLOW_HREF}
            className={linkButtonClassName({
              variant: "primary",
              size: "lg",
              className: "order-2 w-full min-h-[54px] text-base font-bold sm:order-1 sm:flex-1",
            })}
          >
            {LINKO_MAIN_CTA_LABEL}
          </Link>
          <Link
            to="/helperlink/pay"
            className={linkButtonClassName({
              variant: "secondary",
              size: "lg",
              className:
                "order-1 w-full min-h-[54px] border-2 border-brand-600 bg-white text-base font-bold text-brand-900 shadow-sm hover:bg-brand-50 sm:order-2 sm:flex-1",
            })}
          >
            고객 유입 링크로 홍보 맡기기
          </Link>
        </div>

        {/* [3] 고객 유입 흐름 */}
        <section className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionTitle>고객 유입 흐름</SectionTitle>
          <ol className="mt-6 space-y-5">
            <li className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-black text-white">
                1
              </span>
              <div>
                <p className="font-bold text-slate-900">명함 생성</p>
                <p className="mt-1 text-sm text-slate-600">→ 한눈에 보이는 정보</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-black text-white">
                2
              </span>
              <div>
                <p className="font-bold text-slate-900">링크 전달</p>
                <p className="mt-1 text-sm text-slate-600">→ 카톡 / 당근 / 블로그 / 파트너</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-black text-white">
                3
              </span>
              <div>
                <p className="font-bold text-slate-900">고객 유입</p>
                <p className="mt-1 text-sm text-slate-600">→ 보고 바로 이해</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-black text-white">
                4
              </span>
              <div>
                <p className="font-bold text-slate-900">문의 발생</p>
                <p className="mt-1 text-sm text-slate-600">→ 클릭 → 상담 연결</p>
              </div>
            </li>
          </ol>
          <p className="mt-8 text-center text-base font-semibold text-brand-900">
            보내는 순간, 고객이 먼저 움직입니다.
          </p>
        </section>

        {/* [4] 홍보 방식 2가지 */}
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900">혼자 홍보</h3>
            <ul className="mt-4 space-y-2 text-sm font-medium text-slate-700">
              <li>· 카카오톡 공유</li>
              <li>· 당근 게시글</li>
              <li>· 블로그 / 유튜브</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">내 채널로 직접 고객을 모읍니다.</p>
          </div>
          <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-b from-brand-50/70 to-white p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-brand-950">홍보 파트너 확산</h3>
            <ul className="mt-4 space-y-2 text-sm font-medium text-slate-800">
              <li>· 검증된 파트너가 대신 홍보</li>
              <li>· 채널별 확산</li>
              <li>· 성과 기반 관리</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">홍보를 맡기고 결과를 확인하세요.</p>
            <Link
              to="/helperlink/pay"
              className={linkButtonClassName({
                variant: "primary",
                size: "md",
                className: "mt-5 w-full font-bold",
              })}
            >
              파트너에게 홍보 맡기기
            </Link>
          </div>
        </section>

        {/* [5] 카카오톡 — 간단화 */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8">
          <SectionTitle tone="brand">카카오톡으로 보내는 방법</SectionTitle>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm font-semibold text-slate-900 sm:text-base">
            <li>링크 복사</li>
            <li>카카오톡에 붙여넣기</li>
            <li>전송</li>
          </ol>
          <p className="mt-6 rounded-xl border border-brand-100 bg-white px-4 py-3 text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
            팁: 이미지가 안 보이면 링크 + 이미지를 함께 보내세요.
          </p>
        </section>

        {/* [6] 메시지 템플릿 */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionTitle>메시지 템플릿</SectionTitle>
          <div className="mt-6 space-y-4">
            <pre className="whitespace-pre-wrap break-words rounded-xl bg-slate-900 px-4 py-4 font-sans text-sm leading-relaxed text-white">
              {`이거 한 번만 봐줘
내가 만든 소개야 👇
${DEMO_LINK_PLACEHOLDER}`}
            </pre>
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 font-sans text-sm leading-relaxed text-slate-900">
              {`이거 보면 바로 이해돼
필요하면 연락 줘 👇
${DEMO_LINK_PLACEHOLDER}`}
            </pre>
          </div>
          <p className="mt-4 text-xs text-slate-500">「내 명함 만들기」에서 받은 공개 주소를 위 링크 자리에 넣어 쓰면 됩니다.</p>
        </section>

        {/* [7] 전환 구조 */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionTitle>고객이 움직이는 흐름</SectionTitle>
          <ul className="mt-6 space-y-5 text-sm sm:text-base">
            <li>
              <span className="font-black text-brand-700">①</span>{" "}
              <span className="font-bold text-slate-900">한눈에 이해</span>
              <span className="text-slate-600"> — 이미지 명함으로 바로 인식</span>
            </li>
            <li>
              <span className="font-black text-brand-700">②</span>{" "}
              <span className="font-bold text-slate-900">신뢰 형성</span>
              <span className="text-slate-600"> — 상세 페이지에서 설명</span>
            </li>
            <li>
              <span className="font-black text-brand-700">③</span>{" "}
              <span className="font-bold text-slate-900">행동</span>
              <span className="text-slate-600"> — 문의 버튼 클릭 → 상담 연결</span>
            </li>
          </ul>
          <p className="mt-8 text-center text-base font-semibold text-slate-800">
            길게 설명하지 않아도 고객이 먼저 움직입니다.
          </p>
        </section>

        {/* [8] 역할 */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <SectionTitle>역할</SectionTitle>
          <ul className="mt-6 space-y-4 text-sm leading-relaxed sm:text-base">
            <li className="border-b border-slate-100 pb-4">
              <span className="font-bold text-brand-900">명함 사용자</span>
              <span className="text-slate-700"> · 명함 만들고 고객 연결</span>
            </li>
            <li className="border-b border-slate-100 pb-4">
              <span className="font-bold text-brand-900">홍보 파트너</span>
              <span className="text-slate-700"> · 대신 홍보하고 성과 발생</span>
            </li>
            <li>
              <span className="font-bold text-brand-900">제작 전문가</span>
              <span className="text-slate-700"> · 더 잘 팔리는 구조로 제작</span>
            </li>
          </ul>
        </section>

        {/* [9] 하단 CTA */}
        <section className="mt-14 rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-8 text-center text-white shadow-lg sm:p-10">
          <p className="text-lg font-bold leading-snug sm:text-xl">지금 시작하면 바로 고객 유입이 시작됩니다</p>
          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={LINKO_CARD_CREATE_FLOW_HREF}
              className={linkButtonClassName({
                size: "lg",
                variant: "primary",
                className:
                  "w-full bg-white font-extrabold text-brand-900 shadow hover:bg-brand-50 sm:w-auto sm:min-w-[200px]",
              })}
            >
              {LINKO_MAIN_CTA_LABEL}
            </Link>
            <Link
              to="/helperlink/pay"
              className={linkButtonClassName({
                size: "lg",
                variant: "outline",
                className:
                  "w-full border-2 border-white/90 bg-transparent font-extrabold text-white hover:bg-white/10 sm:w-auto sm:min-w-[200px]",
              })}
            >
              고객 유입 링크 시작하기
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
