import { createEmptyHours } from "@/lib/place-data";
import { createId } from "@/lib/utils";
import {
  type MapState,
  type Place,
  type PlaceUrlMetadata,
} from "@/lib/types";

type LegacyEncodedPlace = {
  i: string;
  n: string;
  r: number;
  v: number;
  h: Place["hours"];
  a?: number;
  o?: number;
  p?: string;
  d?: string;
  t?: string;
  u?: string;
};

type LegacyEncodedMapPayload = {
  i?: string;
  n: string;
  p: LegacyEncodedPlace[];
};

type EncodedPlaceReference = {
  p: string;
  m?: PlaceUrlMetadata;
};

type EncodedMapPayload = {
  v: 2;
  i?: string;
  n: string;
  p: EncodedPlaceReference[];
};

export const MAP_STATE_PARAM = "m";

function encodeBase64Url(value: string) {
  const base64 =
    typeof btoa === "function"
      ? btoa(value)
      : Buffer.from(value, "utf8").toString("base64");

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return typeof atob === "function"
    ? atob(padded)
    : Buffer.from(padded, "base64").toString("utf8");
}

function createPlaceholderPlace(placeId: string, metadata?: PlaceUrlMetadata): Place {
  return {
    id: createId("place"),
    placeId,
    name: `Google place ${placeId.slice(0, 8)}`,
    notes: metadata?.notes,
    rating: 0,
    reviewCount: 0,
    hours: createEmptyHours(),
  };
}

function getPlaceUrlMetadata(place: Place) {
  const metadata: PlaceUrlMetadata = {};

  if (place.notes?.trim()) {
    metadata.notes = place.notes.trim();
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function packPayload(mapId: string, mapName: string, places: Place[]): EncodedMapPayload {
  return {
    v: 2,
    i: mapId,
    n: mapName,
    p: places
      .filter((place) => typeof place.placeId === "string" && place.placeId.length > 0)
      .map((place) => ({
        p: place.placeId!,
        m: getPlaceUrlMetadata(place),
      })),
  };
}

function unpackCompactPayload(payload: EncodedMapPayload): MapState {
  return {
    mapId: payload.i ?? "",
    mapName: payload.n,
    places: payload.p
      .filter((place) => typeof place.p === "string" && place.p.length > 0)
      .map((place) => createPlaceholderPlace(place.p, place.m)),
  };
}

function unpackLegacyPayload(payload: LegacyEncodedMapPayload): MapState {
  return {
    mapId: payload.i ?? "",
    mapName: payload.n,
    places: payload.p.map((place) => ({
      id: place.i,
      name: place.n,
      lat: place.a,
      lng: place.o,
      rating: place.r,
      reviewCount: place.v,
      hours: place.h,
      placeId: place.p,
      address: place.d,
      notes: place.t,
      sourceUrl: place.u,
    })),
  };
}

function isCompactPayload(
  payload: EncodedMapPayload | LegacyEncodedMapPayload,
): payload is EncodedMapPayload {
  return "v" in payload && payload.v === 2;
}

export function decodeMapStateParam(encoded: string) {
  try {
    const decoded = decodeURIComponent(decodeBase64Url(encoded));
    const parsed = JSON.parse(decoded) as EncodedMapPayload | LegacyEncodedMapPayload;

    if (isCompactPayload(parsed)) {
      return unpackCompactPayload(parsed);
    }

    return unpackLegacyPayload(parsed);
  } catch {
    return null;
  }
}

export function readMapStateFromSearchParams(searchParams: URLSearchParams) {
  const encoded = searchParams.get(MAP_STATE_PARAM);

  if (!encoded) {
    return null;
  }

  return decodeMapStateParam(encoded);
}

export function readMapStateFromUrl(searchParams: URLSearchParams) {
  return readMapStateFromSearchParams(searchParams);
}

export function writeMapStateToUrl(
  mapId: string,
  mapName: string,
  places: Place[],
) {
  const payload = packPayload(mapId, mapName, places);
  const encoded = encodeBase64Url(encodeURIComponent(JSON.stringify(payload)));
  const url = new URL(window.location.href);

  url.searchParams.set(MAP_STATE_PARAM, encoded);
  window.history.replaceState({}, "", url);

  return url.toString();
}

export function clearMapStateFromUrl() {
  const url = new URL(window.location.href);

  url.searchParams.delete(MAP_STATE_PARAM);
  window.history.replaceState({}, "", url);

  return url.toString();
}
