import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import {
  effectiveTagline,
  effectiveTrustLine,
  galleryImages,
  resolveHeroCtas,
  resolveStickyCtas,
  serviceBlocks,
} from "@/lib/digitalCardViewModel";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { BusinessCard, CardLink } from "@/types/domain";
import {
  ExternalLink,
  Headphones,
  ImageIcon,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  Video,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const themeClass: Record<string, string> = {
  navy: "from-slate-950 via-brand-950 to-brand-900",
  slate: "from-slate-900 via-slate-800 to-slate-950",
  midnight: "from-black via-slate-950 to-slate-900",
};

const serviceIcons = [Sparkles, Zap, Headphones, Star];

function iconForLinkType(t: CardLink["type"]) {
  switch (t) {
    case "youtube":
      return Video;
    case "kakao":
      return MessageCircle;
    case "email":
      return Mail;
    case "phone":
      return Phone;
    default:
      return ExternalLink;
  }
}

function navigateCta(href: string) {
  if (href.startsWith("tel:") || href.startsWith("mailto:")) {
    window.location.href = href;
    return;
  }
  if (href.startsWith("#")) {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

type Props = {
  card: BusinessCard;
  links: CardLink[];
  onLinkClick: (link: CardLink) => void;
  qrDataUrl?: string | null;
  /** 편집기 미리보기 등에서 하단 링크 일부 숨김 */
  compact?: boolean;
  /** 편집기 미리보기에서 하단 sticky·여백 제거 */
  hideSticky?: boolean;
};

export function DigitalCardPublicView({
  card,
  links,
  onLinkClick,
  qrDataUrl,
  compact,
  hideSticky,
}: Props) {
  const grad = themeClass[card.theme] ?? themeClass.navy;
  const tagline = effectiveTagline(card);
  const trust = effectiveTrustLine(card);
  const gallery = galleryImages(card);
  const services = serviceBlocks(card);
  const hero = resolveHeroCtas(card, links);
  const sticky = resolveStickyCtas(card, links);

  const extraLinks = links.filter((l) => {
    const u = l.url.trim();
    if (!u || u.startsWith("#")) return false;
    return true;
  });

  return (
    <div
      className={cn(
        "min-h-dvh bg-slate-100",
        hideSticky ? "pb-4" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
      )}
    >
      <section
        className={cn(
          "relative overflow-hidden bg-gradient-to-br px-4 pb-10 pt-6 text-white sm:px-6 sm:pb-12 sm:pt-10",
          grad,
        )}
        aria-label="소개"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
        <div className="relative mx-auto max-w-lg">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur sm:h-[4.25rem] sm:w-[4.25rem] sm:text-xl">
              {card.brand_name.slice(0, 2)}
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-white/75 sm:text-sm">
              {card.brand_name}
            </p>
            <h1 className="mt-1 break-keep text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {card.person_name}
            </h1>
            <Badge
              tone="default"
              className="mt-3 border border-white/30 bg-white/10 text-xs text-white sm:text-sm"
            >
              {card.job_title}
            </Badge>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/95 sm:text-base">
              {tagline}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-[15px]">
              디지털 명함 ·{" "}
              <span className="font-medium text-white/95">
                {card.intro.trim().slice(0, 120)}
                {card.intro.length > 120 ? "…" : ""}
              </span>
            </p>
            <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                className="min-h-[52px] w-full flex-1 border-0 bg-white text-base font-semibold text-slate-900 shadow-lg hover:bg-white/95 sm:min-h-12"
                onClick={() => navigateCta(hero.primary.href)}
              >
                <Phone className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                {hero.primary.label}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-[52px] w-full flex-1 border border-white/40 bg-white/10 text-base font-semibold text-white backdrop-blur hover:bg-white/20 sm:min-h-12"
                onClick={() => navigateCta(hero.secondary.href)}
              >
                <MessageCircle className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                {hero.secondary.label}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className={cn(layout.pageCompact, "-mt-6 space-y-6 sm:-mt-8")}>
        <section
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg shadow-slate-900/5 sm:p-6"
          aria-labelledby="trust-heading"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="trust-heading" className="text-lg font-bold text-slate-900">
              작업 &amp; 신뢰
            </h2>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
              실제 프로젝트
            </span>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {gallery.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="relative h-36 w-48 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-inner"
              >
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/90 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <ImageIcon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">고객 한마디</p>
                <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{trust}</p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-md sm:p-6"
          aria-labelledby="services-heading"
        >
          <h2 id="services-heading" className="text-lg font-bold text-slate-900">
            서비스
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {card.brand_name}의 핵심 제공 영역입니다. 디지털 명함·온라인 상담·콘텐츠 연결까지 한곳에서 안내합니다.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {services.map((s, idx) => {
              const Icon = serviceIcons[idx % serviceIcons.length];
              return (
                <li
                  key={`${s.title}-${idx}`}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-brand-700" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{s.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {!compact && extraLinks.length > 0 ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              더 연결하기
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {extraLinks.map((link) => {
                const Icon = iconForLinkType(link.type);
                return (
                  <Button
                    key={link.id}
                    type="button"
                    variant="secondary"
                    className="min-h-12 w-full justify-between border-slate-200 px-4 text-left text-base text-slate-900"
                    onClick={() => onLinkClick(link)}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0 text-brand-700" />
                      {link.label}
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                  </Button>
                );
              })}
            </div>
          </section>
        ) : null}

        {!compact && qrDataUrl ? (
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-600">명함 공유 QR</p>
            <img
              src={qrDataUrl}
              alt="명함 링크 QR 코드"
              className="mt-3 h-36 w-36 rounded-xl border border-slate-100 bg-white p-2"
            />
          </div>
        ) : null}

        <div className="pb-2 text-center">
          <Link
            to="/"
            className="inline-flex min-h-10 items-center justify-center text-sm text-slate-500 hover:text-brand-700"
          >
            {BRAND_DISPLAY_NAME}으로 만들었어요
          </Link>
        </div>
      </div>

      {!hideSticky && sticky.length > 0 ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/90 bg-white/95 px-3 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto flex max-w-lg gap-2">
            {sticky.map((a) => (
              <Button
                key={a.label + a.href}
                type="button"
                variant={a.label === "전화" ? "primary" : "secondary"}
                className="min-h-[48px] flex-1 px-2 text-sm font-semibold sm:text-base"
                onClick={() => navigateCta(a.href)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
