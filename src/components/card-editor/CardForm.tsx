import { ImageUploader } from "@/components/card-editor/ImageUploader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { slugify } from "@/stores/appDataStore";
import { useCardEditorDraftStore } from "@/stores/cardEditorDraftStore";

type FieldErrors = Partial<Record<string, string>>;

export function CardForm({ errors = {} }: { errors?: FieldErrors }) {
  const draft = useCardEditorDraftStore((s) => s.draft);
  const setDraft = useCardEditorDraftStore((s) => s.setDraft);
  const setServiceRow = useCardEditorDraftStore((s) => s.setServiceRow);
  const appendServiceRow = useCardEditorDraftStore((s) => s.appendServiceRow);
  const removeServiceRow = useCardEditorDraftStore((s) => s.removeServiceRow);

  const onSlugFromBrand = () => {
    const s = slugify(draft.brand_name || "my-card");
    if (s) setDraft({ slug: s });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-base font-medium text-slate-800">브랜드 / 회사명</label>
              <Input
                className="mt-1"
                value={draft.brand_name}
                onChange={(e) => setDraft({ brand_name: e.target.value })}
                autoComplete="organization"
              />
              {errors.brand_name ? <p className="mt-1 text-xs text-red-600">{errors.brand_name}</p> : null}
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">이름</label>
              <Input
                className="mt-1"
                value={draft.person_name}
                onChange={(e) => setDraft({ person_name: e.target.value })}
                autoComplete="name"
              />
              {errors.person_name ? <p className="mt-1 text-xs text-red-600">{errors.person_name}</p> : null}
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">직함</label>
              <Input
                className="mt-1"
                value={draft.job_title}
                onChange={(e) => setDraft({ job_title: e.target.value })}
              />
              {errors.job_title ? <p className="mt-1 text-xs text-red-600">{errors.job_title}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <label className="text-base font-medium text-slate-800">소개</label>
              <Textarea
                className="mt-1"
                rows={4}
                value={draft.intro}
                onChange={(e) => setDraft({ intro: e.target.value })}
              />
              {errors.intro ? <p className="mt-1 text-xs text-red-600">{errors.intro}</p> : null}
            </div>
          </div>

          <ImageUploader
            label="브랜드 대표 이미지"
            value={draft.brand_image_url}
            objectPosition={draft.brand_image_object_position}
            onUrlChange={(url, opts) => {
              useCardEditorDraftStore.setState((s) => ({
                draft: {
                  ...s.draft,
                  brand_image_url: url,
                  brand_image_object_position: opts?.resetPosition ? "50% 50%" : s.draft.brand_image_object_position,
                },
              }));
            }}
            onObjectPositionChange={(brand_image_object_position) => setDraft({ brand_image_object_position })}
          />

          <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-base font-medium text-slate-800">공개 주소 이름</label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Input
                  className="flex-1"
                  placeholder="hong-studio"
                  value={draft.slug}
                  onChange={(e) => setDraft({ slug: e.target.value })}
                />
                <Button type="button" variant="secondary" className="w-full shrink-0 sm:w-auto sm:min-w-[7rem]" onClick={onSlugFromBrand}>
                  자동 생성
                </Button>
              </div>
              {errors.slug ? <p className="mt-1 text-xs text-red-600">{errors.slug}</p> : null}
              <p className="mt-2 text-sm leading-relaxed text-slate-600">이 주소가 나만의 디지털 명함 링크로 사용됩니다.</p>
              <p className="mt-1 text-xs text-slate-500 break-all sm:break-normal">링크: /c/{draft.slug.trim() || "..."}</p>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">테마</label>
              <Select
                className="mt-1"
                value={draft.theme}
                onChange={(e) => setDraft({ theme: e.target.value as typeof draft.theme })}
              >
                <option value="navy">네이비 블루</option>
                <option value="slate">슬레이트 그레이</option>
                <option value="midnight">미드나이트</option>
              </Select>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">공개 여부</label>
              <Select
                className="mt-1"
                value={draft.is_public ? "true" : "false"}
                onChange={(e) => setDraft({ is_public: e.target.value === "true" })}
              >
                <option value="true">공개</option>
                <option value="false">비공개</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">공개 명함 · 랜딩</h2>
          <p className="text-sm text-slate-500">
            상단 히어로·신뢰·서비스 영역에 반영됩니다. 키워드는 자연스럽게 한 줄 설명과 소개에 녹여 주세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-base font-medium text-slate-800">한 줄 설명 (SEO·히어로)</label>
            <Input
              className="mt-1"
              placeholder="예: B2B 퍼포먼스 마케팅 · 리드 제너레이션 전문"
              value={draft.tagline}
              onChange={(e) => setDraft({ tagline: e.target.value })}
            />
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">신뢰 한 줄 (후기·성과)</label>
            <Input
              className="mt-1"
              placeholder="예: 누적 컨설팅 120건 이상"
              value={draft.trust_line}
              onChange={(e) => setDraft({ trust_line: e.target.value })}
            />
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">작업 사진 URL (줄마다 하나)</label>
            <Textarea
              className="mt-1 font-mono text-sm"
              rows={4}
              placeholder="https://..."
              value={draft.gallery_urls_raw}
              onChange={(e) => setDraft({ gallery_urls_raw: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-500">비어 있으면 예시 이미지가 표시됩니다.</p>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-base font-medium text-slate-800">서비스 (최대 5개)</label>
              {draft.services.length < 5 ? (
                <Button type="button" variant="outline" size="sm" onClick={() => appendServiceRow()}>
                  추가
                </Button>
              ) : null}
            </div>
            <div className="mt-3 space-y-3">
              {draft.services.map((row, idx) => (
                <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">서비스 {idx + 1}</span>
                    {draft.services.length > 3 ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeServiceRow(idx)}>
                        삭제
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    className="mt-2"
                    placeholder="제목"
                    value={row.title}
                    onChange={(e) => setServiceRow(idx, { title: e.target.value })}
                  />
                  <Textarea
                    className="mt-2"
                    rows={2}
                    placeholder="짧은 설명"
                    value={row.body}
                    onChange={(e) => setServiceRow(idx, { body: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">제목·설명이 모두 비어 있으면 기본 서비스 안내가 표시됩니다.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">연락처 · 채널</h2>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-base font-medium text-slate-800">전화</label>
            <Input
              className="mt-1"
              value={draft.phone}
              onChange={(e) => setDraft({ phone: e.target.value })}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">이메일</label>
            <Input
              className="mt-1"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ email: e.target.value })}
              autoComplete="email"
            />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-base font-medium text-slate-800">웹사이트</label>
            <Input
              className="mt-1"
              value={draft.website_url}
              onChange={(e) => setDraft({ website_url: e.target.value })}
            />
            {errors.website_url ? <p className="mt-1 text-xs text-red-600">{errors.website_url}</p> : null}
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">블로그</label>
            <Input className="mt-1" value={draft.blog_url} onChange={(e) => setDraft({ blog_url: e.target.value })} />
            {errors.blog_url ? <p className="mt-1 text-xs text-red-600">{errors.blog_url}</p> : null}
          </div>
          <div>
            <label className="text-base font-medium text-slate-800">유튜브</label>
            <Input
              className="mt-1"
              value={draft.youtube_url}
              onChange={(e) => setDraft({ youtube_url: e.target.value })}
            />
            {errors.youtube_url ? <p className="mt-1 text-xs text-red-600">{errors.youtube_url}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <label className="text-base font-medium text-slate-800">카카오 채널</label>
            <Input
              className="mt-1"
              value={draft.kakao_url}
              onChange={(e) => setDraft({ kakao_url: e.target.value })}
            />
            {errors.kakao_url ? <p className="mt-1 text-xs text-red-600">{errors.kakao_url}</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
