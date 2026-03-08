import { type OpeningHours, type Place, type PlaceDraft } from "@/lib/types";

export const DEFAULT_MAP_NAME = "Weekend shortlist";

export const DAY_LABELS = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
} as const;

export function createDefaultHours(): OpeningHours {
  return {
    sunday: { enabled: false, open: "09:00", close: "17:00" },
    monday: { enabled: true, open: "09:00", close: "17:00" },
    tuesday: { enabled: true, open: "09:00", close: "17:00" },
    wednesday: { enabled: true, open: "09:00", close: "17:00" },
    thursday: { enabled: true, open: "09:00", close: "17:00" },
    friday: { enabled: true, open: "09:00", close: "18:00" },
    saturday: { enabled: true, open: "09:00", close: "18:00" },
  };
}

export function createEmptyHours(): OpeningHours {
  return {
    sunday: { enabled: false, open: "09:00", close: "17:00" },
    monday: { enabled: false, open: "09:00", close: "17:00" },
    tuesday: { enabled: false, open: "09:00", close: "17:00" },
    wednesday: { enabled: false, open: "09:00", close: "17:00" },
    thursday: { enabled: false, open: "09:00", close: "17:00" },
    friday: { enabled: false, open: "09:00", close: "17:00" },
    saturday: { enabled: false, open: "09:00", close: "17:00" },
  };
}

export function createBlankPlaceDraft(): PlaceDraft {
  return {
    googleInput: "",
  };
}

export function createStarterPlaces(): Place[] {
  return [];
}
