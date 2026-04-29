import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { getSupabaseConfigErrorMessage, isSupabaseConfigured } from "@/lib/supabase/client";
import { createAdvertisement } from "@/services/rewardAdsService";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function AdsCreatePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [budget, setBudget] = useState("50000");
  const [costPerClick, setCostPerClick] = useState("100");
  const [rewardPerClick, setRewardPerClick] = useState("50");
  const [adType, setAdType] = useState<"banner" | "click_reward">("click_reward");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user?.id) {
      setError("로그인이 필요합니다.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError(getSupabaseConfigErrorMessage());
      return;
    }
    const b = Number.parseInt(budget.replace(/\D/g, ""), 10);
    const cpc = Number.parseInt(costPerClick.replace(/\D/g, ""), 10);
    const rpc = Number.parseInt(rewardPerClick.replace(/\D/g, ""), 10);
    if (!title.trim()) {
      setError("광고 제목을 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(b) || b <= 0) {
      setError("예산을 올바르게 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(cpc) || cpc <= 0) {
      setError("클릭당 광고비를 올바르게 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(rpc) || rpc < 0) {
      setError("사용자 리워드 금액을 올바르게 입력해 주세요.");
      return;
    }
    if (rpc > cpc) {
      setError("사용자 리워드는 클릭당 광고비를 넘을 수 없습니다.");
      return;
    }
    setBusy(true);
    try {
      const { id, error: insErr } = await createAdvertisement({
        advertiser_user_id: user.id,
        title,
        description,
        image_url: imageUrl || undefined,
        target_url: targetUrl || undefined,
        ad_type: adType,
        budget: b,
        cost_per_click: cpc,
        reward_per_click: rpc,
      });
      if (insErr) {
        setError(insErr);
        return;
      }
      if (id) navigate("/ads/dashboard", { replace: true });
      else setError("등록 후 식별자를 받지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">광고 등록</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">새 리워드 광고</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          예산은 클릭 시 차감되며, 참여자에게는 설정한 포인트가 적립됩니다.
        </p>

        <Card className="mt-8 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <p className="text-base font-bold text-slate-900">소재·예산</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={(e) => void handleSubmit(e)}>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-800">광고 유형</span>
                <Select value={adType} onChange={(e) => setAdType(e.target.value as "banner" | "click_reward")}>
                  <option value="banner">배너 광고</option>
                  <option value="click_reward">클릭 리워드 광고</option>
                </Select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-800">광고 제목</span>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-800">설명</span>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-800">이미지 URL</span>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-800">이동 링크</span>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-800">예산 (원, 남은 예산)</span>
                <Input inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-800">클릭당 광고비 (원)</span>
                <Input inputMode="numeric" value={costPerClick} onChange={(e) => setCostPerClick(e.target.value)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-800">사용자 리워드 (포인트/클릭)</span>
                <Input inputMode="numeric" value={rewardPerClick} onChange={(e) => setRewardPerClick(e.target.value)} />
              </label>

              {error ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" className="min-h-11 min-w-[140px] gap-2 font-bold" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  광고 등록하기
                </Button>
                <Link to="/ads/dashboard" className={linkButtonClassName({ variant: "outline", size: "md" })}>
                  대시보드
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
