import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useCardEditorDraftStore, type CardEditorDraft } from "@/stores/cardEditorDraftStore";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { slugify } from "@/stores/appDataStore";

/** 규칙 기반 초안 — 실제 LLM 연결 전 확인용 카피 */
function draftFromAiInputs(input: {
  industry: string;
  region: string;
  services: string;
  edge: string;
}): Partial<CardEditorDraft> {
  const ind = input.industry.trim() || "서비스";
  const region = input.region.trim() || "주요 활동 지역";
  const svc = input.services.trim() || `${ind} 상담`;
  const hook = input.edge.trim() || `${ind} 현장에서 쌓은 경험으로 빠르게 방향을 잡아 드립니다.`;
  return {
    marketing_title: `${region}에서 만나는 ${ind}`,
    tagline: hook.slice(0, 140),
    intro:
      `[주요 서비스]\n${svc}\n\n` +
      `${hook}\n\n` +
      `아래 버튼으로 문의 주시면 내용 확인 후 순서대로 회신 드립니다.`,
    trust_metric: svc.split(/[\n,，]/)[0]?.trim()?.slice(0, 80) || ind,
  };
}

export function DelegateExpertChoiceModal({
  open,
  onClose,
  cardTypeHint,
}: {
  open: boolean;
  onClose: () => void;
  cardTypeHint: CardEditorDraft["card_type"];
}) {
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);
  const replaceDraft = useCardEditorDraftStore((s) => s.replaceDraft);
  const draft = useCardEditorDraftStore((s) => s.draft);
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [services, setServices] = useState("");
  const [edge, setEdge] = useState("");
  const [previewPatch, setPreviewPatch] = useState<Partial<CardEditorDraft> | null>(null);

  const closeAll = () => {
    setAiOpen(false);
    setPreviewPatch(null);
    onClose();
  };

  const runAiStub = useCallback(() => {
    const patch = draftFromAiInputs({ industry, region, services, edge });
    setPreviewPatch(patch);
  }, [industry, region, services, edge]);

  const applyAiDraft = useCallback(() => {
    if (!previewPatch) return;
    replaceDraft({
      ...draft,
      ...previewPatch,
      slug: draft.slug.trim() || slugify(`${industry || "내"} 명함`),
    });
    closeAll();
  }, [previewPatch, replaceDraft, draft, industry]);

  const goExperts = () => {
    navigate("/creators");
    closeAll();
  };

  const goRequest = () => {
    navigate("/requests/new");
    closeAll();
  };

  const extraRetail =
    cardTypeHint === "location"
      ? "매장 주소는 어디인가요?\n영업시간은 어떻게 되나요?\n대표 메뉴나 상품은 무엇인가요?\n예약이 필요한가요?\n\n"
      : "";
  const extraBiz =
    cardTypeHint === "store"
      ? "업종과 주요 서비스 3가지, 상담·견적 방식도 알려주시면 명확하게 정리해 드립니다.\n\n"
      : "";

  const humanBrief = (
    <>
      <p className="text-sm leading-relaxed text-slate-600">
        의뢰 메시지에 그대로 붙여 넣거나, 각 항목을 참고해 작성해 주세요.
      </p>
      <Textarea
        readOnly
        className="mt-3 font-mono text-xs"
        rows={11}
        value={`어떤 일을 하시나요?\n어떤 고객을 만나고 싶나요?\n주로 어느 지역에서 활동하시나요?\n꼭 알리고 싶은 장점은 무엇인가요?\n참고할 홈페이지 / 블로그 / 인스타그램이 있나요?\n사용할 이미지가 있나요?\n\n${extraBiz}${extraRetail}`}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={goExperts}>
          제작 전문가 찾기
        </Button>
        <Button type="button" onClick={goRequest}>
          의뢰 작성하기
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Modal open={open && !aiOpen} onClose={closeAll} title="어떤 방식으로 맡기시겠어요?" className="max-w-lg">
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          직접 쓰기 어렵다면 전문가·AI 중 편한 방식을 선택하세요. 결과는 저장 전에 반드시 확인하게 되어 있습니다.
        </p>
        <div className="space-y-3">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
            <span className="text-base font-bold text-slate-900">사람 전문가에게 맡기기</span>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              참고 자료를 주시면 문구와 정보 구조를 함께 정리합니다. 체크리스트를 복사해 의뢰 글에 붙여 넣을 수 있습니다.
            </p>
            <div className="mt-3">{humanBrief}</div>
          </div>

          <button
            type="button"
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-400"
            onClick={() => setAiOpen(true)}
          >
            <span className="text-base font-bold text-slate-900">AI가 먼저 채우기</span>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              업종·지역·제공 내용만 적어도 초안 카피가 만들어집니다. 아래 초안 미리 보기 후, 편집기에 반영할지 직접 결정합니다.
            </p>
          </button>

          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <span className="text-base font-bold text-slate-500">AI 초안 + 전문가 다듬기</span>
            <p className="mt-2 text-sm text-slate-500">
              AI가 초안을 만든 뒤 전문가가 톤을 다듬는 패키지는 준비 중입니다. 먼저 「AI가 먼저 채우기」 후 의뢰를 남겨 주시면 비슷한 흐름으로 연결됩니다.
            </p>
          </div>
        </div>
      </Modal>

      <Modal open={open && aiOpen} onClose={() => setAiOpen(false)} title="AI 초안 만들기" className="max-w-lg">
        <p className="mb-4 text-sm text-slate-600">
          항목을 채운 뒤 초안 생성을 누르세요. 내용은 편집기에 적용하기 전까지 저장되지 않습니다.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-800">업종 또는 하는 일</label>
            <Input
              className="mt-1"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="예: 인테리어 / 헤어 디자이너"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">주요 활동 지역</label>
            <Input
              className="mt-1"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="예: 서울 강남 · 경기 성남"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">주요 서비스 (쉼표로 구분해도 됩니다)</label>
            <Textarea className="mt-1" rows={3} value={services} onChange={(e) => setServices(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">차별점·강점</label>
            <Textarea className="mt-1" rows={3} value={edge} onChange={(e) => setEdge(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={runAiStub}>
            초안 생성하기
          </Button>
          {previewPatch ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm leading-relaxed text-slate-800">
              <p className="font-bold text-emerald-950">미리보기</p>
              <p className="mt-2 font-semibold">{previewPatch.marketing_title}</p>
              <p className="mt-1">{previewPatch.tagline}</p>
              <p className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{previewPatch.intro}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" onClick={applyAiDraft}>
                  명함 편집기에 적용
                </Button>
                <Button type="button" variant="outline" onClick={() => setPreviewPatch(null)}>
                  취소
                </Button>
              </div>
              <p className="mt-3 text-[11px] text-slate-600">실제 게시 전에 문구와 연락처를 반드시 확인해 주세요.</p>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
