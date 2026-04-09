import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { buildViralShareText } from "@/lib/viralShareText";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import { ExternalLink, Share2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function PromotionPartnerPage() {
  const user = useAuthStore((s) => s.user);
  const promotionPool = useAppDataStore((s) => s.promotionPool);
  const enrollPromoter = useAppDataStore((s) => s.enrollPromoter);
  const promoterParticipations = useAppDataStore((s) => s.promoterParticipations);

  const [enrollFlash, setEnrollFlash] = useState<string | null>(null);

  const activePool = useMemo(
    () => promotionPool.filter((e) => e.status === "active"),
    [promotionPool],
  );

  const isEnrolled = user
    ? promoterParticipations.some((p) => p.user_id === user.id)
    : false;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const onEnroll = () => {
    if (!user) {
      setEnrollFlash("로그인 후 참여할 수 있어요.");
      return;
    }
    const ok = enrollPromoter({
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
    });
    setEnrollFlash(ok ? "홍보 파트너 참여가 등록되었습니다." : "이미 참여 중이에요.");
  };

  const shareOne = async (slug: string) => {
    const url = `${origin}/c/${encodeURIComponent(slug)}`;
    const text = buildViralShareText(url);
    if (navigator.share) {
      try {
        await navigator.share({ title: "디지털 명함", text, url });
        return;
      } catch {
        /* 취소 */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setEnrollFlash("공유 문구를 복사했어요. 카카오톡에 붙여넣어 보세요.");
      window.setTimeout(() => setEnrollFlash(null), 3000);
    } catch {
      window.prompt("복사해 공유해 주세요", text);
    }
  };

  return (
    <div className={cn(layout.page, "py-10 sm:py-14")}>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-800">홍보자 · 파트너</p>
        <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          홍보자로 참여하기
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
          홍보 풀에 올라온 명함을 보고, 링크와 메시지로 가볍게 공유 활동을 이어갈 수 있어요. 명함 생성자와 홍보자가 같은
          구조 안에서 연결됩니다.
        </p>

        <Card className="mt-8 border-brand-200/80 bg-brand-50/30">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">참여 신청</h2>
            <p className="text-sm text-slate-600">
              로그인한 계정으로 한 번 신청하면, 아래 목록과 공유 도구를 계속 이용할 수 있어요.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {user ? (
              <>
                <Button
                  type="button"
                  className="w-full gap-2 sm:w-auto"
                  variant={isEnrolled ? "outline" : "primary"}
                  onClick={onEnroll}
                  disabled={isEnrolled}
                >
                  <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  {isEnrolled ? "참여 완료" : "홍보 참여 신청하기"}
                </Button>
                <Link
                  to="/promotion/guide"
                  className={linkButtonClassName({
                    variant: "secondary",
                    size: "md",
                    className: "w-full sm:w-auto",
                  })}
                >
                  홍보 교육 보기
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  state={{ from: "/promotion/partner" }}
                  className={linkButtonClassName({
                    variant: "primary",
                    size: "md",
                    className: "w-full sm:w-auto",
                  })}
                >
                  로그인하고 참여하기
                </Link>
                <Link
                  to="/signup"
                  className={linkButtonClassName({
                    variant: "outline",
                    size: "md",
                    className: "w-full sm:w-auto",
                  })}
                >
                  회원가입
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {enrollFlash ? (
          <p className="mt-4 rounded-xl border border-brand-100 bg-white px-4 py-3 text-center text-sm font-medium text-brand-950 shadow-sm">
            {enrollFlash}
          </p>
        ) : null}

        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">홍보 풀 명함</h2>
          <p className="mt-1 text-sm text-slate-600">
            생성자가 「홍보 요청하기」로 등록한 명함이에요. 열기·공유로 활동을 이어가 보세요.
          </p>

          {activePool.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center text-sm text-slate-600">
              아직 풀에 등록된 명함이 없어요. 명함을 만든 뒤 홍보 요청을 올려 보세요.
              <div className="mt-4">
                <Link
                  to="/create-card"
                  className={linkButtonClassName({ variant: "secondary", size: "md", className: "inline-flex" })}
                >
                  명함 만들기
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {activePool.map((row) => {
                const href = `/c/${encodeURIComponent(row.slug)}`;
                const fullUrl = origin ? `${origin}${href}` : href;
                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{row.brand_name}</p>
                      <p className="text-sm text-slate-600">{row.person_name}</p>
                      <p className="mt-1 break-all font-mono text-xs text-brand-800">{fullUrl}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <Link
                        to={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkButtonClassName({
                          variant: "outline",
                          size: "md",
                          className: "w-full gap-2 sm:w-auto",
                        })}
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                        열기
                      </Link>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full gap-2 sm:w-auto"
                        onClick={() => void shareOne(row.slug)}
                      >
                        <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                        공유하기
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
