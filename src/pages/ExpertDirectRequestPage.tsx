import { EXPERT_REQUEST_PURPOSE_LABEL, WORK_CATEGORY_OPTIONS_BY_TYPE } from "@/components/experts/expertUiConstants";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { expertBadgeLabel } from "@/lib/expertLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { ExpertDirectRequest } from "@/types/domain";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

const purposeFallback = ["production", "promotion", "consult"] as const;

export function ExpertDirectRequestPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const purposeParam = searchParams.get("purpose");
  const initialPurpose =
    purposeParam === "promotion" || purposeParam === "consult" ? purposeParam : "production";

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const creators = useAppDataStore((s) => s.creators);
  const appendExpertDirectRequest = useAppDataStore((s) => s.appendExpertDirectRequest);

  const expert = useMemo(() => creators.find((c) => c.id === id), [creators, id]);

  const [purpose, setPurpose] = useState<(typeof purposeFallback)[number]>(initialPurpose);
  const [workCategory, setWorkCategory] = useState("");
  const [description, setDescription] = useState("");
  const [referenceLink, setReferenceLink] = useState("");
  const [budget, setBudget] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [contact, setContact] = useState(user?.phone ?? "");
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | null>(null);

  const workOptions = expert ? WORK_CATEGORY_OPTIONS_BY_TYPE[expert.creator_type] : [];

  const onPickFile = (file: File | null) => {
    setAttachmentDataUrl(null);
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setAttachmentDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!user || !expert?.id || !workCategory.trim() || description.trim().length < 10) return;
    const row: ExpertDirectRequest = {
      id: crypto.randomUUID(),
      title: `[${EXPERT_REQUEST_PURPOSE_LABEL[purpose]}] ${workCategory.trim()}`.slice(0, 200),
      requester_id: user.id,
      expert_id: expert.id,
      request_purpose: purpose,
      work_category: workCategory.trim(),
      description: description.trim(),
      reference_link: referenceLink.trim() || null,
      budget:
        budget.trim() && Number.isFinite(Number(budget.replace(/,/g, "")))
          ? Number(budget.replace(/,/g, ""))
          : null,
      due_date: dueDate || null,
      contact: contact.trim() || user.email || null,
      attachment_url: attachmentDataUrl,
      status: "requested",
      created_at: new Date().toISOString(),
      requester_name: user.name,
    };
    appendExpertDirectRequest(row);
    navigate("/dashboard");
  };

  if (!expert) {
    return (
      <div className={cn(layout.pageCompact, "py-16 text-center")}>
        <p>전문가를 찾을 수 없습니다.</p>
        <Link to="/creators" className="mt-4 inline-block font-semibold text-brand-700">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(layout.pageForm, "py-10 sm:py-12")}>
      <Link to={`/creators/${expert.id}`} className="inline-flex min-h-10 text-sm font-semibold text-brand-700">
        ← 프로필로
      </Link>
      <Card className="mt-6">
        <CardHeader>
          <h1 className="text-2xl font-bold text-slate-900">직접 의뢰하기</h1>
          <p className="mt-1 text-slate-600">
            전문가: <span className="font-semibold text-slate-900">{expert.display_name}</span>(
            {expertBadgeLabel(expert.creator_type)})
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-900">의뢰 형태</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {purposeFallback.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={cn(
                    "min-h-10 rounded-full px-4 text-sm font-semibold ring-1",
                    purpose === p
                      ? "bg-brand-900 text-white ring-brand-900"
                      : "bg-white text-slate-700 ring-slate-300",
                  )}
                >
                  {EXPERT_REQUEST_PURPOSE_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900" htmlFor="workCategory">
              의뢰 유형
            </label>
            <Select
              id="workCategory"
              className="mt-1"
              value={workCategory}
              onChange={(e) => setWorkCategory(e.target.value)}
            >
              <option value="">선택하세요</option>
              {workOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900">원하는 작업 설명</label>
            <Textarea className="mt-1 min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900">참고 링크</label>
            <Input className="mt-1" value={referenceLink} onChange={(e) => setReferenceLink(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">예산 (원, 선택)</label>
              <Input className="mt-1" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">희망 완료일</label>
              <Input className="mt-1" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900">연락처</label>
            <Input className="mt-1" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="연락 가능한 방법" />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900">첨부 이미지 (선택)</label>
            <input type="file" accept="image/*" className="mt-2 block text-sm text-slate-600" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
          </div>

          <Button
            size="lg"
            className="w-full min-h-[52px]"
            type="button"
            disabled={!workCategory.trim() || description.trim().length < 10}
            onClick={submit}
          >
            의뢰 접수하기
          </Button>
          <p className="text-center text-xs text-slate-500">
            접수 후 내 공간에서 진행 상태를 확인할 수 있어요. (데모에서는 로컬에 저장됩니다)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
