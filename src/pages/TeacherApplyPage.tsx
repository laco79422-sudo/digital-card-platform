import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EducationSeo } from "@/components/education/EducationSeo";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  EDUCATION_CATEGORY_LABEL,
  EDUCATION_CATEGORY_ORDER,
} from "@/lib/educationLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { EducationCategory, TeacherApplication } from "@/types/domain";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";

function toggleInSet(setter: Dispatch<SetStateAction<Set<string>>>, item: string) {
  setter((prev) => {
    const n = new Set(prev);
    if (n.has(item)) n.delete(item);
    else n.add(item);
    return n;
  });
}

const SHORT_CATEGORY_LABEL: Record<EducationCategory, string> = {
  card_design: "명함디자인",
  blog: "블로그",
  video: "영상제작",
  program: "프로그램 제작",
  ai_creation: "AI 제작교육",
};

export function TeacherApplyPage() {
  const user = useAuthStore((s) => s.user);
  const appendTeacherApplication = useAppDataStore((s) => s.appendTeacherApplication);

  const [method, setMethod] = useState<TeacherApplication["available_method"]>("both");

  const [catSel, setCatSel] = useState(() => new Set<EducationCategory>(["blog"]));

  const [name, setName] = useState(() => user?.name ?? "");
  const [phone, setPhone] = useState(() => user?.phone ?? "");
  const [email, setEmail] = useState(() => user?.email ?? "");
  const [region, setRegion] = useState("");
  const [topics, setTopics] = useState("");
  const [career, setCareer] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [desiredTime, setDesiredTime] = useState("");
  const [desiredPrice, setDesiredPrice] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  /** 명함디자인 */
  const [cardTypes, setCardTypes] = useState(() => new Set<string>());
  const [designTools, setDesignTools] = useState("");
  const [designPfUrl, setDesignPfUrl] = useState("");
  /** 블로그 */
  const [naverOk, setNaverOk] = useState(false);
  const [seoOk, setSeoOk] = useState(false);
  const [rankExperience, setRankExperience] = useState("");
  const [blogSample, setBlogSample] = useState("");
  /** 영상 */
  const [shortOk, setShortOk] = useState(false);
  const [ytOk, setYtOk] = useState(false);
  const [videoEditors, setVideoEditors] = useState("");
  const [videoPf, setVideoPf] = useState("");
  /** 프로그램 */
  const [progStack, setProgStack] = useState(() => new Set<string>());
  const [progLink, setProgLink] = useState("");
  /** AI */
  const [aiTools, setAiTools] = useState("");
  const [aiTopics, setAiTopics] = useState("");
  const [aiPractice, setAiPractice] = useState("");
  const [aiSample, setAiSample] = useState("");

  const [busy, setBusy] = useState(false);

  const onPickFile = (file: File | null) => {
    setAttachmentUrl(null);
    if (!file?.type.startsWith("image/") && !file?.type.includes("pdf")) return;
    const r = new FileReader();
    r.onload = () => setAttachmentUrl(typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(file);
  };

  const submit = () => {
    if (!name.trim() || !phone.trim() || !email.trim() || topics.trim().length < 3 || career.trim().length < 5) return;
    const categories = EDUCATION_CATEGORY_ORDER.filter((c) => catSel.has(c));
    if (categories.length === 0) return;

    const facets: Record<string, unknown> = {};

    if (categories.includes("card_design")) {
      facets.card_design = {
        types: [...cardTypes],
        design_tools: designTools.trim(),
        portfolio_link: designPfUrl.trim(),
      };
    }
    if (categories.includes("blog")) {
      facets.blog = { naver: naverOk, seo: seoOk, ranking: rankExperience.trim(), sample: blogSample.trim() };
    }
    if (categories.includes("video")) {
      facets.video = {
        short: shortOk,
        youtube: ytOk,
        editors: videoEditors.trim(),
        portfolio_link: videoPf.trim(),
      };
    }
    if (categories.includes("program")) {
      facets.program = {
        tech: [...progStack],
        link: progLink.trim(),
      };
    }
    if (categories.includes("ai_creation")) {
      facets.ai_creation = {
        ai_tools: aiTools.trim(),
        topics: aiTopics.trim(),
        practice: aiPractice.trim(),
        materials_sample: aiSample.trim(),
      };
    }

    const row: TeacherApplication = {
      id: crypto.randomUUID(),
      user_id: user?.id ?? null,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      region: region.trim(),
      available_method: method,
      categories,
      topics: topics.trim(),
      career: career.trim(),
      portfolio_url: portfolioUrl.trim(),
      desired_time: desiredTime.trim(),
      desired_price: desiredPrice.trim(),
      introduction: introduction.trim(),
      attachment_url: attachmentUrl,
      status: "pending",
      created_at: new Date().toISOString(),
      type_facets_json: facets,
    };
    setBusy(true);
    try {
      appendTeacherApplication(row);
      window.alert("강사 신청이 접수되었습니다. 관리자 검토 후 안내 드립니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <EducationSeo />
      <div className={cn(layout.pageForm, "py-10 sm:py-12")}>
        <Link to="/education" className="inline-flex min-h-10 text-sm font-semibold text-brand-800 hover:underline">
          ← 교육·강사
        </Link>
        <Card className="mt-8">
          <CardHeader className="space-y-3">
            <h1 className="text-2xl font-bold text-slate-900">강사로 신청하기</h1>
            <p className="text-sm leading-relaxed text-slate-600">
              내가 가진 경험과 기술로 린코 회원들에게 교육을 진행할 수 있습니다.
            </p>
            <p className="text-xs text-slate-500">
              강사 신청 정보는 공개되지 않으며, 관리자 검토 후 선정된 강사만 교육을 운영할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-slate-900">이름</label>
                <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">연락처</label>
                <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">이메일</label>
                <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-slate-900">활동 지역</label>
                <Input className="mt-1" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-slate-900">가능한 교육 방식</label>
                <Select className="mt-1" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
                  <option value="online">온라인</option>
                  <option value="offline">오프라인</option>
                  <option value="both">둘 다 가능</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <fieldset>
                  <legend className="text-sm font-semibold text-slate-900">신청 교육 분야</legend>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {EDUCATION_CATEGORY_ORDER.map((c) => (
                      <label
                        key={c}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
                      >
                        <input
                          type="checkbox"
                          checked={catSel.has(c)}
                          onChange={() =>
                            setCatSel((prev) => {
                              const n = new Set(prev);
                              if (n.has(c)) n.delete(c);
                              else n.add(c);
                              return n;
                            })
                          }
                        />
                        <span>{SHORT_CATEGORY_LABEL[c]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>

            {catSel.has("card_design") ? (
              <fieldset className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <legend className="text-base font-bold text-slate-900">명함디자인 추가</legend>
                <div className="flex flex-wrap gap-2">
                  {["개인형", "사업자형", "매장형"].map((t) => (
                    <label key={t} className="flex gap-2 text-sm">
                      <input type="checkbox" checked={cardTypes.has(t)} onChange={() => toggleInSet(setCardTypes, t)} />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">디자인 도구</label>
                  <Input className="mt-1" value={designTools} onChange={(e) => setDesignTools(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">포트폴리오 링크</label>
                  <Input className="mt-1" value={designPfUrl} onChange={(e) => setDesignPfUrl(e.target.value)} />
                </div>
              </fieldset>
            ) : null}

            {catSel.has("blog") ? (
              <fieldset className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <legend className="text-base font-bold text-slate-900">{EDUCATION_CATEGORY_LABEL.blog}</legend>
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={naverOk} onChange={(e) => setNaverOk(e.target.checked)} />
                  네이버 블로그 교육 가능
                </label>
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={seoOk} onChange={(e) => setSeoOk(e.target.checked)} />
                  SEO 교육 가능
                </label>
                <div>
                  <label className="text-sm font-medium text-slate-800">상위노출 경험 요약</label>
                  <Textarea className="mt-1" value={rankExperience} onChange={(e) => setRankExperience(e.target.value)} rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">작성 샘플 링크</label>
                  <Input className="mt-1" value={blogSample} onChange={(e) => setBlogSample(e.target.value)} />
                </div>
              </fieldset>
            ) : null}

            {catSel.has("video") ? (
              <fieldset className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <legend className="text-base font-bold text-slate-900">{EDUCATION_CATEGORY_LABEL.video}</legend>
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={shortOk} onChange={(e) => setShortOk(e.target.checked)} />
                  숏폼 교육 가능
                </label>
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={ytOk} onChange={(e) => setYtOk(e.target.checked)} />
                  유튜브 영상 교육 가능
                </label>
                <div>
                  <label className="text-sm font-medium text-slate-800">편집 프로그램</label>
                  <Input className="mt-1" value={videoEditors} onChange={(e) => setVideoEditors(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">영상 포트폴리오 링크</label>
                  <Input className="mt-1" value={videoPf} onChange={(e) => setVideoPf(e.target.value)} />
                </div>
              </fieldset>
            ) : null}

            {catSel.has("program") ? (
              <fieldset className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <legend className="text-base font-bold text-slate-900">{EDUCATION_CATEGORY_LABEL.program}</legend>
                <div className="flex flex-wrap gap-3">
                  {(["React", "Python", "Firebase", "Supabase", "자동화"] as const).map((t) => (
                    <label key={t} className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={progStack.has(t)}
                        onChange={() =>
                          setProgStack((prev) => {
                            const n = new Set(prev);
                            if (n.has(t)) n.delete(t);
                            else n.add(t);
                            return n;
                          })
                        }
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">GitHub 또는 작업 링크</label>
                  <Input className="mt-1" value={progLink} onChange={(e) => setProgLink(e.target.value)} />
                </div>
              </fieldset>
            ) : null}

            {catSel.has("ai_creation") ? (
              <fieldset className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <legend className="text-base font-bold text-slate-900">{EDUCATION_CATEGORY_LABEL.ai_creation}</legend>
                <div>
                  <label className="text-sm font-medium text-slate-800">사용 가능한 AI 도구</label>
                  <Input className="mt-1" value={aiTools} onChange={(e) => setAiTools(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">교육 가능 주제</label>
                  <Textarea className="mt-1" rows={3} value={aiTopics} onChange={(e) => setAiTopics(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">실습 가능 여부 / 방식</label>
                  <Input className="mt-1" value={aiPractice} onChange={(e) => setAiPractice(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">교육 자료 샘플 링크</label>
                  <Input className="mt-1" value={aiSample} onChange={(e) => setAiSample(e.target.value)} />
                </div>
              </fieldset>
            ) : null}

            <div>
              <label className="text-sm font-semibold text-slate-900">강의 가능 주제</label>
              <Textarea className="mt-1" rows={4} value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="예: 네이버 블로그 SEO 심화, 릴스 촬영 기초 등" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">강의 경력</label>
              <Textarea className="mt-1" rows={4} value={career} onChange={(e) => setCareer(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">포트폴리오 또는 참고 링크</label>
              <Input className="mt-1" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="선택 사항" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-900">희망 교육 시간</label>
                <Input className="mt-1" value={desiredTime} onChange={(e) => setDesiredTime(e.target.value)} placeholder="예: 주중 저녁" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">희망 교육 비용(안내문)</label>
                <Input className="mt-1" value={desiredPrice} onChange={(e) => setDesiredPrice(e.target.value)} placeholder="예: 시간당 또는 패키지" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">자기소개</label>
              <Textarea className="mt-1" rows={6} value={introduction} onChange={(e) => setIntroduction(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">첨부 자료 (이미지·PDF 선택)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="mt-2 block text-sm text-slate-600"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <Button size="lg" type="button" className="w-full min-h-[52px]" disabled={busy} onClick={() => submit()}>
              제출하기
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
