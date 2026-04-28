import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  DESIGN_REQUEST_PAYMENT_STATUS_LABEL,
  DESIGN_REQUEST_STATUS_LABEL,
  DESIGN_REQUEST_STYLE_LABEL,
} from "@/lib/designRequestLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { fetchAssignedDesignRequests, updateDesignRequestRemote } from "@/services/designRequestsService";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useMemo, useState } from "react";

export function DesignerRequestsPage() {
  const user = useAuthStore((s) => s.user);
  const designRequests = useAppDataStore((s) => s.designRequests);
  const setDesignRequests = useAppDataStore((s) => s.setDesignRequests);
  const updateDesignRequest = useAppDataStore((s) => s.updateDesignRequest);
  const [draftUrls, setDraftUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.id) return;
    void fetchAssignedDesignRequests(user.id).then((requests) => {
      if (requests) setDesignRequests(requests);
    });
  }, [setDesignRequests, user?.id]);

  const assignedRequests = useMemo(
    () => designRequests.filter((request) => request.assigned_designer_id === user?.id),
    [designRequests, user?.id],
  );

  const submitDraft = async (requestId: string) => {
    const url = draftUrls[requestId]?.trim();
    if (!url) return;
    const patch = {
      draft_image_url: url,
      status: "draft_submitted" as const,
      updated_at: new Date().toISOString(),
    };
    updateDesignRequest(requestId, patch);
    await updateDesignRequestRemote(requestId, patch);
  };

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            배정된 디자인 의뢰
          </h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            Expert에게 배정된 의뢰를 확인하고 시안 이미지 URL을 제출합니다.
          </p>
        </div>
        <Badge tone="brand">Expert</Badge>
      </div>

      <div className="mt-8 grid gap-4">
        {assignedRequests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{request.name}님의 명함 디자인</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {request.business_type} · {DESIGN_REQUEST_STYLE_LABEL[request.style]}
                  </p>
                </div>
                <Badge tone="default">{DESIGN_REQUEST_STATUS_LABEL[request.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <p>연락처: {request.phone}</p>
                <p>이메일: {request.email}</p>
                <p>결제 상태: {DESIGN_REQUEST_PAYMENT_STATUS_LABEL[request.payment_status]}</p>
                <p>참고 링크: {request.reference_url || "없음"}</p>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
                {request.request_message}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={draftUrls[request.id] ?? request.draft_image_url ?? ""}
                  onChange={(e) => setDraftUrls((prev) => ({ ...prev, [request.id]: e.target.value }))}
                  placeholder="시안 이미지 URL"
                />
                <Button type="button" onClick={() => void submitDraft(request.id)}>
                  시안 제출
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {assignedRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <p className="text-lg font-bold text-slate-900">아직 배정된 의뢰가 없습니다.</p>
            <p className="mt-2 text-sm text-slate-500">관리자 배정 기능은 이후 role 기반 권한과 함께 확장할 수 있습니다.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
