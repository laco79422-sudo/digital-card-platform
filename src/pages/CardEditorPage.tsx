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
import {
  getSampleCardDraft,
  getSampleLinkRows,
  parseWantsSample,
} from "@/lib/cardEditorSampleData";
import {
  clearLandingEmail,
  consumePendingCardDraft,
  getLandingEmail,
  savePendingCardDraft,
} from "@/lib/pendingCardStorage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

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
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isGuestRoute = location.pathname === "/create-card";
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardLinks = useAppDataStore((s) => s.cardLinks);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const setCardLinks = useAppDataStore((s) => s.setCardLinks);

  const isNew = !id || id === "new";
  const wantsSample = useMemo(() => parseWantsSample(location.search), [location.search]);

  const routeKey = useMemo(() => {
    if (isGuestRoute) return wantsSample ? "create-card-sample" : "create-card";
    if (!isNew && id) return id;
    return wantsSample ? "new-sample" : "new";
  }, [isGuestRoute, isNew, id, wantsSample]);

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
    if (isGuestRoute) return;
    setLinkRows(mapLinksToRows(existingLinks));
  }, [existing?.id, existingLinks, isGuestRoute]);

  /** 게스트 /create-card · 가입 후 복원 · ?sample=true 등 · 일반 신규 순으로 주입 */
  useEffect(() => {
    if (isGuestRoute && !user) {
      const state = useCardEditorDraftStore.getState();
      if (state.hydratedKey === routeKey) return;

      const emailHint = getLandingEmail()?.trim();
      if (wantsSample) {
        replaceDraft(
          getSampleCardDraft({
            email: emailHint || "hello@linko.app",
          }),
        );
        setLinkRows(getSampleLinkRows());
      } else {
        replaceDraft(createEmptyDraft({ email: emailHint ?? "" }));
        setLinkRows(mapLinksToRows([]));
      }
      setHydratedKey(routeKey);
      return;
    }

    if (!isGuestRoute && location.pathname === "/cards/new" && isNew && user) {
      const pending = consumePendingCardDraft();
      if (pending) {
        replaceDraft(pending.draft);
        setLinkRows(
          pending.linkRows.length > 0
            ? pending.linkRows.map((r) => ({
                id: r.id,
                label: r.label,
                type: r.type,
                url: r.url,
              }))
            : mapLinksToRows([]),
        );
        clearLandingEmail();
        setHydratedKey(routeKey);
        return;
      }
    }

    if (
      !isGuestRoute &&
      location.pathname === "/cards/new" &&
      isNew &&
      user &&
      wantsSample &&
      !existing
    ) {
      const state = useCardEditorDraftStore.getState();
      if (state.hydratedKey === routeKey) return;
      replaceDraft(
        getSampleCardDraft({
          email: user.email?.trim() || "hello@linko.app",
        }),
      );
      setLinkRows(getSampleLinkRows());
      setHydratedKey(routeKey);
      return;
    }

    if (!isNew && id && !existing) return;
    const state = useCardEditorDraftStore.getState();
    if (state.hydratedKey === routeKey) return;

    if (existing) {
      replaceDraft(draftFromBusinessCard(existing));
    } else if (isNew && user) {
      replaceDraft(
        createEmptyDraft({
          person_name: user?.name ?? "",
          email: user?.email ?? "",
        }),
      );
    }
    setHydratedKey(routeKey);
  }, [
    isGuestRoute,
    wantsSample,
    user,
    location.pathname,
    routeKey,
    isNew,
    id,
    existing,
    user?.name,
    user?.email,
    replaceDraft,
    setHydratedKey,
  ]);

  const applySampleDraft = useCallback(() => {
    const emailFallback = getLandingEmail()?.trim() || user?.email?.trim() || "hello@linko.app";
    replaceDraft(getSampleCardDraft({ email: emailFallback }));
    setLinkRows(getSampleLinkRows());
    setFieldErrors({});
  }, [replaceDraft, user?.email]);

  const applyEmptyDraft = useCallback(() => {
    replaceDraft(
      createEmptyDraft({
        email: getLandingEmail()?.trim() || user?.email?.trim() || "",
        person_name: user?.name ?? "",
      }),
    );
    setLinkRows(mapLinksToRows([]));
    setFieldErrors({});
  }, [replaceDraft, user?.email, user?.name]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const draft = useCardEditorDraftStore.getState().draft;
    const parsed = parseCardEditorDraft(draft);
    if (!parsed.success) {
      setFieldErrors(zodIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    if (isGuestRoute && !user) {
      const landing = getLandingEmail()?.trim();
      const d = useCardEditorDraftStore.getState().draft;
      if (landing && !d.email.trim()) {
        replaceDraft({ ...d, email: landing });
      }
      savePendingCardDraft({
        draft: useCardEditorDraftStore.getState().draft,
        linkRows,
      });
      setSubmitting(true);
      try {
        navigate("/signup", {
          state: {
            signupNotice:
              "명함을 저장하려면 계정이 필요합니다. 가입을 완료하면 이어서 저장할 수 있어요.",
          },
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!user) return;

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

  if (user && isGuestRoute) {
    return <Navigate to={{ pathname: "/cards/new", search: location.search }} replace />;
  }

  return (
    <div className={cn(layout.pageEditor, "py-10 sm:py-12")}>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
          {isGuestRoute
            ? "명함 만들기"
            : isNew
              ? brandCta.createDigitalCard
              : "명함 수정하기"}
        </h1>
        <Link
          to={isGuestRoute ? "/" : "/cards"}
          className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-brand-700"
        >
          {isGuestRoute ? "홈으로" : "목록으로"}
        </Link>
      </div>

      {isNew || isGuestRoute ? (
        <div className="mb-10 space-y-4 sm:mb-12">
          <div className="rounded-2xl border border-brand-200 bg-brand-50/90 px-4 py-4 text-center sm:px-6 sm:py-5">
            <p className="text-sm font-semibold text-brand-900 sm:text-base">
              {wantsSample
                ? "샘플이 자동으로 채워졌습니다. 원하는 부분만 수정해 보세요."
                : "필드를 채우면 아래 미리보기에 바로 반영됩니다."}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-950/85">
              완성 예시를 먼저 보고 빠르게 시작할 수 있습니다. 모든 값은 실제 저장·공개에 쓰이는 입력입니다.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={applySampleDraft}>
                샘플 다시 불러오기
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={applyEmptyDraft}>
                빈 상태로 시작하기
              </Button>
            </div>
          </div>
          <p className="text-center text-base font-medium leading-relaxed text-slate-800 sm:text-lg">
            나를 소개하는 가장 쉬운 방법, 린코 디지털 명함
          </p>
          <p className="text-center text-sm leading-relaxed text-slate-600 sm:text-base">
            한 번 만들면 링크로 퍼지는 나만의 디지털 명함
          </p>
          <p className="text-center text-sm font-medium leading-relaxed text-brand-800 sm:text-base">
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
            to={isGuestRoute ? "/" : "/cards"}
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
            {isGuestRoute ? "저장하고 계정 만들기" : "저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}
