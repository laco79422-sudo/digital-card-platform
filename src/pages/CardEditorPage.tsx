import { CardForm } from "@/components/card-editor/CardForm";
import { CardPreview } from "@/components/card-editor/CardPreview";
import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { parseCardEditorDraft, zodIssuesToFieldErrors } from "@/lib/cardEditorSchema";
import { brandCta } from "@/lib/brand";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  createEmptyDraft,
  draftFromBusinessCard,
  draftToBusinessCard,
  useCardEditorDraftStore,
} from "@/stores/cardEditorDraftStore";
import { getLinksForCard, useAppDataStore } from "@/stores/appDataStore";
import type { CardLink, CardLinkType } from "@/types/domain";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

type LinkRow = { id: string; label: string; type: CardLinkType; url: string };

function mapLinksToRows(links: CardLink[]): LinkRow[] {
  if (!links.length) {
    return [{ id: crypto.randomUUID(), label: "웹사이트", type: "website", url: "https://" }];
  }
  return links.map((l) => ({
    id: l.id,
    label: l.label,
    type: l.type,
    url: l.url,
  }));
}

export function CardEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardLinks = useAppDataStore((s) => s.cardLinks);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const setCardLinks = useAppDataStore((s) => s.setCardLinks);

  const isNew = !id || id === "new";
  const routeKey = isNew ? "new" : (id ?? "");
  const existing = useMemo(
    () => (!isNew && id ? businessCards.find((c) => c.id === id) : undefined),
    [businessCards, id, isNew],
  );

  const existingLinks = useMemo(() => {
    if (!existing) return [];
    return getLinksForCard(existing.id, cardLinks);
  }, [cardLinks, existing]);

  const replaceDraft = useCardEditorDraftStore((s) => s.replaceDraft);
  const setHydratedKey = useCardEditorDraftStore((s) => s.setHydratedKey);

  const [linkRows, setLinkRows] = useState<LinkRow[]>(() => mapLinksToRows(existingLinks));
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    setLinkRows(mapLinksToRows(existingLinks));
  }, [existing?.id, existingLinks]);

  /** 라우트 키당 1회 주입 — react-hook-form `reset(defaultValues)` 루프 없이 스크롤·리렌더 후에도 입력 유지 */
  useEffect(() => {
    if (!isNew && id && !existing) return;
    const state = useCardEditorDraftStore.getState();
    if (state.hydratedKey === routeKey) return;

    if (existing) {
      replaceDraft(draftFromBusinessCard(existing));
    } else {
      replaceDraft(
        createEmptyDraft({
          person_name: user?.name ?? "",
          email: user?.email ?? "",
        }),
      );
    }
    setHydratedKey(routeKey);
  }, [routeKey, isNew, id, existing, user?.name, user?.email, replaceDraft, setHydratedKey]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFieldErrors({});

    const draft = useCardEditorDraftStore.getState().draft;
    const parsed = parseCardEditorDraft(draft);
    if (!parsed.success) {
      setFieldErrors(zodIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    setSubmitting(true);
    try {
      const cardId = existing?.id ?? crypto.randomUUID();
      const card = draftToBusinessCard(draft, {
        id: cardId,
        user_id: user.id,
        created_at: existing?.created_at ?? new Date().toISOString(),
      });
      upsertBusinessCard(card);

      const links: CardLink[] = linkRows
        .filter((r) => r.label && r.url)
        .map((r, i) => ({
          id: r.id,
          card_id: cardId,
          label: r.label,
          type: r.type,
          url: r.url,
          sort_order: i,
        }));
      const finalLinks: CardLink[] =
        links.length > 0
          ? links
          : [
              {
                id: crypto.randomUUID(),
                card_id: cardId,
                label: "웹사이트",
                type: "website",
                url: draft.website_url.trim() || "https://example.com",
                sort_order: 0,
              },
            ];
      setCardLinks(cardId, finalLinks);
      navigate("/cards");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn(layout.pageEditor, "py-10 sm:py-12")}>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
          {isNew ? brandCta.createDigitalCard : "명함 수정하기"}
        </h1>
        <Link
          to="/cards"
          className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-brand-700"
        >
          목록으로
        </Link>
      </div>

      {isNew ? (
        <div className="mb-10 space-y-4 text-center sm:mb-12">
          <p className="mx-auto max-w-2xl break-keep text-balance text-base font-medium leading-relaxed text-slate-800 sm:text-lg">
            나를 소개하는 가장 쉬운 방법, 린코 디지털 명함
          </p>
          <p className="mx-auto max-w-2xl break-keep text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
            한 번 만들면 링크로 퍼지는 나만의 디지털 명함
          </p>
          <p className="mx-auto max-w-xl break-keep text-balance text-sm font-medium leading-relaxed text-brand-800 sm:text-base">
            이름을 남기는 명함에서, 고객과 연결되는 명함으로
          </p>
        </div>
      ) : null}

      <div className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        <p className="border-b border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800">
          실시간 미리보기 · 입력과 동일한 상태로 반영됩니다
        </p>
        <div className="max-h-[min(72vh,640px)] overflow-y-auto overscroll-contain bg-slate-100">
          <CardPreview
            linkRows={linkRows}
            existingCardId={existing?.id}
            createdAt={existing?.created_at}
          />
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <CardForm errors={fieldErrors} />

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">명함 버튼 (링크)</h2>
            <p className="text-sm text-slate-500">클릭 시 통계에 기록됩니다.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkRows.map((row, idx) => (
              <div
                key={row.id}
                className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-12"
              >
                <div className="sm:col-span-4">
                  <label className="text-sm font-medium text-slate-800">라벨</label>
                  <Input
                    className="mt-1"
                    value={row.label}
                    onChange={(e) =>
                      setLinkRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)),
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-sm font-medium text-slate-800">유형</label>
                  <Select
                    className="mt-1"
                    value={row.type}
                    onChange={(e) =>
                      setLinkRows((rows) =>
                        rows.map((r, i) =>
                          i === idx ? { ...r, type: e.target.value as CardLinkType } : r,
                        ),
                      )
                    }
                  >
                    <option value="website">웹사이트</option>
                    <option value="blog">블로그</option>
                    <option value="youtube">유튜브</option>
                    <option value="kakao">카카오</option>
                    <option value="email">이메일</option>
                    <option value="phone">전화</option>
                    <option value="custom">기타</option>
                  </Select>
                </div>
                <div className="sm:col-span-5">
                  <label className="text-sm font-medium text-slate-800">링크 주소</label>
                  <Input
                    className="mt-1"
                    value={row.url}
                    onChange={(e) =>
                      setLinkRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)),
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLinkRows((rows) => [
                  ...rows,
                  {
                    id: crypto.randomUUID(),
                    label: "",
                    type: "custom",
                    url: "",
                  },
                ])
              }
            >
              링크 추가
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-2">
          <Link
            to="/cards"
            className={cn(
              "w-full sm:w-auto",
              linkButtonClassName({
                variant: "secondary",
                size: "lg",
                className: "w-full sm:min-h-11 sm:w-auto",
              }),
            )}
          >
            취소
          </Link>
          <Button type="submit" className="w-full min-h-[52px] sm:w-auto sm:min-h-11" size="lg" loading={submitting}>
            저장
          </Button>
        </div>
      </form>
    </div>
  );
}
