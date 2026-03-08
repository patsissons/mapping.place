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

  const looksLikeUrl =
    /^https?:\/\//i.test(trimmed) ||
    trimmed.includes("google.") ||
    trimmed.includes("maps.app.goo.gl");

  if (!looksLikeUrl) {
    const placeId = extractPlaceId(trimmed) ?? trimmed;

    return {
      name: `Google place ${placeId.slice(0, 8)}`,
      placeId,
    } satisfies ParsedGooglePlaceInput;
  }

  let url: URL | null = null;

  try {
    url = new URL(trimmed);
  } catch {
    try {
      url = new URL(`https://${trimmed}`);
    } catch {
      url = null;
    }
  }

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
