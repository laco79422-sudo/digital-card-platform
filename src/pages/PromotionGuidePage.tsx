import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { buildViralShareText } from "@/lib/viralShareText";
import { Link } from "react-router-dom";

const exampleCardUrl = "https://linko.app/c/예시-슬러그";

export function PromotionGuidePage() {
  const template = buildViralShareText(exampleCardUrl);

  return (
    <div className={cn(layout.page, "py-10 sm:py-14")}>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-800">홍보 교육</p>
        <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          명함을 중심으로 사람과 홍보가 연결되는 구조
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
          Linko는 입력폼에 그치지 않습니다. 명함 제작 → 홍보 요청 → 홍보 파트너 연결 → 교육으로 확산까지 한 흐름으로
          설계했습니다.
        </p>

        <section className="mt-12 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">카카오톡으로 공유하는 방법</h2>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
            <li>
              명함 편집기에서 <strong className="text-slate-900">「카카오톡 공유」</strong> 또는{" "}
              <strong className="text-slate-900">「내 카카오톡으로 테스트 보내기」</strong>를 누릅니다.
            </li>
            <li>모바일에서는 시스템 공유 시트에서 카카오톡을 고릅니다. PC에서는 메시지가 클립보드에 복사되면 채팅창에 붙여넣습니다.</li>
            <li>
              <strong className="text-slate-900">나에게 보내기</strong>로 먼저 톤을 확인한 뒤, 고객·지인 채팅으로 그대로
              전달합니다.
            </li>
            <li>링크 미리보기가 뜨는지 확인하고, 필요하면 한 줄 덧붙여 신뢰를 보완합니다.</li>
          </ol>
        </section>

        <section className="mt-8 space-y-4 rounded-2xl border border-brand-200/80 bg-brand-50/40 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">메시지 템플릿 (기본)</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            공유 시 아래와 같은 톤이 기본으로 실려 나갑니다. 본인 링크로 바꿔 쓰면 됩니다.
          </p>
          <pre className="whitespace-pre-wrap break-words rounded-xl border border-slate-200/80 bg-white p-4 font-sans text-sm leading-relaxed text-slate-800">
            {template}
          </pre>
        </section>

        <section className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">전환 구조 (눌렀을 때 일어나는 일)</h2>
          <div className="space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
            <p>
              <span className="font-semibold text-slate-900">① 링크 클릭</span> — 디지털 명함이 열리고 브랜드·연락처가 한
              화면에 모입니다.
            </p>
            <p>
              <span className="font-semibold text-slate-900">② 관심</span> — 소개·서비스·후기 영역을 보며 신뢰가 쌓입니다.
            </p>
            <p>
              <span className="font-semibold text-slate-900">③ 행동</span> — 전화·카카오·예약 링크 등 원하는 버튼으로
              바로 이어집니다.
            </p>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
              홍보 파트너는 이 흐름이 끊기지 않게, 짧은 메시지와 함께 링크만 보내는 것이 가장 효과적입니다.
            </p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 text-xl font-bold text-slate-900">
            역할 안내
          </h2>
          <div className="grid gap-px bg-slate-200 md:grid-cols-3">
            <div className="bg-white p-6">
              <h3 className="font-bold text-brand-900">명함 사용자</h3>
              <p className="mt-1 text-sm font-medium text-slate-600">고객을 만들고 싶은 사람</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                명함을 만들고 공유 링크를 추가하며, 고객 문의와 연결을 관리합니다.
              </p>
            </div>
            <div className="bg-white p-6">
              <h3 className="font-bold text-brand-900">홍보 파트너</h3>
              <p className="mt-1 text-sm font-medium text-slate-600">홍보로 수익을 만드는 사람</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                홍보에 참여하고 승인된 링크를 공유하며, 성과에 따라 보상을 받습니다.
              </p>
            </div>
            <div className="bg-white p-6">
              <h3 className="font-bold text-brand-900">제작 전문가</h3>
              <p className="mt-1 text-sm font-medium text-slate-600">결과를 만들어주는 전문가</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                명함 제작을 도와주고, 블로그·영상 등 콘텐츠 제작을 지원하며, 고객 연결 구조를 설계합니다.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            to="/create-card"
            className={linkButtonClassName({ variant: "primary", size: "lg", className: "w-full sm:w-auto" })}
          >
            명함 만들러 가기
          </Link>
          <Link
            to="/promotion/partner"
            className={linkButtonClassName({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
          >
            홍보 파트너 화면 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
