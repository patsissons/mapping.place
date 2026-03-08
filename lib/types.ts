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

export type PlaceHydration = {
  provider: "google-places";
  status: "pending" | "hydrated" | "failed";
  updatedAt: string;
  error?: string;
};

export type Place = {
  id: string;
  placeId?: string;
  sourceUrl?: string;
  name: string;
  address?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  rating: number;
  reviewCount: number;
  hours: OpeningHours;
  hydration?: PlaceHydration;
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
  id: string;
  name: string;
  emoji?: string;
  places: Place[];
  updatedAt: string;
  source: SavedMapSource;
};

export type PlaceDraft = {
  googleInput: string;
};

export type MapState = {
  mapId: string;
  mapName: string;
  mapEmoji?: string;
  places: Place[];
};

export type InitialMapState = MapState & {
  source: "default" | "url";
};
