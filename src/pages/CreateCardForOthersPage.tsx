import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import {
  buildQuickShareCard,
  buildInstantCardLinks,
  INSTANT_GUEST_USER_ID,
  parseContactInput,
  uniqueSlugForCards,
} from "@/lib/instantCardCreate";
import { setInstantCardId } from "@/lib/instantCardStorage";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import { Copy, MessageCircle, Send, Link2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

function contactIsValid(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 1) return false;
  if (/\S+@\S+\.\S+/.test(t)) return true;
  const digits = t.replace(/\D/g, "");
  return digits.length >= 8;
}

export function CreateCardForOthersPage() {
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const setCardLinks = useAppDataStore((s) => s.setCardLinks);

  const [personName, setPersonName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [contact, setContact] = useState("");
  const [copyDone, setCopyDone] = useState(false);
  const [kakaoHint, setKakaoHint] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const cardIdRef = useRef<string | null>(null);
  const slugRef = useRef<string | null>(null);
  const createdAtRef = useRef<string | null>(null);

  const ready = useMemo(
    () => personName.trim().length >= 1 && jobTitle.trim().length >= 1 && contactIsValid(contact),
    [personName, jobTitle, contact],
  );

  const shareCard = useMemo(
    () => (activeCardId ? businessCards.find((c) => c.id === activeCardId) : undefined),
    [activeCardId, businessCards],
  );

  const cardUrl = useMemo(() => {
    const c = shareCard;
    if (!c?.slug || !ready) return null;
    return `${window.location.origin}/c/${encodeURI(c.slug)}`;
  }, [shareCard, ready]);

  const ownerUserId = user?.id ?? INSTANT_GUEST_USER_ID;

  useEffect(() => {
    if (!ready) return;

    const t = window.setTimeout(() => {
      const { phone, email } = parseContactInput(contact);
      let id = cardIdRef.current;
      let slug = slugRef.current;
      let created = createdAtRef.current;

      if (!id) {
        id = crypto.randomUUID();
        slug = uniqueSlugForCards(personName.trim(), useAppDataStore.getState().businessCards);
        created = new Date().toISOString();
        cardIdRef.current = id;
        slugRef.current = slug;
        createdAtRef.current = created;
        setActiveCardId(id);
        if (!user) setInstantCardId(id);
      }

      const card = buildQuickShareCard({
        cardId: id!,
        slug: slug!,
        user_id: ownerUserId,
        person_name: personName.trim(),
        job_title: jobTitle.trim(),
        phone,
        email,
        created_at: created!,
      });

      upsertBusinessCard(card);
      setCardLinks(id!, buildInstantCardLinks(id!, phone, email));
    }, 420);

    return () => window.clearTimeout(t);
  }, [ready, personName, jobTitle, contact, ownerUserId, user, upsertBusinessCard, setCardLinks]);

  const shareLine = useMemo(
    () => `${personName.trim() || "상대방"}님 디지털 명함이에요`,
    [personName],
  );

  const copyLink = useCallback(async () => {
    if (!cardUrl) return;
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2200);
    } catch {
      window.prompt("링크를 복사하세요", cardUrl);
    }
  }, [cardUrl]);

  const smsShare = useCallback(() => {
    if (!cardUrl) return;
    const body = encodeURIComponent(`${shareLine}\n${cardUrl}`);
    window.location.href = `sms:?&body=${body}`;
  }, [cardUrl, shareLine]);

  const kakaoShare = useCallback(async () => {
    if (!cardUrl) return;
    const text = `${shareLine}\n${cardUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareLine, text, url: cardUrl });
        return;
      } catch {
        /* 사용자 취소 등 */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setKakaoHint(true);
      window.setTimeout(() => setKakaoHint(false), 2600);
    } catch {
      window.prompt("내용을 복사해 카카오톡에 붙여넣기 하세요", text);
    }
  }, [cardUrl, shareLine]);

  const openPreview = useCallback(() => {
    if (!cardUrl) return;
    window.open(cardUrl, "_blank", "noopener,noreferrer");
  }, [cardUrl]);

  return (
    <div className={cn(layout.page, "py-10 sm:py-14")}>
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-brand-800 hover:underline"
          >
            홈
          </Link>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          명함 대신 만들어주기
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          이름·직업·연락처만 넣으면 공개 명함 링크가 바로 만들어집니다. 가입 없이 보낸 뒤, 나중에 가입해 수정할 수
          있어요.
        </p>

        <Card className="mt-8 border-slate-200/90 shadow-lg shadow-slate-900/5">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>
            <p className="text-sm text-slate-600">모두 입력되면 자동으로 저장·공개됩니다.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-800">이름</label>
              <Input
                className="mt-1"
                placeholder="실명 또는 표시 이름"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-800">직업</label>
              <Input
                className="mt-1"
                placeholder="예: 프리랜서 디자이너"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-800">연락처</label>
              <Input
                className="mt-1"
                placeholder="전화번호 또는 이메일"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                inputMode="tel"
                autoComplete="tel email"
              />
              <p className="mt-1 text-xs text-slate-500">전화(숫자 8자 이상) 또는 이메일 주소</p>
            </div>
          </CardContent>
        </Card>

        {ready && cardUrl ? (
          <Card className="mt-8 border-brand-200/80 bg-gradient-to-br from-brand-50/90 to-white shadow-md">
            <CardHeader>
              <h2 className="text-lg font-semibold text-brand-950">명함이 만들어졌어요</h2>
              <p className="text-sm leading-relaxed text-slate-700">
                지금 만든 명함은 자동으로 저장됩니다. 가입하면 언제든 수정할 수 있습니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                type="button"
                onClick={openPreview}
                className="flex w-full items-center gap-2 break-all rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-brand-800 ring-1 ring-slate-900/[0.04] hover:bg-slate-50"
              >
                <Link2 className="h-4 w-4 shrink-0" aria-hidden />
                <span>{cardUrl}</span>
              </button>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[48px] w-full justify-center gap-2 sm:flex-1"
                  onClick={kakaoShare}
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                  카카오톡으로 보내기
                </Button>
                <Button
                  type="button"
                  className="min-h-[48px] w-full justify-center gap-2 sm:flex-1"
                  onClick={copyLink}
                >
                  <Copy className="h-4 w-4 shrink-0" aria-hidden />
                  {copyDone ? "복사됨!" : "링크 복사하기"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[48px] w-full justify-center gap-2 sm:flex-1"
                  onClick={smsShare}
                >
                  <Send className="h-4 w-4 shrink-0" aria-hidden />
                  문자로 보내기
                </Button>
              </div>

              {kakaoHint ? (
                <p className="text-center text-sm font-medium text-brand-900">
                  메시지를 복사했어요. 카카오톡 채팅에 붙여넣어 보내 주세요.
                </p>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-brand-200/60 pt-4 sm:flex-row sm:justify-center">
                <Link
                  to="/signup"
                  className={cn(
                    linkButtonClassName({ variant: "outline", size: "md" }),
                    "w-full justify-center sm:w-auto",
                  )}
                >
                  가입하고 이 명함 수정하기
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <p className="mt-10 text-center text-sm text-slate-500">
          직접 디자인하고 싶다면{" "}
          <Link to="/create-card" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            일반 명함 만들기
          </Link>
        </p>
      </div>
    </div>
  );
}
