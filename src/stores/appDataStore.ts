import {
  FEATURED_CREATOR_IDS,
  SAMPLE_APPLICATIONS,
  SAMPLE_BANNERS,
  SAMPLE_CARD_LINKS,
  SAMPLE_CARDS,
  SAMPLE_CLICKS,
  SAMPLE_CREATORS,
  SAMPLE_PAYMENTS,
  SAMPLE_REQUESTS,
  SAMPLE_SUBSCRIPTIONS,
  SAMPLE_USERS,
  SAMPLE_VIEWS,
} from "@/data/sampleData";
import type {
  BusinessCard,
  CardClick,
  CardLinkVisit,
  CardLink,
  CardPromotionLink,
  CardView,
  CreatorProfile,
  EducationApplication,
  InstructorApplication,
  MainBanner,
  Payment,
  PromoterParticipation,
  PromotionPoolEntry,
  ReferralRecord,
  ServiceApplication,
  ServiceRequest,
  Subscription,
} from "@/types/domain";
import { INSTANT_GUEST_USER_ID } from "@/lib/instantCardCreate";
import { buildReferralCode, rewardMonthsForReferralCount } from "@/lib/referrals";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

function mergeById<T extends { id: string }>(seed: T[], stored: T[] | undefined): T[] {
  if (!stored?.length) return [...seed];
  const map = new Map<string, T>();
  for (const s of seed) map.set(s.id, s);
  for (const p of stored) map.set(p.id, p);
  return [...map.values()];
}

function mergeReferralRecords(seed: ReferralRecord[], stored: ReferralRecord[] | undefined): ReferralRecord[] {
  if (!stored?.length) return [...seed];
  const map = new Map<string, ReferralRecord>();
  for (const s of seed) map.set(s.user_id, s);
  for (const p of stored) map.set(p.user_id, p);
  return [...map.values()];
}

interface AppDataState {
  businessCards: BusinessCard[];
  cardLinks: CardLink[];
  creators: CreatorProfile[];
  serviceRequests: ServiceRequest[];
  applications: ServiceApplication[];
  cardViews: CardView[];
  cardClicks: CardClick[];
  cardLinkVisits: CardLinkVisit[];
  cardPromotionLinks: CardPromotionLink[];
  subscriptions: Subscription[];
  payments: Payment[];
  banners: MainBanner[];
  featuredCreatorIds: string[];
  platformUsers: typeof SAMPLE_USERS;
  educationApplications: EducationApplication[];
  instructorApplications: InstructorApplication[];
  promotionPool: PromotionPoolEntry[];
  promoterParticipations: PromoterParticipation[];
  referralRecords: ReferralRecord[];

  setBusinessCards: (cards: BusinessCard[]) => void;
  upsertBusinessCard: (card: BusinessCard) => void;
  removeBusinessCard: (id: string) => void;
  setCardLinks: (cardId: string, links: CardLink[]) => void;
  addCardView: (view: CardView) => void;
  addCardClick: (click: CardClick) => void;
  addCardLinkVisit: (visit: CardLinkVisit) => void;
  addCardPromotionLink: (link: CardPromotionLink) => void;
  extendCardAccess: (cardId: string, months?: number) => void;
  upsertServiceRequest: (r: ServiceRequest) => void;
  addApplication: (a: ServiceApplication) => void;
  upsertCreatorProfile: (c: CreatorProfile) => void;
  setFeaturedCreatorIds: (ids: string[]) => void;
  setBanners: (b: MainBanner[]) => void;
  addEducationApplication: (a: EducationApplication) => void;
  addInstructorApplication: (a: InstructorApplication) => void;
  /** 게스트 즉시 명함 → 로그인 후 내 계정으로 이전 */
  claimInstantGuestCard: (userId: string, cardId: string) => void;

  addPayment: (p: Payment) => void;
  ensureReferralRecord: (userId: string, referredBy?: string | null) => void;
  addToPromotionPool: (entry: Omit<PromotionPoolEntry, "id" | "registered_at" | "status">) => boolean;
  enrollPromoter: (p: Omit<PromoterParticipation, "id" | "enrolled_at">) => boolean;
}

