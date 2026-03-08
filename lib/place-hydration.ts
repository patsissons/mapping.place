import "server-only";

import { createEmptyHours, createStarterPlaces, DEFAULT_MAP_NAME } from "@/lib/place-data";
import {
  isGooglePlaceId,
  markGooglePlaceHydrationFailed,
} from "@/lib/google-place";
import { createUlid } from "@/lib/utils";
import {
  DAY_KEYS,
  type DailyHours,
  type InitialMapState,
  type OpeningHours,
  type Place,
} from "@/lib/types";
import { readMapStateFromSearchParams } from "@/lib/url-state";

const GOOGLE_PLACE_ENDPOINT = "https://places.googleapis.com/v1/places";
const GOOGLE_PLACE_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "regularOpeningHours.periods",
].join(",");

type SearchParamsRecord = Record<string, string | string[] | undefined>;

type GooglePlaceTimePoint = {
  day?: number;
  hour?: number;
  minute?: number;
};

type GooglePlaceResponse = {
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: {
    periods?: Array<{
      open?: GooglePlaceTimePoint;
      close?: GooglePlaceTimePoint;
    }>;
  };
};

export type PlaceHydrationResult = {
  ok: boolean;
  status: number;
  place: Place;
  error?: string;
};

function toUrlSearchParams(input: SearchParamsRecord | URLSearchParams) {
  if (input instanceof URLSearchParams) {
    return input;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      searchParams.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    }
  }

  return searchParams;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toTimeValue(point: GooglePlaceTimePoint | undefined) {
  if (!point || !isFiniteNumber(point.hour) || !isFiniteNumber(point.minute)) {
    return null;
  }

  return `${`${point.hour}`.padStart(2, "0")}:${`${point.minute}`.padStart(2, "0")}`;
}

function mergeDailyHours(current: DailyHours, open: string, close: string): DailyHours {
  if (!current.enabled) {
    return {
      enabled: true,
      open,
      close,
    };
  }

  return {
    enabled: true,
    open: open < current.open ? open : current.open,
    close: close > current.close ? close : current.close,
  };
}

function buildOpeningHours(
  periods:
    | Array<{
        open?: GooglePlaceTimePoint;
        close?: GooglePlaceTimePoint;
      }>
    | undefined,
) {
  const openingHours = createEmptyHours();

  for (const period of periods ?? []) {
    const open = period.open;

    if (!isFiniteNumber(open?.day)) {
      continue;
    }

    const dayKey = DAY_KEYS[open.day];

    if (!dayKey) {
      continue;
    }

    const openTime = toTimeValue(open) ?? "00:00";
    const closeTime =
      period.close?.day === open.day ? toTimeValue(period.close) ?? "23:59" : "23:59";

    openingHours[dayKey] = mergeDailyHours(openingHours[dayKey], openTime, closeTime);
  }

  return openingHours;
}

function hasEnabledHours(hours: OpeningHours) {
  return Object.values(hours).some((entry) => entry.enabled);
}

function getHydratedPlace(place: Place, data: GooglePlaceResponse): Place {
  const hours = buildOpeningHours(data.regularOpeningHours?.periods);

  return {
    ...place,
    name: data.displayName?.text?.trim() || place.name,
    address: data.formattedAddress ?? place.address,
    lat: isFiniteNumber(data.location?.latitude) ? data.location.latitude : place.lat,
    lng: isFiniteNumber(data.location?.longitude) ? data.location.longitude : place.lng,
    rating: isFiniteNumber(data.rating) ? data.rating : place.rating,
    reviewCount: isFiniteNumber(data.userRatingCount)
      ? data.userRatingCount
      : place.reviewCount,
    hours: hasEnabledHours(hours) ? hours : place.hours,
    hydration: {
      provider: "google-places",
      status: "hydrated",
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function hydrateGooglePlaceReference(
  place: Place,
): Promise<PlaceHydrationResult> {
  if (!isGooglePlaceId(place.placeId)) {
    return {
      ok: true,
      status: 200,
      place,
    };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    const error = "Google Places API key is not configured.";

    return {
      ok: false,
      status: 503,
      error,
      place: markGooglePlaceHydrationFailed(place, error),
    };
  }

  try {
    const response = await fetch(
      `${GOOGLE_PLACE_ENDPOINT}/${encodeURIComponent(place.placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": GOOGLE_PLACE_FIELD_MASK,
        },
        next: {
          revalidate: 60 * 60 * 24,
        },
      },
    );

    if (!response.ok) {
      const error =
        response.status === 404
          ? "Google Place ID was not found."
          : `Google Places lookup failed with status ${response.status}.`;

      return {
        ok: false,
        status: response.status,
        error,
        place: markGooglePlaceHydrationFailed(place, error),
      };
    }

    const data = (await response.json()) as GooglePlaceResponse;

    return {
      ok: true,
      status: 200,
      place: getHydratedPlace(place, data),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Places lookup failed.";

    return {
      ok: false,
      status: 502,
      error: message,
      place: markGooglePlaceHydrationFailed(place, message),
    };
  }
}

export async function hydratePlaces(places: Place[]) {
  const results = await Promise.all(
    places.map((place) => hydrateGooglePlaceReference(place)),
  );

  return results.map((result) => result.place);
}

export async function resolveInitialMapState(
  searchParamsInput: SearchParamsRecord | URLSearchParams,
): Promise<InitialMapState> {
  const searchParams = toUrlSearchParams(searchParamsInput);
  const decodedMap = readMapStateFromSearchParams(searchParams);

  if (!decodedMap) {
    return {
      mapId: createUlid(),
      mapName: DEFAULT_MAP_NAME,
      places: createStarterPlaces(),
      source: "default",
    };
  }

  return {
    mapId: decodedMap.mapId || createUlid(),
    mapName: decodedMap.mapName,
    places: await hydratePlaces(decodedMap.places),
    source: "url",
  };
}
