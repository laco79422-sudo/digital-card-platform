import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { ServiceApplication } from "@/types/domain";
import { CheckCircle2, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const typeLabels = {
  blog_writer: "블로그 작가",
  youtube_producer: "유튜브 영상",
  shortform_editor: "숏폼 편집자",
  thumbnail_designer: "썸네일 디자이너",
} as const;

export function CreatorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const creators = useAppDataStore((s) => s.creators);
  const serviceRequests = useAppDataStore((s) => s.serviceRequests);
  const addApplication = useAppDataStore((s) => s.addApplication);

  const creator = useMemo(() => creators.find((c) => c.id === id), [creators, id]);

  const openRequests = useMemo(
    () => serviceRequests.filter((r) => r.status === "open"),
    [serviceRequests],
  );

  const [open, setOpen] = useState(false);
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    setRequestId((prev) => {
      if (prev && openRequests.some((r) => r.id === prev)) return prev;
      return openRequests[0]?.id ?? "";
    });
  }, [openRequests]);
  const [proposal, setProposal] = useState("");
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");

  if (!creator) {
    return (
      <div className={cn(layout.pageCompact, "py-16 text-center sm:py-20")}>
        <p className="text-base leading-relaxed text-slate-800">프로필을 찾을 수 없습니다.</p>
        <Link
          to="/creators"
          className="mt-6 inline-flex min-h-[52px] items-center justify-center text-base font-semibold text-brand-700"
        >
          Expert 목록으로
        </Link>
      </div>
    );
  }

  const name = creator.display_name ?? "Expert";

  const submitApply = () => {
    if (!user || user.role !== "creator") {
      navigate("/login", { state: { from: `/creators/${creator.id}` } });
      return;
    }
    if (!requestId || !proposal.trim()) return;
    const app: ServiceApplication = {
      id: crypto.randomUUID(),
      request_id: requestId,
      creator_user_id: user.id,
      proposal_text: proposal,
      proposed_price: price ? Number(price) : null,
      estimated_days: days ? Number(days) : null,
      status: "pending",
      created_at: new Date().toISOString(),
      creator_name: user.name,
      request_title: openRequests.find((r) => r.id === requestId)?.title,
    };
    addApplication(app);
    setOpen(false);
    setProposal("");
    navigate("/applications");
  };

  return (
    <div className={cn(layout.pageEditor, "py-10 sm:py-12")}>
      <Link
        to="/creators"
        className="inline-flex min-h-11 items-center text-base font-medium text-brand-700"
      >
        ← Expert 목록
      </Link>
      <Card className="mt-6">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
                  {name}
                </h1>
                {creator.is_verified ? (
                  <CheckCircle2 className="h-6 w-6 text-brand-600" aria-hidden />
                ) : null}
              </div>
              <p className="mt-1 text-brand-800">{typeLabels[creator.creator_type]}</p>
              {creator.region ? (
                <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {creator.region}
                </p>
              ) : null}
            </div>
            <Badge tone="brand" className="self-start">
              {creator.min_price ? `${(creator.min_price / 10000).toFixed(0)}만원~` : "협의"}
            </Badge>
          </div>
          <p className="text-base leading-relaxed text-slate-800">{creator.intro}</p>
          {creator.portfolio_url ? (
            <a
              href={creator.portfolio_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-base font-medium text-brand-700 hover:underline"
            >
              포트폴리오 링크
            </a>
          ) : null}
          <div>
            <h2 className="text-lg font-semibold text-slate-900">포트폴리오 하이라이트</h2>
            <ul className="mt-2 list-inside list-disc text-[15px] leading-relaxed text-slate-700 sm:text-base">
              {(creator.portfolio_items_json ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            {(creator.categories_json ?? []).map((c) => (
              <Badge key={c} tone="default">
                {c}
              </Badge>
            ))}
          </div>
          <Button className="w-full min-h-[52px] sm:w-auto" size="lg" onClick={() => setOpen(true)}>
            의뢰에 제안 보내기
          </Button>
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="의뢰에 제안하기">
        <div className="space-y-4">
          {openRequests.length === 0 ? (
            <p className="text-base leading-relaxed text-slate-600">
              모집 중인 공개 의뢰가 없습니다.{" "}
              <Link to="/requests" className="font-medium text-brand-700">
                의뢰 목록
              </Link>
              을 확인해 주세요.
            </p>
          ) : (
          <div>
            <label className="text-base font-medium text-slate-800">의뢰 선택</label>
            <Select className="mt-1" value={requestId} onChange={(e) => setRequestId(e.target.value)}>
              {openRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </Select>
          </div>
          )}
          {openRequests.length > 0 ? (
            <>
          <div>
            <label className="text-base font-medium text-slate-800">제안 내용</label>
            <Textarea
              className="mt-1"
              rows={4}
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="경험, 일정, 진행 방식을 적어 주세요."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-base font-medium text-slate-800">제안 금액 (원)</label>
              <Input className="mt-1" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">예상 일수</label>
              <Input className="mt-1" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={submitApply}>
            제안 보내기
          </Button>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
