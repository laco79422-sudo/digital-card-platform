import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Input } from "@/components/ui/Input";
import { HELPER_PROMO_CHANNELS } from "@/lib/helperCampaignPartnerUrls";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import {
  fetchHelperPartnerProfileForUser,
  insertHelperPartnerProfile,
} from "@/services/helperCampaignPartnerService";
import { fetchReferralSignupCount } from "@/services/referralService";
import { useAuthStore } from "@/stores/authStore";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const REFERRALS_REQUIRED = 5;

export function HelperPartnerRegisterPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [referralCount, setReferralCount] = useState<number | null>(null);
  const [existingProfile, setExistingProfile] = useState<boolean>(false);

  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("");
  const [picked, setPicked] = useState<string[]>(["kakao"]);
  const [channelDetail, setChannelDetail] = useState("");
  const [experience, setExperience] = useState("");
  const [strategy, setStrategy] = useState("");
  const [canConsult, setCanConsult] = useState(true);
  const [availableTime, setAvailableTime] = useState("");
  const [bio, setBio] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    void fetchReferralSignupCount(user.id).then(setReferralCount);
    void fetchHelperPartnerProfileForUser(user.id).then((p) => setExistingProfile(Boolean(p)));
  }, [user]);

  const toggleChannel = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const eligible = referralCount !== null && referralCount >= REFERRALS_REQUIRED && !existingProfile;

  const submit = async () => {
    if (!user?.id || !eligible || !ack) return;
    setBusy(true);
    try {
      const row = await insertHelperPartnerProfile({
        user_id: user.id,
        display_name: displayName.trim() || user.name?.trim() || "파트너",
        region: region.trim(),
        channels: picked,
        channel_detail: channelDetail.trim(),
        experience: experience.trim(),
        strategy: strategy.trim(),
        can_consult: canConsult,
        available_time: availableTime.trim(),
        bio: bio.trim(),
        terms_ack_at: new Date().toISOString(),
        referrer_signup_count_at_apply: referralCount ?? 0,
        status: "pending",
      });
      if (!row) {
        window.alert("신청 저장에 실패했습니다.");
        return;
      }
      window.alert("헬퍼링크 파트너 신청이 접수되었습니다. 추천 가입 성과 검증값이 참고됩니다.");
      navigate("/helper-partner/campaigns", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  if (!user?.id) {
    return (
      <div className={cn(layout.page, "py-12")}>
        <p className="text-slate-700">로그인 후 파트너 신청을 진행합니다.</p>
        <Link to="/login" className={cn("mt-4 inline-flex", linkButtonClassName({ size: "lg" }))}>로그인</Link>
      </div>
    );
  }

  return (
    <div className={cn(layout.page, "mx-auto max-w-2xl py-10")}>
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> 내 공간
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-slate-900">헬퍼링크 파트너 신청</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        추천 가입 5명 이상이면 헬퍼링크 파트너로 활동할 수 있습니다. 결제자가 요청한 홍보 목적과 내용을 숙지하고 활동해야 합니다.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-800">
        현재 내 추천으로 연결된 가입자:{" "}
        <strong>{referralCount === null ? "…" : `${referralCount}명`}</strong> / {REFERRALS_REQUIRED}명
      </div>

      {existingProfile ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          이미 파트너 프로필이 있습니다. 상태는 내 공간 또는 관리자 승인 흐름을 따릅니다.
        </p>
      ) : null}

      {!eligible && referralCount !== null ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
          헬퍼링크 파트너는 추천 가입 5명 이상부터 신청할 수 있습니다.
        </div>
      ) : null}

      {eligible ? (
        <fieldset disabled={busy} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-semibold">활동 이름</label>
            <Input className="mt-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold">활동 지역</label>
            <Input className="mt-2" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <div>
            <p className="text-sm font-semibold">가능한 홍보 채널</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {HELPER_PROMO_CHANNELS.map((ch) => (
                <label key={ch.id} className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-xs">
                  <input type="checkbox" checked={picked.includes(ch.id)} onChange={() => toggleChannel(ch.id)} />
                  {ch.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">보유 채널 설명</label>
            <textarea className="mt-2 w-full min-h-[72px] rounded-xl border px-3 py-2 text-sm" value={channelDetail} onChange={(e) => setChannelDetail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold">홍보 경험</label>
            <textarea className="mt-2 w-full min-h-[64px] rounded-xl border px-3 py-2 text-sm" value={experience} onChange={(e) => setExperience(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold">가능한 홍보 전략</label>
            <textarea className="mt-2 w-full min-h-[72px] rounded-xl border px-3 py-2 text-sm" value={strategy} onChange={(e) => setStrategy(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={canConsult} onChange={(e) => setCanConsult(e.target.checked)} />
            상담 가능
          </label>
          <div>
            <label className="text-sm font-semibold">고객 응대 가능 시간</label>
            <Input className="mt-2" value={availableTime} onChange={(e) => setAvailableTime(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold">활동 소개</label>
            <textarea className="mt-2 w-full min-h-[88px] rounded-xl border px-3 py-2 text-sm" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
            <label className="flex cursor-pointer items-start gap-2">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1" />
              <span>
                결제자가 요청한 홍보 목적과 내용을 숙지한 뒤 활동하겠습니다.
                허위·과장 홍보를 하지 않겠습니다.
                상담 내용은 내 공간에 기록하겠습니다.
              </span>
            </label>
          </div>

          <button
            type="button"
            disabled={!ack}
            className={cn(
              "w-full rounded-xl py-3 font-bold text-white shadow",
              ack ? "bg-brand-700 hover:bg-brand-800" : "cursor-not-allowed bg-slate-400",
            )}
            onClick={() => void submit()}
          >
            헬퍼링크 파트너 신청하기
          </button>
        </fieldset>
      ) : (
        referralCount !== null &&
        referralCount < REFERRALS_REQUIRED && (
          <p className="mt-6 text-sm text-slate-600">내 공간 의 추천 링크로 가입 연결 성과가 쌓이면 신청 버튼이 활성화됩니다.</p>
        )
      )}
    </div>
  );
}
