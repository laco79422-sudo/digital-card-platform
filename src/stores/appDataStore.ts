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
  CardLink,
  CardView,
  CreatorProfile,
  EducationApplication,
  InstructorApplication,
  MainBanner,
  Payment,
  ServiceApplication,
  ServiceRequest,
  Subscription,
} from "@/types/domain";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

function mergeById<T extends { id: string }>(seed: T[], stored: T[] | undefined): T[] {
  if (!stored?.length) return [...seed];
  const map = new Map<string, T>();
  for (const s of seed) map.set(s.id, s);
  for (const p of stored) map.set(p.id, p);
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
  subscriptions: Subscription[];
  payments: Payment[];
  banners: MainBanner[];
  featuredCreatorIds: string[];
  platformUsers: typeof SAMPLE_USERS;
  educationApplications: EducationApplication[];
  instructorApplications: InstructorApplication[];

  setBusinessCards: (cards: BusinessCard[]) => void;
  upsertBusinessCard: (card: BusinessCard) => void;
  removeBusinessCard: (id: string) => void;
  setCardLinks: (cardId: string, links: CardLink[]) => void;
  addCardView: (view: CardView) => void;
  addCardClick: (click: CardClick) => void;
  upsertServiceRequest: (r: ServiceRequest) => void;
  addApplication: (a: ServiceApplication) => void;
  upsertCreatorProfile: (c: CreatorProfile) => void;
  setFeaturedCreatorIds: (ids: string[]) => void;
  setBanners: (b: MainBanner[]) => void;
  addEducationApplication: (a: EducationApplication) => void;
  addInstructorApplication: (a: InstructorApplication) => void;
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
      subscriptions: [...SAMPLE_SUBSCRIPTIONS],
      payments: [...SAMPLE_PAYMENTS],
      banners: [...SAMPLE_BANNERS],
      featuredCreatorIds: [...FEATURED_CREATOR_IDS],
      platformUsers: [...SAMPLE_USERS],
      educationApplications: [],
      instructorApplications: [],

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
    }),
    {
      name: "linko-app-data",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({
        businessCards: state.businessCards,
        cardLinks: state.cardLinks,
        creators: state.creators,
        serviceRequests: state.serviceRequests,
        applications: state.applications,
        cardViews: state.cardViews,
        cardClicks: state.cardClicks,
        subscriptions: state.subscriptions,
        payments: state.payments,
        banners: state.banners,
        featuredCreatorIds: state.featuredCreatorIds,
        platformUsers: state.platformUsers,
        educationApplications: state.educationApplications,
        instructorApplications: state.instructorApplications,
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
