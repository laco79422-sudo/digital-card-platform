import { EXPERT_REQUEST_PURPOSE_LABEL, EXPERT_TYPE_VALUES } from "@/components/experts/expertUiConstants";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { expertBadgeLabel, expertProductionServiceLabels } from "@/lib/expertLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { CreatorProfile, CreatorType, ExpertPortfolioPublic, ExpertStatus } from "@/types/domain";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type RequestChannelAnswer = "production" | "promotion" | "both";

const CARD_CARD_TYPES = ["개인형", "사업자형", "매장형"];
const CARD_STYLES = ["깔끔한", "고급스러운", "친근한", "영업형"];
const CARD_SCOPES = ["문구 작성", "이미지 구성", "상세페이지 구성", "공유 문구 작성"];
const BLOG_TYPES = ["네이버 블로그", "구글 SEO 글", "홍보 글", "후기형 글"];
const VIDEO_TYPES = ["숏폼", "유튜브 영상", "홍보 영상", "제품 소개 영상"];
const PROGRAM_WORKS = ["웹앱 제작", "자동화 프로그램", "데이터 수집", "관리자 페이지"];

function ToggleRow({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: string[];
  selected: Set<string>;
  onToggle: (item: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-900">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const checked = selected.has(item);
          return (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(item)} className="h-4 w-4 rounded border-slate-400" />
              <span>{item}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ExpertApplyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const upsertCreatorProfile = useAppDataStore((s) => s.upsertCreatorProfile);

  const [creatorType, setCreatorType] = useState<CreatorType>("blog");
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [intro, setIntro] = useState("");
  const [bioDetail, setBioDetail] = useState("");
  const [region, setRegion] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [mainFieldsRaw, setMainFieldsRaw] = useState("");
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDesc, setPortfolioDesc] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [portfolioImageUrl, setPortfolioImageUrl] = useState<string | null>(null);
  const [requestChannel, setRequestChannel] = useState<RequestChannelAnswer>("both");
  const [expertStatus, setExpertStatus] = useState<ExpertStatus>("active");

  const [cardTypesSel, setCardTypesSel] = useState(() => new Set<string>());
  const [cardStylesSel, setCardStylesSel] = useState(() => new Set<string>());
  const [cardScopesSel, setCardScopesSel] = useState(() => new Set<string>());
  const [blogTypesSel, setBlogTypesSel] = useState(() => new Set<string>());
  const [blogSpecialty, setBlogSpecialty] = useState("");
  const [blogMonthly, setBlogMonthly] = useState("");
  const [videoTypesSel, setVideoTypesSel] = useState(() => new Set<string>());
  const [videoTools, setVideoTools] = useState("");
  const [videoExtraLink, setVideoExtraLink] = useState("");
  const [programWorksSel, setProgramWorksSel] = useState(() => new Set<string>());
  const [programStack, setProgramStack] = useState("");
  const [programLink, setProgramLink] = useState("");

  const toggle = (setter: Dispatch<SetStateAction<Set<string>>>, item: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const onPickPortfolioImage = (file: File | null) => {
    setPortfolioImageUrl(null);
    if (!file?.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => setPortfolioImageUrl(typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(file);
  };

  const buildFacets = (): Record<string, unknown> => {
    const base = { expert_apply_version: 1 };
    if (creatorType === "card_design") {
      return { ...base, card_types: [...cardTypesSel], styles: [...cardStylesSel], scopes: [...cardScopesSel] };
    }
    if (creatorType === "blog") {
      return {
        ...base,
        blog_post_types: [...blogTypesSel],
        specialty: blogSpecialty,
        monthly_capacity: blogMonthly,
      };
    }
    if (creatorType === "video") {
      return {
        ...base,
        video_types: [...videoTypesSel],
        tools: videoTools,
        extra_portfolio_link: videoExtraLink,
      };
    }
    return { ...base, program_works: [...programWorksSel], stack: programStack, link: programLink };
  };

  const submit = () => {
    if (!user || !displayName.trim() || !intro.trim()) return;

    let channels: CreatorProfile["request_channels_json"];
    if (requestChannel === "both") channels = ["production", "promotion"];
    else channels = [requestChannel];

    const portfolio: ExpertPortfolioPublic | undefined =
      portfolioTitle.trim() || portfolioDesc.trim() || portfolioLink.trim() || portfolioImageUrl
        ? {
            id: crypto.randomUUID(),
            title: portfolioTitle.trim() || "포트폴리오 대표작",
            description: portfolioDesc.trim() || null,
            image_url: portfolioImageUrl,
            link_url: portfolioLink.trim() || null,
            portfolio_type: expertBadgeLabel(creatorType),
          }
        : undefined;

    const categories = mainFieldsRaw
      .split(/[,·]/u)
      .map((t: string) => t.trim())
      .filter(Boolean);

    upsertCreatorProfile({
      id: crypto.randomUUID(),
      user_id: user.id,
      creator_type: creatorType,
      intro: intro.trim(),
      bio_detail: bioDetail.trim() || null,
      portfolio_url: portfolioLink.trim() || null,
      portfolio_items_json: [],
      portfolios_rich_json: portfolio ? [portfolio] : [],
      min_price: null,
      region: region.trim() || null,
      available_time_text: availableTime.trim() || null,
      categories_json: categories.length ? categories : null,
      offered_services_json: expertProductionServiceLabels[creatorType],
      request_channels_json: channels ?? null,
      type_facets_json: buildFacets(),
      is_verified: false,
      expert_status: expertStatus,
      accepting_requests: true,
      portfolio_count_override: portfolio ? 1 : 0,
      review_count: 0,
      created_at: new Date().toISOString(),
      display_name: displayName.trim(),
      who_for_text: null,
      work_style_text: null,
    });
    navigate("/creators");
  };

  if (!user) return null;

  return (
    <div className={cn(layout.pageForm, "py-10 sm:py-12")}>
      <Link to="/creators" className="inline-flex min-h-10 text-sm font-semibold text-brand-700">
        ← 목록으로
      </Link>
      <Card className="mt-6">
        <CardHeader>
          <h1 className="break-keep text-2xl font-bold text-slate-900">전문가로 등록하기</h1>
          <p className="mt-2 text-slate-600">
            나도 전문가로 등록하고 의뢰를 받아 보세요. 제출 후 목록에 바로 보이며, DB 연동 시 status 필드로 검수를 붙일 수 있습니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-900">이름</label>
              <Input className="mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">전문가 유형</label>
              <Select className="mt-1" value={creatorType} onChange={(e) => setCreatorType(e.target.value as CreatorType)}>
                {EXPERT_TYPE_VALUES.map((t) => (
                  <option key={t} value={t}>
                    {expertBadgeLabel(t)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">노출 status</label>
              <Select className="mt-1" value={expertStatus} onChange={(e) => setExpertStatus(e.target.value as ExpertStatus)}>
                <option value="active">active (즉시 노출)</option>
                <option value="pending">pending (추후 검수)</option>
                <option value="hidden">hidden</option>
                <option value="rejected">rejected</option>
              </Select>
              <p className="mt-2 text-xs text-slate-500">운영에서는 pending → 검수 후 active 패턴 추천</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-900">한 줄 소개</label>
              <Input className="mt-1" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="카드 노출되는 한 줄" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-900">상세 소개</label>
              <Textarea className="mt-1 min-h-[140px]" value={bioDetail} onChange={(e) => setBioDetail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">활동 지역</label>
              <Input className="mt-1" value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">연락 가능 시간</label>
              <Input className="mt-1" value={availableTime} onChange={(e) => setAvailableTime(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-900">주요 작업 분야 (쉼표 또는 · 구분)</label>
              <Input className="mt-1" value={mainFieldsRaw} onChange={(e) => setMainFieldsRaw(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">희망 의뢰 유형 받기</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["production", EXPERT_REQUEST_PURPOSE_LABEL.production],
                  ["promotion", EXPERT_REQUEST_PURPOSE_LABEL.promotion],
                  ["both", "둘 다 가능"],
                ] as const
              ).map(([id, lbl]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRequestChannel(id)}
                  className={cn(
                    "min-h-10 rounded-full px-4 text-sm font-semibold ring-1 ring-slate-300",
                    requestChannel === id && "bg-brand-900 text-white ring-brand-900",
                  )}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">대표 포트폴리오</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-800">제목</label>
                <Input className="mt-1" value={portfolioTitle} onChange={(e) => setPortfolioTitle(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-800">설명</label>
                <Textarea className="mt-1" rows={3} value={portfolioDesc} onChange={(e) => setPortfolioDesc(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800">링크</label>
                <Input className="mt-1" value={portfolioLink} onChange={(e) => setPortfolioLink(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800">이미지 업로드</label>
                <input type="file" accept="image/*" className="mt-2 block text-sm" onChange={(e) => onPickPortfolioImage(e.target.files?.[0] ?? null)} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">유형별 추가 정보</h2>
            {creatorType === "card_design" ? (
              <div className="mt-4 space-y-4">
                <ToggleRow label="가능한 명함 유형" items={CARD_CARD_TYPES} selected={cardTypesSel} onToggle={(i) => toggle(setCardTypesSel, i)} />
                <ToggleRow label="디자인 스타일" items={CARD_STYLES} selected={cardStylesSel} onToggle={(i) => toggle(setCardStylesSel, i)} />
                <ToggleRow label="작업 가능 범위" items={CARD_SCOPES} selected={cardScopesSel} onToggle={(i) => toggle(setCardScopesSel, i)} />
              </div>
            ) : null}
            {creatorType === "blog" ? (
              <div className="mt-4 space-y-4">
                <ToggleRow label="작성 가능한 글 유형" items={BLOG_TYPES} selected={blogTypesSel} onToggle={(i) => toggle(setBlogTypesSel, i)} />
                <div>
                  <label className="text-sm font-semibold text-slate-900">전문 분야 한 줄</label>
                  <Input className="mt-1" value={blogSpecialty} onChange={(e) => setBlogSpecialty(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-900">월 작업 가능 수량</label>
                  <Input className="mt-1" value={blogMonthly} onChange={(e) => setBlogMonthly(e.target.value)} placeholder="예: 월 8편" />
                </div>
              </div>
            ) : null}
            {creatorType === "video" ? (
              <div className="mt-4 space-y-4">
                <ToggleRow label="가능한 영상 유형" items={VIDEO_TYPES} selected={videoTypesSel} onToggle={(i) => toggle(setVideoTypesSel, i)} />
                <div>
                  <label className="text-sm font-semibold text-slate-900">편집 가능 프로그램</label>
                  <Input className="mt-1" value={videoTools} onChange={(e) => setVideoTools(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-900">추가 영상 포트폴리오 링크</label>
                  <Input className="mt-1" value={videoExtraLink} onChange={(e) => setVideoExtraLink(e.target.value)} />
                </div>
              </div>
            ) : null}
            {creatorType === "program" ? (
              <div className="mt-4 space-y-4">
                <ToggleRow label="가능한 작업" items={PROGRAM_WORKS} selected={programWorksSel} onToggle={(i) => toggle(setProgramWorksSel, i)} />
                <div>
                  <label className="text-sm font-semibold text-slate-900">사용 기술</label>
                  <Input className="mt-1" value={programStack} onChange={(e) => setProgramStack(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-900">GitHub 또는 작업 링크</label>
                  <Input className="mt-1" value={programLink} onChange={(e) => setProgramLink(e.target.value)} />
                </div>
              </div>
            ) : null}
          </div>

          <Button size="lg" className="w-full min-h-[52px]" type="button" disabled={!displayName.trim() || !intro.trim()} onClick={submit}>
            등록 완료
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
