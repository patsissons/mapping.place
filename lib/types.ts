export const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];
export type PinMode = "rating" | "reviews" | "status";
export type SortOption =
  | "name:asc"
  | "name:desc"
  | "rating:asc"
  | "rating:desc"
  | "reviews:asc"
  | "reviews:desc";

export type DailyHours = {
  enabled: boolean;
  open: string;
  close: string;
};

export type OpeningHours = Record<DayKey, DailyHours>;

export type Place = {
  id: string;
  placeId?: string;
  name: string;
  address?: string;
  notes?: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  hours: OpeningHours;
};

export type SavedMapSource =
  | {
      kind: "scratch";
    }
  | {
      kind: "google-import";
      sourceMapId: string;
      sourceMapName: string;
    };

export type SavedMap = {
  name: string;
  places: Place[];
  updatedAt: string;
  source: SavedMapSource;
};

export type PlaceDraft = {
  name: string;
  placeId: string;
  address: string;
  notes: string;
  lat: string;
  lng: string;
  rating: string;
  reviewCount: string;
  hours: OpeningHours;
};
