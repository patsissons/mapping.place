import { type SavedMap } from "@/lib/types";

const STORAGE_KEY = "mapping.place.saved-maps";

export function loadSavedMaps() {
  if (typeof window === "undefined") {
    return [] as SavedMap[];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [] as SavedMap[];
  }

  try {
    const parsed = JSON.parse(raw) as SavedMap[];

    return parsed.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  } catch {
    return [] as SavedMap[];
  }
}

export function writeSavedMaps(savedMaps: SavedMap[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMaps));
}

export function upsertSavedMap(savedMaps: SavedMap[], nextMap: SavedMap) {
  const remaining = savedMaps.filter(
    (savedMap) => savedMap.name !== nextMap.name,
  );
  const updated = [nextMap, ...remaining];

  return updated.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}
