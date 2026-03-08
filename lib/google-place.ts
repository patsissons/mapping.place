import { type Place } from "@/lib/types";

type ParsedGooglePlaceInput = {
  name: string;
  placeId?: string;
  sourceUrl?: string;
  address?: string;
  lat?: number;
  lng?: number;
};

function cleanText(value: string) {
  return decodeURIComponent(value)
    .replace(/\+/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCoordinates(value: string) {
  const atMatch = value.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);

  if (atMatch) {
    return {
      lat: Number(atMatch[1]),
      lng: Number(atMatch[2]),
    };
  }

  const bangMatch = value.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);

  if (bangMatch) {
    return {
      lat: Number(bangMatch[1]),
      lng: Number(bangMatch[2]),
    };
  }

  return null;
}

function extractPlaceId(value: string) {
  const match = value.match(/(?:place_id:)?(ChI[\w-]+)/);

  return match?.[1];
}

function hasCoordinates(place: Place) {
  return (
    typeof place.lat === "number" &&
    typeof place.lng === "number" &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

function hasConfiguredHours(place: Place) {
  return Object.values(place.hours).some((hours) => hours.enabled);
}

function parseCoordinatePair(value: string | null) {
  if (!value) {
    return null;
  }

  const [lat, lng] = value.split(",").map(Number);

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function deriveNameFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const placeIndex = parts.indexOf("place");

  if (placeIndex < 0 || !parts[placeIndex + 1]) {
    return undefined;
  }

  return cleanText(parts[placeIndex + 1]);
}

export function parseGooglePlaceInput(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const looksLikeUrl = looksLikeGoogleMapsUrl(trimmed);

  if (!looksLikeUrl) {
    const placeId = extractPlaceId(trimmed) ?? (isGooglePlaceId(trimmed) ? trimmed : undefined);

    return {
      name: placeId ? `Google place ${placeId.slice(0, 8)}` : "Google Maps input",
      placeId,
      address: placeId ? undefined : trimmed,
    } satisfies ParsedGooglePlaceInput;
  }

  const url = normalizeGoogleMapsUrl(trimmed);

  const placeId =
    extractPlaceId(trimmed) ??
    extractPlaceId(url?.searchParams.get("query_place_id") ?? "") ??
    extractPlaceId(url?.searchParams.get("place_id") ?? "") ??
    extractPlaceId(url?.searchParams.get("q") ?? "") ??
    extractPlaceId(url?.searchParams.get("query") ?? "");

  const queryLabel = url?.searchParams.get("q") ?? url?.searchParams.get("query");
  const name =
    deriveNameFromPath(url?.pathname ?? "") ??
    (queryLabel && !queryLabel.startsWith("place_id:")
      ? cleanText(queryLabel)
      : undefined) ??
    (placeId ? `Google place ${placeId.slice(0, 8)}` : "Google Maps link");

  const address =
    queryLabel && !queryLabel.startsWith("place_id:") ? cleanText(queryLabel) : undefined;
  const coordinates =
    extractCoordinates(trimmed) ??
    parseCoordinatePair(url?.searchParams.get("ll") ?? null) ??
    parseCoordinatePair(url?.searchParams.get("center") ?? null) ??
    parseCoordinatePair(url?.searchParams.get("viewpoint") ?? null);

  return {
    name,
    placeId,
    sourceUrl: trimmed,
    address,
    lat: coordinates?.lat,
    lng: coordinates?.lng,
  } satisfies ParsedGooglePlaceInput;
}

export function isGooglePlaceId(value?: string): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{10,}$/.test(value.trim());
}

export function looksLikeGoogleMapsUrl(value: string) {
  const trimmed = value.trim();

  return (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.includes("google.") ||
    trimmed.includes("maps.app.goo.gl")
  );
}

export function normalizeGoogleMapsUrl(value: string) {
  const trimmed = value.trim();

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

export function markGooglePlaceHydrationPending(place: Place): Place {
  return {
    ...place,
    hydration: {
      provider: "google-places",
      status: "pending",
      updatedAt: new Date().toISOString(),
    },
  };
}

export function markGooglePlaceHydrationFailed(
  place: Place,
  error: string,
): Place {
  return {
    ...place,
    hydration: {
      provider: "google-places",
      status: "failed",
      error,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function placeNeedsGoogleHydration(place: Place) {
  if (!isGooglePlaceId(place.placeId)) {
    return false;
  }

  if (
    place.hydration?.status === "pending" ||
    place.hydration?.status === "hydrated" ||
    place.hydration?.status === "failed"
  ) {
    return false;
  }

  return (
    !hasCoordinates(place) ||
    place.rating <= 0 ||
    place.reviewCount <= 0 ||
    !hasConfiguredHours(place) ||
    place.name.startsWith("Google place ")
  );
}
