import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { ApplicationStatus } from "@/types/domain";
import { Send } from "lucide-react";
import { useMemo } from "react";

const statusLabel: Record<ApplicationStatus, string> = {
  pending: "검토중",
  accepted: "채택",
  rejected: "거절",
};

export function ApplicationsPage() {
  const user = useAuthStore((s) => s.user);
  const applications = useAppDataStore((s) => s.applications);
  const requests = useAppDataStore((s) => s.serviceRequests);

  const list = useMemo(() => {
    if (!user) return [];
    if (user.role === "creator") {
      return applications.filter((a) => a.creator_user_id === user.id);
    }
    const myReqIds = new Set(requests.filter((r) => r.client_user_id === user.id).map((r) => r.id));
    return applications.filter((a) => myReqIds.has(a.request_id));
  }, [applications, requests, user]);

  if (!user) {
    return null;
  }

  return (
    <div className={cn(layout.pageWide, "py-10 sm:py-12")}>
      <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
        제안·지원 내역
      </h1>
      <p className="mt-2 text-base leading-relaxed text-slate-600">
        {user.role === "creator"
          ? "보낸 제안과 진행 상태를 확인하세요."
          : "내 의뢰에 도착한 제안이에요."}
      </p>
      {list.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Send}
            title="아직 제안이 없어요"
            description="의뢰 목록에서 마음에 드는 일에 제안을 보내 보세요."
          />
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {list.map((a) => (
            <li key={a.id}>
              <Card>
                <CardContent className="space-y-2 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{a.request_title ?? "의뢰"}</h2>
                    <Badge
                      tone={
                        a.status === "accepted"
                          ? "success"
                          : a.status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {statusLabel[a.status]}
                    </Badge>
                  </div>
                  {user.role === "client" ? (
                    <p className="text-sm font-medium text-slate-600">제작자: {a.creator_name}</p>
                  ) : null}
                  <p className="text-[15px] leading-relaxed text-slate-800 sm:text-base">{a.proposal_text}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {a.proposed_price != null ? <span>제안 {a.proposed_price.toLocaleString()}원</span> : null}
                    {a.estimated_days != null ? <span>예상 {a.estimated_days}일</span> : null}
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
