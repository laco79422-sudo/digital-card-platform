import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className={cn(layout.page, "py-10 sm:py-12")}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-sm font-bold text-white shadow-sm">
                L
              </span>
              <span className="font-semibold text-slate-900">Linko 명함</span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Link는 만나고, Go는 나아갑니다. 당신의 이름으로 시작되는 연결—소개와 만남, 협업까지 한곳에서
              이어 드립니다.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">제품</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/pricing" className="hover:text-brand-800">
                  이용 안내
                </Link>
              </li>
              <li>
                <Link to="/creators" className="hover:text-brand-800">
                  제작자 둘러보기
                </Link>
              </li>
              <li>
                <Link to="/requests" className="hover:text-brand-800">
                  의뢰하기
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">회사</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a href="#" className="hover:text-brand-800">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-brand-800">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">문의</h4>
            <p className="mt-3 text-sm text-slate-600">hello@linko.app</p>
            <p className="text-sm text-slate-500">평일 10:00–18:00 (KST)</p>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-200 pt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Linko 명함
        </p>
      </div>
    </footer>
  );
}
