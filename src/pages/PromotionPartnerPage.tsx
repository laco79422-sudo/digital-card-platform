import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { appendPartnerQueryToUrl } from "@/lib/linkoPartnerAttribution";
import { buildCardShareUrl } from "@/lib/cardShareUrl";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { activatePartnerProgramRemote } from "@/services/partnerProgramService";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import { ExternalLink, Loader2, Share2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function PromotionPartnerPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const promotionPool = useAppDataStore((s) => s.promotionPool);
  const enrollPromoter = useAppDataStore((s) => s.enrollPromoter);
  const promoterParticipations = useAppDataStore((s) => s.promoterParticipations);

  const [enrollFlash, setEnrollFlash] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const activePool = useMemo(
    () => promotionPool.filter((e) => e.status === "active"),
    [promotionPool],
  );

  const isEnrolledLocal = user
    ? promoterParticipations.some((p) => p.user_id === user.id)
    : false;

  const partnerActive = Boolean(user?.is_partner) || isEnrolledLocal;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const onActivatePartner = async () => {
    if (!user) {
      setEnrollFlash("로그인 후 참여할 수 있어요.");
      return;
    }
    setActivating(true);
    enrollPromoter({
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
    });
    const remoteOk = await activatePartnerProgramRemote();
    setActivating(false);
    if (remoteOk) {
      setUser({ ...user, is_partner: true });
      setEnrollFlash("파트너 계정이 활성화되었습니다. 아래 링크에 ?partner=가 포함되어 성과가 추적됩니다.");
    } else {
      setEnrollFlash(
        "로컬 등록은 되었어요. Supabase 연결 후 서버에서 파트너 플래그가 활성화됩니다.",
      );
    }
  };

  const shareOne = async (slug: string) => {
    let shareUrl = buildCardShareUrl(origin, slug);
    if (!shareUrl) return;
    if (user?.id && partnerActive) {
      shareUrl = appendPartnerQueryToUrl(shareUrl, user.id);
    }
    const r = await shareCardLinkNativeOrder({
      shareUrl,
      title: "디지털 명함",
      shortMessage: "명함 페이지 링크예요.",
    });
    if (r === "clipboard") {
      setEnrollFlash("명함 링크를 복사했어요. 카카오톡에 붙여넣어 보세요.");
      window.setTimeout(() => setEnrollFlash(null), 3000);
    }
  };

  return (
    <div className={cn(layout.page, "py-10 sm:py-14")}>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-800">홍보 파트너</p>
        <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          홍보 파트너로 참여하기
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
          다른 사람의 공개 명함을 홍보하고, 예약·결제 전환 시 <strong className="font-semibold text-slate-800">홍보 수익 10%</strong>가 기록됩니다.
          명함 소유자(크리에이터)에게는 서비스 매출(결제액의 90%)이 적립되는 구조입니다.
        </p>

        <Card className="mt-8 border-brand-200/80 bg-brand-50/30">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">파트너 신청</h2>
            <p className="text-sm text-slate-600">
              「홍보 참여하기」로 계정에 파트너 역할을 활성화합니다. 공유 링크 형식:{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs text-brand-900">
                …/c/&#123;slug&#125;?partner=&#123;내 회원 ID&#125;
              </code>
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {user ? (
              <>
                <Button
                  type="button"
                  className="w-full gap-2 sm:w-auto"
                  variant={partnerActive ? "outline" : "primary"}
                  onClick={() => void onActivatePartner()}
                  disabled={partnerActive || activating}
                >
                  {activating ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  ) : (
                    <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {partnerActive ? "파트너 활성화됨" : "홍보 참여하기"}
                </Button>
                {partnerActive ? (
                  <Link
                    to="/partner/dashboard"
                    className={linkButtonClassName({
                      variant: "secondary",
                      size: "md",
                      className: "w-full sm:w-auto",
                    })}
                  >
                    파트너 대시보드
                  </Link>
                ) : null}
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
            명함 사용자가 「홍보 요청하기」로 등록한 명함이에요. 파트너 활성화 후 공유하면 추적됩니다.
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
                const baseUrl = origin ? `${origin}${href}` : href;
                const partnerUrl =
                  user?.id && partnerActive ? appendPartnerQueryToUrl(baseUrl, user.id) : baseUrl;
                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{row.brand_name}</p>
                      <p className="text-sm text-slate-600">{row.person_name}</p>
                      <p className="mt-1 break-all font-mono text-xs text-brand-800">{partnerUrl}</p>
                      {!partnerActive ? (
                        <p className="mt-1 text-[11px] text-slate-500">
                          파트너 활성화 후 위 주소에 내 회원 ID가 붙습니다.
                        </p>
                      ) : null}
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
