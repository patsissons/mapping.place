import "server-only";

import { createEmptyHours, createStarterPlaces, DEFAULT_MAP_NAME } from "@/lib/place-data";
import {
  isGooglePlaceId,
  looksLikeGoogleMapsUrl,
  markGooglePlaceHydrationFailed,
  normalizeGoogleMapsUrl,
  parseGooglePlaceInput,
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
const GOOGLE_PLACE_TEXT_SEARCH_ENDPOINT =
  "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_PLACE_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "regularOpeningHours.periods",
].join(",");
const GOOGLE_PLACE_TEXT_SEARCH_FIELD_MASK = "places.id";

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

type GooglePlaceSearchCandidate = {
  id?: string;
};

type GooglePlaceTextSearchResponse = {
  places?: GooglePlaceSearchCandidate[];
};

type PlaceIdSearchResult =
  | {
      placeId: string;
    }
  | {
      error: string;
    };

type PlaceSearchResult =
  | {
      places: GooglePlaceSearchCandidate[];
    }
  | {
      error: string;
    };

export type PlaceHydrationResult = {
  ok: boolean;
  status: number;
  place: Place;
  error?: string;
};

export type ResolvedGooglePlaceInput =
  | {
      kind: "place-id" | "google-url" | "short-url";
      input: string;
      placeId: string;
      sourceUrl?: string;
    }
  | {
      kind: "unsupported";
      input: string;
      error: string;
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

function getGooglePlacesApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY;
}

async function searchTextForPlaces(
  textQuery: string,
  options?: {
    latitude?: number;
    longitude?: number;
    pageSize?: number;
  },
): Promise<PlaceSearchResult> {
  const apiKey = getGooglePlacesApiKey();

  if (!apiKey) {
    return {
      error: "Google Places API key is not configured.",
    } as const;
  }

  try {
    const body: {
      textQuery: string;
      pageSize: number;
      locationBias?: {
        circle: {
          center: {
            latitude: number;
            longitude: number;
          };
          radius: number;
        };
      };
    } = {
      textQuery,
      pageSize: options?.pageSize ?? 1,
    };

    if (
      isFiniteNumber(options?.latitude) &&
      isFiniteNumber(options?.longitude)
    ) {
      body.locationBias = {
        circle: {
          center: {
            latitude: options.latitude,
            longitude: options.longitude,
          },
          radius: 500,
        },
      };
    }

    const response = await fetch(GOOGLE_PLACE_TEXT_SEARCH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": GOOGLE_PLACE_TEXT_SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      return {
        error: `Google Places text search failed with status ${response.status}.`,
      } as const;
    }

    const data = (await response.json()) as GooglePlaceTextSearchResponse;
    const places = (data.places ?? []).filter((candidate) =>
      isGooglePlaceId(candidate.id),
    );

    if (!places.length) {
      return {
        error: "No Google Place matched that input.",
      } as const;
    }

    return {
      places,
    } as const;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Google Places text search failed.",
      } as const;
  }
}

async function searchTextForPlaceId(
  textQuery: string,
  options?: {
    latitude?: number;
    longitude?: number;
  },
): Promise<PlaceIdSearchResult> {
  const result = await searchTextForPlaces(textQuery, options);

  if ("error" in result) {
    return result;
  }

  return {
    placeId: result.places[0]!.id!,
  } as const;
}

async function resolvePlaceIdFromUrlSearchFallback(
  input: string,
  redirectedInput: string,
): Promise<ResolvedGooglePlaceInput> {
  const redirectedPlace = parseGooglePlaceInput(redirectedInput);
  const textQuery = redirectedPlace?.name?.trim();

  if (!textQuery || textQuery.startsWith("Google place ")) {
    return {
      kind: "unsupported",
      input,
      error: "Could not resolve a search query from that shared URL.",
    };
  }

  const result = await searchTextForPlaceId(textQuery, {
    latitude: redirectedPlace?.lat,
    longitude: redirectedPlace?.lng,
  });

  if ("error" in result) {
    return {
      kind: "unsupported",
      input,
      error: result.error,
    };
  }

  return {
    kind: "short-url",
    input,
    placeId: result.placeId,
    sourceUrl: input,
  };
}

async function resolvePlaceIdFromGoogleUrl(
  input: string,
): Promise<ResolvedGooglePlaceInput> {
  const parsed = parseGooglePlaceInput(input);

  if (isGooglePlaceId(parsed?.placeId)) {
    return {
      kind: "google-url",
      input,
      placeId: parsed.placeId,
      sourceUrl: parsed.sourceUrl ?? input,
    };
  }

  const normalizedUrl = normalizeGoogleMapsUrl(input);

  if (!normalizedUrl) {
    return {
      kind: "unsupported",
      input,
      error: "Could not parse this Google Maps URL.",
    };
  }

  try {
    const response = await fetch(normalizedUrl.toString(), {
      redirect: "follow",
      cache: "no-store",
    });
    const redirectedInput = response.url;
    const redirectedPlace = parseGooglePlaceInput(redirectedInput);

    if (isGooglePlaceId(redirectedPlace?.placeId)) {
      return {
        kind: normalizedUrl.hostname === "maps.app.goo.gl" ? "short-url" : "google-url",
        input,
        placeId: redirectedPlace.placeId,
        sourceUrl: input,
      };
    }

    return resolvePlaceIdFromUrlSearchFallback(input, redirectedInput);
  } catch (error) {
    return {
      kind: "unsupported",
      input,
      error:
        error instanceof Error
          ? error.message
          : "Could not resolve that Google Maps URL.",
    };
  }
}

export async function resolveGooglePlaceInput(
  input: string,
): Promise<ResolvedGooglePlaceInput> {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      kind: "unsupported",
      input,
      error: "Input is required.",
    };
  }

  if (isGooglePlaceId(trimmed)) {
    return {
      kind: "place-id",
      input: trimmed,
      placeId: trimmed,
    };
  }

  if (looksLikeGoogleMapsUrl(trimmed)) {
    return resolvePlaceIdFromGoogleUrl(trimmed);
  }

  return {
    kind: "unsupported",
    input: trimmed,
    error: "Enter a Google Place ID or a Google Maps share URL.",
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

  const apiKey = getGooglePlacesApiKey();

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
  const decodedMap = await readMapStateFromSearchParams(searchParams);

  if (!decodedMap) {
    return {
      mapId: createUlid(),
      mapName: DEFAULT_MAP_NAME,
      mapEmoji: undefined,
      places: createStarterPlaces(),
      source: "default",
    };
  }

  return {
    mapId: decodedMap.mapId || createUlid(),
    mapName: decodedMap.mapName,
    mapEmoji: decodedMap.mapEmoji,
    places: await hydratePlaces(decodedMap.places),
    source: "url",
  };
}
