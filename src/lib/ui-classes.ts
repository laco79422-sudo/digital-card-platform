/**
 * Mobile-first layout, typography, and form primitives.
 * Compose with `cn()` from `@/lib/utils` when merging with one-off classes.
 */

const formFieldBase =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-snug text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export const form = {
  /** Single-line inputs & selects */
  input: `${formFieldBase} h-12 min-h-12`,
  /** Multi-line */
  textarea: `${formFieldBase} min-h-[132px] resize-y`,
} as const;

const pagePad = "mx-auto w-full px-5 sm:px-6 lg:px-8";

export const layout = {
  page: `${pagePad} max-w-6xl`,
  pageNarrow: `${pagePad} max-w-3xl`,
  pageAuth: `${pagePad} max-w-md`,
  pageForm: `${pagePad} max-w-2xl`,
  pageWide: `${pagePad} max-w-4xl`,
  pageEditor: `${pagePad} max-w-3xl`,
  pageCompact: `${pagePad} max-w-lg`,
} as const;

export const section = {
  y: "py-12 sm:py-16 lg:py-20",
  yHero: "py-14 sm:py-20 lg:py-28",
} as const;

export const type = {
  heroKicker:
    "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white sm:text-sm",
  heroTitle:
    "break-keep text-4xl font-bold leading-[1.15] tracking-tight text-white md:text-5xl lg:text-[2.75rem] lg:leading-[1.12] xl:text-6xl",
  heroLead:
    "break-keep text-base font-normal leading-relaxed text-white/92 max-w-xl sm:text-[17px] md:max-w-2xl",
  /** Hero 부제 · 연결 메시지 */
  heroTagline:
    "break-keep text-xl font-medium leading-snug tracking-tight text-white sm:text-2xl md:text-[1.65rem]",
  /** 긴 브랜드 스토리 (줄바꿈 포함) */
  heroStory:
    "whitespace-pre-line break-keep text-base font-normal leading-relaxed text-white/88 max-w-2xl sm:text-[17px]",
  heroFootnote: "text-sm leading-relaxed text-brand-100",
  sectionTitle:
    "break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl",
  sectionTitleCenter: "text-center break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl",
  sectionLead:
    "break-keep text-base leading-relaxed text-slate-600 sm:text-[17px]",
  featureCardTitle: "mt-4 text-base font-semibold text-slate-900",
  featureCardBody: "mt-2 text-[15px] leading-relaxed text-slate-700 sm:text-base",
} as const;
