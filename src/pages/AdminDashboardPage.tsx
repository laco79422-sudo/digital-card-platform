import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatsCard } from "@/components/ui/StatsCard";
import { Textarea } from "@/components/ui/Textarea";
import { layout } from "@/lib/ui-classes";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { fetchDeletedProfilesAdmin, type DeletedProfileAdminRow } from "@/services/accountService";
import { useAppDataStore } from "@/stores/appDataStore";
import { CreditCard, ImageIcon, LayoutDashboard, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const ROLE_LABEL: Record<string, string> = {
  client: "명함 사용자",
  creator: "제작 전문가",
  admin: "관리자",
  company_admin: "기업 관리자",
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  subscription: "명함 사용자 구독",
  creator_membership: "제작 전문가 멤버십",
  linko_card_pro: "디지털 명함 프로(데모)",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  completed: "완료",
  pending: "대기",
  failed: "실패",
};

export function AdminDashboardPage() {
  const platformUsers = useAppDataStore((s) => s.platformUsers);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const serviceRequests = useAppDataStore((s) => s.serviceRequests);
  const applications = useAppDataStore((s) => s.applications);
  const payments = useAppDataStore((s) => s.payments);
  const creators = useAppDataStore((s) => s.creators);
  const featuredCreatorIds = useAppDataStore((s) => s.featuredCreatorIds);
  const setFeaturedCreatorIds = useAppDataStore((s) => s.setFeaturedCreatorIds);
  const banners = useAppDataStore((s) => s.banners);
  const setBanners = useAppDataStore((s) => s.setBanners);

  const [deletedProfilesRemote, setDeletedProfilesRemote] = useState<DeletedProfileAdminRow[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void fetchDeletedProfilesAdmin().then(setDeletedProfilesRemote);
  }, []);

  const deletedProfilesDisplay = useMemo(() => {
    return [...deletedProfilesRemote].sort((a, b) => {
      const ta = a.deleted_at ? new Date(a.deleted_at).getTime() : 0;
      const tb = b.deleted_at ? new Date(b.deleted_at).getTime() : 0;
      return tb - ta;
    });
  }, [deletedProfilesRemote]);

  const [bannerTitle, setBannerTitle] = useState(banners[0]?.title ?? "");
  const [bannerSub, setBannerSub] = useState(banners[0]?.subtitle ?? "");

  const revenue = useMemo(
    () => payments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0),
    [payments],
  );

  const toggleFeatured = (id: string) => {
    if (featuredCreatorIds.includes(id)) {
      setFeaturedCreatorIds(featuredCreatorIds.filter((x) => x !== id));
    } else {
      setFeaturedCreatorIds([...featuredCreatorIds, id]);
    }
  };

  const saveBanner = () => {
    if (!banners.length) return;
    const b = banners[0];
    setBanners([{ ...b, title: bannerTitle, subtitle: bannerSub }, ...banners.slice(1)]);
  };

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            관리 화면
          </h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            회원·명함·의뢰·결제·추천 제작 전문가·배너를 한 화면에서 다룰 수 있어요.
          </p>
        </div>
        <Badge tone="brand">관리자</Badge>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="회원 수" value={String(platformUsers.length)} icon={Users} />
        <StatsCard label="명함" value={String(businessCards.length)} icon={CreditCard} />
        <StatsCard label="의뢰" value={String(serviceRequests.length)} icon={LayoutDashboard} />
        <StatsCard
          label="완료 결제 합계"
          value={`₩${revenue.toLocaleString()}`}
          icon={ImageIcon}
          hint="샘플 데이터 기준"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-4">
        <Link
          to="/admin/withdrawals"
          className="text-base font-semibold text-brand-900 underline underline-offset-4 hover:text-brand-950"
        >
          출금 신청 · 추천 보상 관리로 이동 →
        </Link>
        <p className="mt-2 text-sm text-brand-900/80">
          탈퇴 회원의 출금·추천 내역은 아래 목록의 회원 ID와 출금 관리 화면을 대조해 확인하세요. 결제 기록은 DB 및 결제
          대시보드에서 유지됩니다.
        </p>
      </div>

      {isSupabaseConfigured && deletedProfilesDisplay.length > 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-base font-semibold">탈퇴 회원 (Supabase)</h2>
            <p className="text-sm text-slate-500">
              소멸 추정액은 referral_rewards.status = forfeited 합계입니다. 파트너 수익 취소는 별도 조회가 필요할 수
              있습니다.
            </p>
          </CardHeader>
          <CardContent className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-2 font-medium">회원 ID</th>
                  <th className="pb-2 font-medium">추천코드</th>
                  <th className="pb-2 font-medium">탈퇴일</th>
                  <th className="pb-2 font-medium">사유</th>
                  <th className="pb-2 font-medium text-right">소멸 추정(원)</th>
                </tr>
              </thead>
              <tbody>
                {deletedProfilesDisplay.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 align-top">
                    <td className="py-2 font-mono text-xs text-slate-700">{row.id}</td>
                    <td className="py-2 text-slate-600">{row.referral_code ?? "—"}</td>
                    <td className="py-2 text-slate-600">
                      {row.deleted_at
                        ? new Date(row.deleted_at).toLocaleString("ko-KR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="max-w-[200px] py-2 text-slate-600 break-words">{row.deletion_reason ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums font-medium text-slate-900">
                      {row.forfeitedReferralKrw.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">회원 목록</h2>
          </CardHeader>
          <CardContent className="max-h-64 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-2 font-medium">이름</th>
                  <th className="pb-2 font-medium">역할</th>
                  <th className="pb-2 font-medium">이메일</th>
                </tr>
              </thead>
              <tbody>
                {platformUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50">
                    <td className="py-2 font-medium text-slate-800">{u.name}</td>
                    <td className="py-2 text-slate-600">{ROLE_LABEL[u.role] ?? u.role}</td>
                    <td className="py-2 text-slate-500">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">결제 목록</h2>
          </CardHeader>
          <CardContent className="max-h-64 overflow-auto text-sm">
            <ul className="space-y-2">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <span className="text-slate-600">
                    {PAYMENT_TYPE_LABEL[p.payment_type] ?? p.payment_type}
                  </span>
                  <span className="font-medium text-slate-900">₩{p.amount.toLocaleString()}</span>
                  <Badge tone={p.status === "completed" ? "success" : "default"}>
                    {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-base font-semibold">명함 · 의뢰 · 지원 요약</h2>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="font-medium text-slate-900">명함 {businessCards.length}개</p>
            <p className="text-slate-500">공개 {businessCards.filter((c) => c.is_public).length}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">의뢰 {serviceRequests.length}건</p>
            <p className="text-slate-500">모집 중 {serviceRequests.filter((r) => r.status === "open").length}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">지원 {applications.length}건</p>
            <p className="text-slate-500">대기 {applications.filter((a) => a.status === "pending").length}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-base font-semibold">추천 제작 전문가 관리</h2>
          <p className="text-sm text-slate-500">랜딩 &quot;추천 제작 전문가&quot; 섹션에 노출됩니다.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {creators.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleFeatured(c.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                featuredCreatorIds.includes(c.id)
                  ? "bg-brand-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.display_name ?? c.id}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-base font-semibold">메인 배너 관리</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">제목</label>
            <Input className="mt-1" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">부제</label>
            <Textarea className="mt-1" rows={2} value={bannerSub} onChange={(e) => setBannerSub(e.target.value)} />
          </div>
          <Button type="button" onClick={saveBanner}>
            배너 저장 (로컬)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
