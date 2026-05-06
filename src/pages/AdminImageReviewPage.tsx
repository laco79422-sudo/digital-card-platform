import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { layout } from "@/lib/ui-classes";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  approveBrandImageModeration,
  createSignedUrlForPendingPath,
  deletePendingBrandImageModeration,
  fetchPendingBrandImageCards,
  rejectBrandImageModeration,
} from "@/services/brandImageModerationService";
import { useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard } from "@/types/domain";
import { Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function AdminImageReviewPage() {
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const [rows, setRows] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await fetchPendingBrandImageCards();
    setRows(list);
    const next: Record<string, string> = {};
    for (const c of list) {
      const p = c.brand_image_pending_path?.trim();
      if (!p) continue;
      const url = await createSignedUrlForPendingPath(p);
      if (url) next[c.id] = url;
    }
    setPreviewUrls(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const empty = useMemo(() => rows.length === 0, [rows.length]);

  const onApprove = async (card: BusinessCard) => {
    setBusyId(card.id);
    try {
      const res = await approveBrandImageModeration(card);
      if (res.ok && res.publicUrl) {
        upsertBusinessCard({
          ...card,
          brand_image_status: "approved",
          brand_image_pending_path: null,
          brand_image_reject_reason: null,
          brand_image_pending_uploaded_at: null,
          image_url: res.publicUrl,
          brand_image_url: res.publicUrl,
          imageUrl: res.publicUrl,
        });
        await load();
      } else if (res.ok) {
        await load();
      } else {
        window.alert(res.error ?? "승인 처리에 실패했습니다.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const onReject = async (card: BusinessCard) => {
    const reason =
      rejectReasons[card.id]?.trim() ||
      "콘텐츠 정책에 맞지 않습니다.";
    setBusyId(card.id);
    try {
      const res = await rejectBrandImageModeration(card, reason);
      if (res.ok) {
        upsertBusinessCard({
          ...card,
          brand_image_status: "rejected_manual",
          brand_image_reject_reason: reason,
          brand_image_pending_path: null,
          brand_image_pending_uploaded_at: null,
        });
        await load();
      } else {
        window.alert(res.error ?? "거절 처리에 실패했습니다.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (card: BusinessCard) => {
    if (!window.confirm("검수 대기 이미지를 삭제하고 기록만 남길까요?")) return;
    setBusyId(card.id);
    try {
      const res = await deletePendingBrandImageModeration(card);
      if (res.ok) {
        upsertBusinessCard({
          ...card,
          brand_image_status: "rejected_manual",
          brand_image_reject_reason: "관리자에 의해 삭제되었습니다.",
          brand_image_pending_path: null,
          brand_image_pending_uploaded_at: null,
        });
        await load();
      } else {
        window.alert(res.error ?? "삭제에 실패했습니다.");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/admin"
            className="text-sm font-medium text-brand-800 underline underline-offset-4 hover:text-brand-950"
          >
            ← 관리 화면
          </Link>
          <h1 className="mt-2 break-keep text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            이미지 검수
          </h1>
          <p className="mt-1 text-slate-600">
            업로드된 대표 이미지를 검토한 뒤 승인 시 공개 명함에만 반영됩니다.
          </p>
        </div>
        <Badge tone="brand" className="w-fit gap-1">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          관리자
        </Badge>
      </div>

      {!isSupabaseConfigured ? (
        <p className="mt-10 text-center text-slate-600">Supabase가 설정되지 않았습니다.</p>
      ) : loading ? (
        <div className="mt-16 flex justify-center text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" aria-label="로딩" />
        </div>
      ) : empty ? (
        <p className="mt-16 text-center text-slate-600">검수 대기 중인 이미지가 없습니다.</p>
      ) : (
        <div className="mt-10 grid gap-6">
          {rows.map((card) => {
            const preview = previewUrls[card.id];
            const busy = busyId === card.id;
            return (
              <Card key={card.id} className="overflow-hidden border-slate-200/80">
                <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {card.person_name || "이름 없음"} · {card.brand_name || "브랜드 없음"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        카드 ID · {card.id}
                        <br />
                        소유자 · {card.user_id}
                        <br />
                        슬러그 · {card.slug}
                        <br />
                        상태 · <span className="font-medium text-amber-800">pending</span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 py-5 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-start">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {preview ? (
                      <img src={preview} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-xs text-slate-500">
                        미리보기 URL 없음
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      업로드 경로 · {card.brand_image_pending_path ?? "—"}
                    </p>
                    <label className="block text-sm font-medium text-slate-700">거절 사유 (선택)</label>
                    <Textarea
                      value={rejectReasons[card.id] ?? ""}
                      onChange={(e) =>
                        setRejectReasons((m) => ({ ...m, [card.id]: e.target.value }))
                      }
                      placeholder="거절 시 사용자에게 전달할 짧은 사유"
                      rows={3}
                      className="resize-y"
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button type="button" disabled={busy} onClick={() => void onApprove(card)}>
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        승인
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void onReject(card)}
                      >
                        거절
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-700"
                        disabled={busy}
                        onClick={() => void onDelete(card)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
