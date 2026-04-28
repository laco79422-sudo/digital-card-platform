import type { CardDesignType } from "@/types/domain";

export const CARD_DESIGN_LABEL: Record<CardDesignType, string> = {
  simple: "심플",
  business: "비즈니스",
  emotional: "감성",
};

export function normalizeCardDesignType(value: unknown): CardDesignType {
  if (value === "business" || value === "emotional" || value === "simple") return value;
  return "simple";
}
