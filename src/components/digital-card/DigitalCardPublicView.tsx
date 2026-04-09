import { BrandHeroFrame } from "@/components/digital-card/BrandHeroFrame";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import {
  effectiveTagline,
  galleryImages,
  resolveHeroCtas,
  resolveStickyCtas,
  serviceBlocks,
  sortedUsableLinks,
  trustMetricForView,
  trustTestimonialsForView,
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
  Quote,
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
  const t = href.trim();
  if (t.startsWith("tel:") || t.startsWith("mailto:")) {
    window.location.href = t;
    return;
  }
  if (t.startsWith("#")) {
    document.querySelector(t)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (t.startsWith("/") && !t.startsWith("//")) {
    window.location.assign(t);
    return;
  }
  window.open(t, "_blank", "noopener,noreferrer");
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
  const hasPitchHeadline = Boolean(card.tagline?.trim());
  const trustMetric = trustMetricForView(card);
  const testimonials = trustTestimonialsForView(card);
  const gallery = galleryImages(card);
  const services = serviceBlocks(card);
  const hero = resolveHeroCtas(card, links);
  const sticky = resolveStickyCtas(card, links);

  const extraLinks = links.filter((l) => {
    const u = l.url.trim();
    if (!u || u.startsWith("#")) return false;
    return true;
  });

  const tertiaryLinks =
    hero.mode === "from-links" ? sortedUsableLinks(links).slice(2) : extraLinks;

  const PrimaryHeroIcon =
    hero.mode === "from-links" && hero.primaryLinkType
      ? iconForLinkType(hero.primaryLinkType)
      : Phone;
  const SecondaryHeroIcon =
    hero.mode === "from-links" && hero.secondaryLinkType
      ? iconForLinkType(hero.secondaryLinkType)
      : MessageCircle;

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
        <div className="relative mx-auto w-full max-w-lg px-0">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/15">
              <div className="relative aspect-video w-full max-h-[min(42vh,320px)] overflow-hidden">
                {card.brand_image_url ? (
                  <BrandHeroFrame
                    className="absolute inset-0 h-full w-full"
                    imageUrl={card.brand_image_url}
                    naturalWidth={card.brand_image_natural_width ?? 0}
                    naturalHeight={card.brand_image_natural_height ?? 0}
                    zoom={card.brand_image_zoom ?? 1}
                    panNormX={card.brand_image_pan_x ?? 0}
                    panNormY={card.brand_image_pan_y ?? 0}
                    legacyObjectPosition={card.brand_image_object_position}
                    imgLoading="eager"
                  />
                ) : (
                  <div className="flex h-full min-h-[120px] w-full flex-col items-center justify-center gap-2 px-4 text-white/85">
                    <ImageIcon className="h-12 w-12 opacity-80 sm:h-14 sm:w-14" aria-hidden />
                    <span className="text-sm font-medium sm:text-base">이미지를 등록해 주세요</span>
                  </div>
                )}
              </div>
            </div>
            {hasPitchHeadline ? (
              <>
                <p className="mt-5 max-w-md text-xs font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-sm">
                  {card.brand_name}
                </p>
                <h1 className="mt-3 max-w-xl break-keep text-2xl font-extrabold leading-[1.2] tracking-tight text-white sm:mt-4 sm:text-3xl md:text-4xl">
                  {card.tagline?.trim()}
                </h1>
                <p className="mt-3 text-base font-semibold text-white/95 sm:text-lg">{card.person_name}</p>
                <Badge
                  tone="default"
                  className="mt-2 max-w-md border border-white/30 bg-white/10 px-3 py-1 text-[11px] leading-snug text-white/95 sm:text-xs"
                >
                  {card.job_title}
                </Badge>
                {card.intro.trim() ? (
                  <p className="mt-4 max-w-md whitespace-pre-wrap break-words text-sm leading-relaxed text-white/88 sm:text-[15px]">
                    {card.intro.trim()}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <h1 className="mt-5 break-keep text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
                  {card.brand_name}
                </h1>
                <p className="mt-2 text-base font-medium text-white/90 sm:text-lg">{card.person_name}</p>
                <Badge
                  tone="default"
                  className="mt-2 border border-white/30 bg-white/10 text-[11px] text-white/95 sm:text-xs"
                >
                  {card.job_title}
                </Badge>
                <p className="mt-4 max-w-md text-[15px] font-medium leading-relaxed text-white/95 sm:text-base">
                  {tagline}
                </p>
                <p className="mt-3 max-w-md whitespace-pre-wrap break-words text-sm leading-relaxed text-white/88 sm:text-[15px]">
                  {card.intro.trim()}
                </p>
              </>
            )}
            <div className="mt-7 flex w-full max-w-md flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center">
              <Button
                type="button"
                className="min-h-[54px] w-full flex-1 border-0 bg-white text-base font-bold text-slate-900 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45)] ring-2 ring-white/40 hover:bg-white/95 sm:min-h-[52px]"
                onClick={() => navigateCta(hero.primary.href)}
              >
                <PrimaryHeroIcon className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                {hero.primary.label}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-[54px] w-full flex-1 border-2 border-white/55 bg-white/15 text-base font-bold text-white shadow-lg backdrop-blur hover:bg-white/25 sm:min-h-[52px]"
                onClick={() => navigateCta(hero.secondary.href)}
              >
                <SecondaryHeroIcon className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                {hero.secondary.label}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className={cn(layout.pageCompact, "-mt-6 space-y-8 sm:-mt-8")}>
        <section
          className="scroll-mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-7"
          aria-labelledby="trust-heading"
        >
          <header className="flex flex-col gap-3">
            <h2 id="trust-heading" className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              작업 &amp; 신뢰
            </h2>
            <span className="w-fit rounded-full bg-brand-600/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-900">
              실제 프로젝트
            </span>
          </header>

          <p className="mt-6 text-center text-2xl font-extrabold leading-tight text-brand-800 sm:text-left sm:text-3xl">
            {trustMetric}
          </p>
          <p className="mt-2 text-center text-sm font-medium text-slate-600 sm:text-left">
            누적 사례와 고객 후기로 첫인상을 증명합니다.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 shadow-inner ring-1 ring-slate-900/[0.04]"
              >
                <img
                  src={src}
                  alt={`프로젝트 이미지 ${i + 1}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-6">
            {testimonials.map((t, i) => (
              <figure
                key={`${t.quote.slice(0, 24)}-${i}`}
                className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-sm sm:p-6"
              >
                <Quote
                  className="h-9 w-9 text-brand-200 sm:h-10 sm:w-10"
                  aria-hidden
                  strokeWidth={1.25}
                />
                <blockquote className="mt-3 text-[17px] font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <p className="font-bold text-slate-900">{t.person_name}</p>
                  {t.role.trim() ? <p className="mt-0.5 text-slate-600">{t.role}</p> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          id="services"
          className="scroll-mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md sm:p-7"
          aria-labelledby="services-heading"
        >
          <h2 id="services-heading" className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            서비스
          </h2>
          <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-[15px]">
            {card.brand_name}의 핵심 영역입니다. 짧게 읽고 바로 연결할 수 있습니다.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {services.map((s, idx) => {
              const Icon = serviceIcons[idx % serviceIcons.length];
              return (
                <li
                  key={`${s.title}-${idx}`}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/90 p-5 sm:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
                    <Icon className="h-5 w-5 text-brand-700" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900">{s.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{s.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link
              to="/create-card"
              className={cn(
                linkButtonClassName({ variant: "primary", size: "lg" }),
                "w-full min-h-[52px] justify-center sm:w-auto sm:min-w-[12rem]",
              )}
            >
              내 명함 만들기
            </Link>
            <Link
              to="/create-card?sample=true"
              className={cn(
                linkButtonClassName({ variant: "outline", size: "lg" }),
                "w-full min-h-[52px] justify-center sm:w-auto sm:min-w-[12rem]",
              )}
            >
              이 구조 그대로 사용하기
            </Link>
          </div>
        </section>

        {tertiaryLinks.length > 0 ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {hero.mode === "from-links" ? "빠른 연결" : "더 연결하기"}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {tertiaryLinks.map((link) => {
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
