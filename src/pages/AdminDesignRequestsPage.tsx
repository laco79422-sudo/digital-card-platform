import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import {
  DESIGN_REQUEST_PAYMENT_STATUS_LABEL,
  DESIGN_REQUEST_STATUS_LABEL,
  DESIGN_REQUEST_STYLE_LABEL,
} from "@/lib/designRequestLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { fetchAllDesignRequests } from "@/services/designRequestsService";
import { useAppDataStore } from "@/stores/appDataStore";
import { useEffect } from "react";

export function AdminDesignRequestsPage() {
  const designRequests = useAppDataStore((s) => s.designRequests);
  const setDesignRequests = useAppDataStore((s) => s.setDesignRequests);

  useEffect(() => {
    void fetchAllDesignRequests().then((requests) => {
      if (requests) setDesignRequests(requests);
    });
  }, [setDesignRequests]);

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            디자인 제작 의뢰 관리
          </h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            제작 전문가에게 맡긴 의뢰를 확인하고 결제·진행 상태를 관리할 수 있는 기본 화면입니다.
          </p>
        </div>
        <Badge tone="brand">관리자</Badge>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">의뢰 목록</h2>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="pb-2 font-medium">의뢰자 이름</th>
                <th className="pb-2 font-medium">연락처</th>
                <th className="pb-2 font-medium">이메일</th>
                <th className="pb-2 font-medium">업종</th>
                <th className="pb-2 font-medium">스타일</th>
                <th className="pb-2 font-medium">요청사항</th>
                <th className="pb-2 font-medium">결제 상태</th>
                <th className="pb-2 font-medium">진행 상태</th>
                <th className="pb-2 font-medium">생성일</th>
              </tr>
            </thead>
            <tbody>
              {designRequests.map((request) => (
                <tr key={request.id} className="border-b border-slate-50 align-top">
                  <td className="py-3 font-medium text-slate-900">{request.name}</td>
                  <td className="py-3 text-slate-600">{request.phone}</td>
                  <td className="py-3 text-slate-600">{request.email}</td>
                  <td className="py-3 text-slate-600">{request.business_type}</td>
                  <td className="py-3 text-slate-600">{DESIGN_REQUEST_STYLE_LABEL[request.style]}</td>
                  <td className="max-w-xs py-3 text-slate-600">{request.request_message}</td>
                  <td className="py-3 text-slate-600">
                    {DESIGN_REQUEST_PAYMENT_STATUS_LABEL[request.payment_status]}
                  </td>
                  <td className="py-3 text-slate-600">{DESIGN_REQUEST_STATUS_LABEL[request.status]}</td>
                  <td className="py-3 text-slate-500">
                    {new Date(request.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {designRequests.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">아직 접수된 디자인 의뢰가 없습니다.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
