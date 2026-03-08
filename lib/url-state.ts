import { type MapState, type Place } from "@/lib/types";

type EncodedPlace = {
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

type EncodedMapPayload = {
  i?: string;
  n: string;
  p: EncodedPlace[];
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

function packPayload(mapId: string, mapName: string, places: Place[]): EncodedMapPayload {
  return {
    i: mapId,
    n: mapName,
    p: places.map((place) => ({
      i: place.id,
      n: place.name,
      a: place.lat,
      o: place.lng,
      r: place.rating,
      v: place.reviewCount,
      h: place.hours,
      p: place.placeId,
      d: place.address,
      t: place.notes,
      u: place.sourceUrl,
    })),
  };
}

function unpackPayload(payload: EncodedMapPayload): MapState {
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

export function decodeMapStateParam(encoded: string) {
  try {
    const decoded = decodeURIComponent(decodeBase64Url(encoded));
    const parsed = JSON.parse(decoded) as EncodedMapPayload;

    return unpackPayload(parsed);
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
