import { ServiceRequestCard } from "@/components/ui/ServiceRequestCard";
import { Button } from "@/components/ui/Button";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import { useMemo } from "react";
import { Link } from "react-router-dom";

export function RequestListPage() {
  const user = useAuthStore((s) => s.user);
  const serviceRequests = useAppDataStore((s) => s.serviceRequests);

  const list = useMemo(() => {
    if (!user) return serviceRequests;
    if (user.role === "client" || user.role === "company_admin") {
      return serviceRequests.filter((r) => r.client_user_id === user.id);
    }
    return serviceRequests;
  }, [serviceRequests, user]);

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            의뢰 목록
          </h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            {user?.role === "creator"
              ? "열린 의뢰를 보고, 마음에 드는 곳에 제안을 보내 보세요."
              : "올린 의뢰와 진행 상태를 한눈에 볼 수 있어요."}
          </p>
        </div>
        {user?.role === "client" || user?.role === "company_admin" ? (
          <Link to="/requests/new" className="w-full sm:w-auto">
            <Button className="w-full min-h-[52px] sm:w-auto" size="lg">
              의뢰하기
            </Button>
          </Link>
        ) : null}
      </div>
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {list.map((r) => (
          <li key={r.id}>
            <ServiceRequestCard request={r} />
          </li>
        ))}
      </ul>
    </div>
  );
}
