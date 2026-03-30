import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import { CreditCard, ExternalLink, Pencil } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

export function MyCardsPage() {
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);

  const mine = useMemo(
    () => businessCards.filter((c) => c.user_id === user?.id),
    [businessCards, user?.id],
  );

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            내 명함
          </h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            슬러그로 공개 페이지를 만들고 QR로 공유하세요.
          </p>
        </div>
        <Link to="/cards/new" className="w-full sm:w-auto">
          <Button className="w-full min-h-[52px] sm:w-auto" size="lg">
            명함 만들기
          </Button>
        </Link>
      </div>

      {mine.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={CreditCard}
            title="아직 명함이 없습니다"
            description="첫 명함으로 당신의 이야기를 열고, 연결을 시작해 보세요."
            action={() => (window.location.href = "/cards/new")}
            actionLabel="명함 만들기"
          />
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {mine.map((card) => (
            <li key={card.id}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{card.brand_name}</h2>
                    <p className="text-sm text-slate-600">
                      {card.person_name} · {card.job_title}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      /c/{card.slug} · {card.is_public ? "공개" : "비공개"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/c/${card.slug}`} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="h-4 w-4" />
                        보기
                      </Button>
                    </Link>
                    <Link to={`/cards/${card.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                        수정하기
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