export const useAppDataStore = create<AppDataState>()(
  persist(
    (set) => ({
      businessCards: [...SAMPLE_CARDS],
      cardLinks: [...SAMPLE_CARD_LINKS],
      creators: [...SAMPLE_CREATORS],
      serviceRequests: [...SAMPLE_REQUESTS],
      applications: [...SAMPLE_APPLICATIONS],
      cardViews: [...SAMPLE_VIEWS],
      cardClicks: [...SAMPLE_CLICKS],
      cardLinkVisits: [],
      cardPromotionLinks: [],
      subscriptions: [...SAMPLE_SUBSCRIPTIONS],
      payments: [...SAMPLE_PAYMENTS],
      banners: [...SAMPLE_BANNERS],
      featuredCreatorIds: [...FEATURED_CREATOR_IDS],
      platformUsers: [...SAMPLE_USERS],
      educationApplications: [],
      instructorApplications: [],
      promotionPool: [],
      promoterParticipations: [],
      referralRecords: [],

      setBusinessCards: (businessCards) => set({ businessCards }),
      upsertBusinessCard: (card) =>
        set((s) => ({
          businessCards: s.businessCards.some((c) => c.id === card.id)
            ? s.businessCards.map((c) => (c.id === card.id ? card : c))
            : [...s.businessCards, card],
        })),
      removeBusinessCard: (id) =>
        set((s) => ({
          businessCards: s.businessCards.filter((c) => c.id !== id),
          cardLinks: s.cardLinks.filter((l) => l.card_id !== id),
        })),
      setCardLinks: (cardId, links) =>
        set((s) => ({
          cardLinks: [...s.cardLinks.filter((l) => l.card_id !== cardId), ...links],
        })),
      addCardView: (view) => set((s) => ({ cardViews: [...s.cardViews, view] })),
      addCardClick: (click) => set((s) => ({ cardClicks: [...s.cardClicks, click] })),
      addCardLinkVisit: (visit) => set((s) => ({ cardLinkVisits: [...s.cardLinkVisits, visit] })),
      addCardPromotionLink: (link) =>
        set((s) => {
          if (s.cardPromotionLinks.some((x) => x.ref_code === link.ref_code)) return s;
          return { cardPromotionLinks: [...s.cardPromotionLinks, link] };
        }),
      extendCardAccess: (cardId, months = 1) =>
        set((s) => ({
          businessCards: s.businessCards.map((card) => {
            if (card.id !== cardId) return card;
            const now = new Date();
            const base = card.expire_at && new Date(card.expire_at) > now ? new Date(card.expire_at) : now;
            base.setDate(base.getDate() + 30 * months);
            return { ...card, expire_at: base.toISOString(), status: "active" };
          }),
        })),
      upsertServiceRequest: (r) =>
        set((s) => ({
          serviceRequests: s.serviceRequests.some((x) => x.id === r.id)
            ? s.serviceRequests.map((x) => (x.id === r.id ? r : x))
            : [...s.serviceRequests, r],
        })),
      addApplication: (a) => set((s) => ({ applications: [...s.applications, a] })),
      upsertCreatorProfile: (c) =>
        set((s) => ({
          creators: s.creators.some((x) => x.id === c.id)
            ? s.creators.map((x) => (x.id === c.id ? c : x))
            : [...s.creators, c],
        })),
      setFeaturedCreatorIds: (featuredCreatorIds) => set({ featuredCreatorIds }),
      setBanners: (banners) => set({ banners }),
      addEducationApplication: (a) =>
        set((s) => ({ educationApplications: [...s.educationApplications, a] })),
      addInstructorApplication: (a) =>
        set((s) => ({ instructorApplications: [...s.instructorApplications, a] })),
      claimInstantGuestCard: (userId, cardId) =>
        set((s) => ({
          businessCards: s.businessCards.map((c) =>
            c.id === cardId && c.user_id === INSTANT_GUEST_USER_ID ? { ...c, user_id: userId } : c,
          ),
        })),
      addPayment: (payment) => set((s) => ({ payments: [...s.payments, payment] })),
      ensureReferralRecord: (userId, referredBy = null) =>
        set((s) => {
          const ownCode = buildReferralCode(userId);
          const normalizedReferredBy = referredBy?.trim().toUpperCase() || null;
          const hasOwnRecord = s.referralRecords.some((x) => x.user_id === userId);
          let records = hasOwnRecord
            ? s.referralRecords.map((x) =>
                x.user_id === userId && !x.referred_by && normalizedReferredBy && normalizedReferredBy !== x.ref_code
                  ? { ...x, referred_by: normalizedReferredBy }
                  : x,
              )
            : [
                ...s.referralRecords,
                {
                  user_id: userId,
                  ref_code: ownCode,
                  referred_by: normalizedReferredBy === ownCode ? null : normalizedReferredBy,
                  referred_count: 0,
                  reward_months: 0,
                },
              ];

          if (normalizedReferredBy && normalizedReferredBy !== ownCode && !hasOwnRecord) {
            records = records.map((x) => {
              if (x.ref_code !== normalizedReferredBy) return x;
              const referred_count = x.referred_count + 1;
              return {
                ...x,
                referred_count,
                reward_months: rewardMonthsForReferralCount(referred_count),
              };
            });
          }

          return { referralRecords: records };
        }),
      addToPromotionPool: (raw) => {
        let added = false;
        set((s) => {
          if (s.promotionPool.some((e) => e.card_id === raw.card_id)) return s;
          added = true;
          const entry: PromotionPoolEntry = {
            ...raw,
            id: crypto.randomUUID(),
            registered_at: new Date().toISOString(),
            status: "active",
          };
          return { promotionPool: [...s.promotionPool, entry] };
        });
        return added;
      },
      enrollPromoter: (raw) => {
        let ok = false;
        set((s) => {
          if (s.promoterParticipations.some((x) => x.user_id === raw.user_id)) return s;
          ok = true;
          const row: PromoterParticipation = {
            ...raw,
            id: crypto.randomUUID(),
            enrolled_at: new Date().toISOString(),
          };
          return { promoterParticipations: [...s.promoterParticipations, row] };
        });
        return ok;
      },
    }),
    {
      name: "linko-app-data",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      partialize: (state) => ({
        businessCards: state.businessCards,
        cardLinks: state.cardLinks,
        creators: state.creators,
        serviceRequests: state.serviceRequests,
        applications: state.applications,
        cardViews: state.cardViews,
        cardClicks: state.cardClicks,
        cardLinkVisits: state.cardLinkVisits,
        cardPromotionLinks: state.cardPromotionLinks,
        subscriptions: state.subscriptions,
        payments: state.payments,
        banners: state.banners,
        featuredCreatorIds: state.featuredCreatorIds,
        platformUsers: state.platformUsers,
        educationApplications: state.educationApplications,
        instructorApplications: state.instructorApplications,
        promotionPool: state.promotionPool,
        promoterParticipations: state.promoterParticipations,
        referralRecords: state.referralRecords,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppDataState> | undefined;
        if (!p) return current;
        return {
          ...current,
          ...p,
          businessCards: mergeById(current.businessCards, p.businessCards),
          cardLinks: mergeById(current.cardLinks, p.cardLinks),
          creators: mergeById(current.creators, p.creators),
          serviceRequests: mergeById(current.serviceRequests, p.serviceRequests),
          applications: mergeById(current.applications, p.applications),
          cardViews: mergeById(current.cardViews, p.cardViews),
          cardClicks: mergeById(current.cardClicks, p.cardClicks),
          cardLinkVisits: mergeById(current.cardLinkVisits ?? [], p.cardLinkVisits),
          cardPromotionLinks: mergeById(current.cardPromotionLinks ?? [], p.cardPromotionLinks),
          subscriptions: mergeById(current.subscriptions, p.subscriptions),
          payments: mergeById(current.payments, p.payments),
          banners: mergeById(current.banners, p.banners),
          featuredCreatorIds: p.featuredCreatorIds?.length
            ? p.featuredCreatorIds
            : current.featuredCreatorIds,
          platformUsers: mergeById(current.platformUsers, p.platformUsers),
          educationApplications: mergeById(
            current.educationApplications,
            p.educationApplications,
          ),
          instructorApplications: mergeById(
            current.instructorApplications,
            p.instructorApplications,
          ),
          promotionPool: mergeById(current.promotionPool ?? [], p.promotionPool),
          promoterParticipations: mergeById(
            current.promoterParticipations ?? [],
            p.promoterParticipations,
          ),
          referralRecords: mergeReferralRecords(current.referralRecords ?? [], p.referralRecords),
        };
      },
    },
  ),
);

export function getLinksForCard(cardId: string, links: CardLink[]) {
  return [...links.filter((l) => l.card_id === cardId)].sort((a, b) => a.sort_order - b.sort_order);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-가-힣]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
