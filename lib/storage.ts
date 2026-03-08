import { type Place, type SavedMap } from "@/lib/types";
import { createId, createUlid } from "@/lib/utils";

const STORAGE_KEY = "mapping.place.saved-maps";

function normalizePlace(place: Place) {
  return {
    ...place,
    id: place.id || createId("place"),
  } satisfies Place;
}

function normalizeSavedMap(savedMap: SavedMap) {
  return {
    ...savedMap,
    id: savedMap.id || createUlid(),
    emoji: savedMap.emoji?.trim() || undefined,
    places: savedMap.places.map(normalizePlace),
  } satisfies SavedMap;
}

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

    return parsed
      .map(normalizeSavedMap)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
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

export function clearSavedMaps() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function upsertSavedMap(savedMaps: SavedMap[], nextMap: SavedMap) {
  const remaining = savedMaps.filter((savedMap) => savedMap.id !== nextMap.id);
  const updated = [nextMap, ...remaining];

  return updated.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}
