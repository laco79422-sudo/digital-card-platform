import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { ServiceRequest, ServiceRequestStatus, ServiceRequestType } from "@/types/domain";
import { Calendar, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

const typeLabels: Record<ServiceRequestType, string> = {
  blog: "블로그",
  youtube: "유튜브",
  shortform: "숏폼",
  thumbnail: "썸네일",
};

const statusLabels: Record<ServiceRequestStatus, string> = {
  open: "모집 중",
  matched: "연결됨",
  in_progress: "진행 중",
  completed: "완료",
  cancelled: "취소",
};

const statusTone: Record<ServiceRequestStatus, "default" | "brand" | "success" | "warning"> = {
  open: "brand",
  matched: "success",
  in_progress: "warning",
  completed: "default",
  cancelled: "default",
};

export function ServiceRequestCard({ request }: { request: ServiceRequest }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="default">{typeLabels[request.request_type]}</Badge>
          <Badge tone={statusTone[request.status]}>{statusLabels[request.status]}</Badge>
        </div>
        <h3 className="text-base font-semibold text-slate-900">{request.title}</h3>
        <p className="line-clamp-2 text-[15px] leading-relaxed text-slate-700 sm:text-base">{request.description}</p>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          {request.budget_min != null && request.budget_max != null ? (
            <span className="flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              {(request.budget_min / 10000).toFixed(0)}~{(request.budget_max / 10000).toFixed(0)}만원
            </span>
          ) : null}
          {request.deadline ? (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              마감 {request.deadline}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <Link
            to="/creators"
            className="min-h-11 text-base font-medium text-brand-700 hover:text-brand-900"
          >
            제작 전문가 찾기
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/applications"
            className="min-h-11 text-base font-medium text-brand-700 hover:text-brand-900"
          >
            내 제안
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
