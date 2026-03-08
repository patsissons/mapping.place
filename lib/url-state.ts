import { type Place } from "@/lib/types";

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

const PARAM_NAME = "m";

function encodeBase64Url(value: string) {
  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return atob(padded);
}

function packPayload(
  mapId: string,
  mapName: string,
  places: Place[],
): EncodedMapPayload {
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

function unpackPayload(payload: EncodedMapPayload) {
  return {
    mapId: payload.i,
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

export function readMapStateFromUrl(searchParams: URLSearchParams) {
  const encoded = searchParams.get(PARAM_NAME);

  if (!encoded) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(decodeBase64Url(encoded));
    const parsed = JSON.parse(decoded) as EncodedMapPayload;

    return unpackPayload(parsed);
  } catch {
    return null;
  }
}

export function writeMapStateToUrl(
  mapId: string,
  mapName: string,
  places: Place[],
) {
  const payload = packPayload(mapId, mapName, places);
  const encoded = encodeBase64Url(encodeURIComponent(JSON.stringify(payload)));
  const url = new URL(window.location.href);

  url.searchParams.set(PARAM_NAME, encoded);
  window.history.replaceState({}, "", url);

  return url.toString();
}

export function clearMapStateFromUrl() {
  const url = new URL(window.location.href);

  url.searchParams.delete(PARAM_NAME);
  window.history.replaceState({}, "", url);

  return url.toString();
}
