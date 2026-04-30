import { create } from "zustand";

function normalizePath(p: string): string {
  const t = p.replace(/\/$/, "") || "/";
  return t || "/";
}

function parseRef(search: string): string | null {
  const raw = new URLSearchParams(search).get("ref");
  const trimmed = raw?.trim();
  return trimmed || null;
}

function snapshotFromBrowser(): { normalizedPath: string; refFromLocation: string | null } {
  if (typeof window === "undefined") {
    return { normalizedPath: "/", refFromLocation: null };
  }
  const pathname = window.location.pathname || "/";
  const search = window.location.search || "";
  return {
    normalizedPath: normalizePath(pathname),
    refFromLocation: parseRef(search),
  };
}

type ReferralLandingRouteState = {
  normalizedPath: string;
  refFromLocation: string | null;
  applyLocation: (pathname: string, search: string) => void;
};

export const useReferralLandingRouteStore = create<ReferralLandingRouteState>((set) => ({
  ...snapshotFromBrowser(),
  applyLocation: (pathname, search) => {
    set({
      normalizedPath: normalizePath(pathname),
      refFromLocation: parseRef(search),
    });
  },
}));
