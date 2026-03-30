import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-base font-semibold text-brand-800">404</p>
      <h1 className="mt-3 break-keep text-2xl font-bold leading-snug text-slate-900 md:text-3xl">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600">
        주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
      </p>
      <Link to="/" className="mt-10 w-full max-w-xs">
        <Button className="w-full" size="lg">
          홈으로
        </Button>
      </Link>
    </div>
  );
}
